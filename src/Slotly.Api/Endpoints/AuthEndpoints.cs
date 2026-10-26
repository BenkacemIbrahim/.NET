using System.Security.Claims;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Slotly.Application.Authentication.Commands;
using Slotly.Application.Authentication.Models;
using Slotly.Application.Common.Interfaces;
using Slotly.Domain.Staff;
using Slotly.Domain.Tenants;
using Slotly.Domain.Users;
using Slotly.Infrastructure.Authentication;
using Slotly.Infrastructure.Persistence;
using Slotly.Infrastructure.Tenancy;

namespace Slotly.Api.Endpoints;

public static class AuthEndpoints
{
    public static RouteGroupBuilder MapAuthEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/v1/auth")
            .WithTags("Authentication")
            .RequireRateLimiting("auth");

        group.MapPost("/register-tenant", RegisterTenantAsync)
            .AllowAnonymous()
            .Produces<AuthResponse>(StatusCodes.Status201Created)
            .WithName("RegisterTenant")
            .WithSummary("Registers a new tenant, owner user, and returns access and refresh tokens.");

        group.MapPost("/login", LoginAsync)
            .AllowAnonymous()
            .Produces<AuthResponse>()
            .WithName("Login")
            .WithSummary("Authenticates a user within a tenant and issues tokens.");

        group.MapPost("/refresh", RefreshTokenAsync)
            .AllowAnonymous()
            .Produces<AuthResponse>()
            .WithName("RefreshToken")
            .WithSummary("Rotates a refresh token and issues a new access token.");

        group.MapPost("/logout", LogoutAsync)
            .RequireAuthorization()
            .WithName("Logout")
            .WithSummary("Revokes the provided refresh token.");

        group.MapPost("/change-password", ChangePasswordAsync)
            .RequireAuthorization()
            .WithName("ChangePassword")
            .WithSummary("Changes the password for the current authenticated user.");

        group.MapPost("/invite-staff", InviteStaffAsync)
            .RequireAuthorization(AuthorizationPolicies.TenantOwnerOnly)
            .WithName("InviteStaff")
            .WithSummary("Invites a new staff member to the active tenant.");

        group.MapGet("/me", GetCurrentUserAsync)
            .RequireAuthorization()
            .Produces<UserDto>()
            .WithName("GetCurrentUser")
            .WithSummary("Retrieves profile information for the authenticated user.");

        return group;
    }

    private static async Task<IResult> RegisterTenantAsync(
        [FromBody] RegisterTenantCommand command,
        IValidator<RegisterTenantCommand> validator,
        SlotlyDbContext dbContext,
        IPasswordHasher passwordHasher,
        ITokenService tokenService,
        TenantContext tenantContext,
        TimeProvider timeProvider,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(command, cancellationToken);
        if (!validation.IsValid)
        {
            return ValidationProblem(validation);
        }

        var normalizedSlug = command.TenantSlug.Trim().ToLowerInvariant();
        var slugExists = await dbContext.Tenants
            .AnyAsync(t => t.Slug == normalizedSlug, cancellationToken);

        if (slugExists)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status409Conflict,
                title: "Tenant slug already exists",
                detail: $"A tenant with slug '{normalizedSlug}' is already registered.");
        }

        var tenant = Tenant.Create(command.TenantName.Trim(), normalizedSlug);
        dbContext.Tenants.Add(tenant);

        // Must set tenant context before saving so PrepareTrackedEntities can stamp
        // tenant-owned entities (User, Staff, RefreshToken) with the correct TenantId.
        tenantContext.SetTenant(tenant.Id);

        var passwordHash = passwordHasher.HashPassword(null!, command.Password);
        var owner = User.Create(
            tenant.Id,
            command.OwnerEmail.Trim().ToLowerInvariant(),
            command.OwnerDisplayName.Trim(),
            UserRole.TenantOwner,
            passwordHash);

        var staff = Staff.Create(
            tenant.Id,
            owner.Id,
            command.OwnerDisplayName.Trim(),
            command.OwnerEmail.Trim().ToLowerInvariant());

        dbContext.Users.Add(owner);
        dbContext.Staff.Add(staff);

        var ip = httpContext.Connection.RemoteIpAddress?.ToString();
        var accessToken = tokenService.GenerateAccessToken(owner, tenant.Slug);
        var refreshToken = tokenService.GenerateRefreshToken(ip);

        var tokenEntity = RefreshToken.Create(
            tenant.Id,
            owner.Id,
            refreshToken.TokenHash,
            refreshToken.ExpiresAt,
            ip);

        dbContext.RefreshTokens.Add(tokenEntity);

        await dbContext.SaveChangesAsync(cancellationToken);

        var response = new AuthResponse(
            accessToken.Token,
            refreshToken.RawToken,
            accessToken.ExpiresAt,
            new UserDto(owner.Id, owner.TenantId, owner.Email, owner.DisplayName, owner.Role.ToString(), owner.IsActive));

        return Results.Created($"/api/v1/auth/me", response);
    }

    private static async Task<IResult> LoginAsync(
        [FromBody] LoginCommand command,
        IValidator<LoginCommand> validator,
        SlotlyDbContext dbContext,
        IPasswordHasher passwordHasher,
        ITokenService tokenService,
        TenantContext tenantContext,
        TimeProvider timeProvider,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(command, cancellationToken);
        if (!validation.IsValid)
        {
            return ValidationProblem(validation);
        }

        Guid? targetTenantId = tenantContext.TenantId ?? command.TenantId;

        if (!targetTenantId.HasValue && !string.IsNullOrWhiteSpace(command.TenantSlug))
        {
            var slug = command.TenantSlug.Trim().ToLowerInvariant();
            var tenant = await dbContext.Tenants
                .AsNoTracking()
                .SingleOrDefaultAsync(t => t.Slug == slug && t.IsActive, cancellationToken);

            targetTenantId = tenant?.Id;
        }


        if (!targetTenantId.HasValue)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Tenant context required",
                detail: "A tenant must be specified via subdomain, X-Tenant header, or in the login request body.");
        }

        tenantContext.SetTenant(targetTenantId.Value);

        var normalizedEmail = command.Email.Trim().ToLowerInvariant();
        var user = await dbContext.Users
            .IgnoreQueryFilters()
            .SingleOrDefaultAsync(u => u.TenantId == targetTenantId.Value && u.Email == normalizedEmail, cancellationToken);

        if (user is null)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status401Unauthorized,
                title: "Invalid credentials",
                detail: "Invalid email or password.");
        }

        var now = timeProvider.GetUtcNow();

        if (user.IsLockedOut(now))
        {
            return Results.Problem(
                statusCode: StatusCodes.Status423Locked,
                title: "Account locked",
                detail: $"Account is temporarily locked until {user.LockoutEnd:O} due to multiple failed login attempts.");
        }

        if (!user.IsActive)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status401Unauthorized,
                title: "Account deactivated",
                detail: "This user account is deactivated.");
        }

        var isPasswordValid = passwordHasher.VerifyPassword(user, user.PasswordHash, command.Password);
        if (!isPasswordValid)
        {
            user.RecordFailedLogin(now, maxFailedAttempts: 5, TimeSpan.FromMinutes(15));
            await dbContext.SaveChangesAsync(cancellationToken);

            if (user.IsLockedOut(now))
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status423Locked,
                    title: "Account locked",
                    detail: $"Account has been locked until {user.LockoutEnd:O} due to multiple failed login attempts.");
            }

            return Results.Problem(
                statusCode: StatusCodes.Status401Unauthorized,
                title: "Invalid credentials",
                detail: "Invalid email or password.");
        }

        user.RecordSuccessfulLogin();

        var tenantEntity = await dbContext.Tenants
            .AsNoTracking()
            .SingleAsync(t => t.Id == targetTenantId.Value, cancellationToken);

        var ip = httpContext.Connection.RemoteIpAddress?.ToString();
        var accessToken = tokenService.GenerateAccessToken(user, tenantEntity.Slug);
        var refreshToken = tokenService.GenerateRefreshToken(ip);

        var tokenEntity = RefreshToken.Create(
            user.TenantId,
            user.Id,
            refreshToken.TokenHash,
            refreshToken.ExpiresAt,
            ip);

        dbContext.RefreshTokens.Add(tokenEntity);
        await dbContext.SaveChangesAsync(cancellationToken);

        var response = new AuthResponse(
            accessToken.Token,
            refreshToken.RawToken,
            accessToken.ExpiresAt,
            new UserDto(user.Id, user.TenantId, user.Email, user.DisplayName, user.Role.ToString(), user.IsActive));

        return Results.Ok(response);
    }

    private static async Task<IResult> RefreshTokenAsync(
        [FromBody] RefreshTokenCommand command,
        IValidator<RefreshTokenCommand> validator,
        SlotlyDbContext dbContext,
        ITokenService tokenService,
        TenantContext tenantContext,
        TimeProvider timeProvider,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(command, cancellationToken);
        if (!validation.IsValid)
        {
            return ValidationProblem(validation);
        }

        var tokenHash = tokenService.HashRefreshToken(command.RefreshToken.Trim());
        var token = await dbContext.RefreshTokens
            .IgnoreQueryFilters()
            .SingleOrDefaultAsync(t => t.TokenHash == tokenHash, cancellationToken);

        if (token is null)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status401Unauthorized,
                title: "Invalid refresh token",
                detail: "The refresh token was not recognized.");
        }

        tenantContext.SetTenant(token.TenantId);

        var now = timeProvider.GetUtcNow();
        var ip = httpContext.Connection.RemoteIpAddress?.ToString();

        if (token.IsRevoked)
        {
            var activeTokens = await dbContext.RefreshTokens
                .IgnoreQueryFilters()
                .Where(t => t.UserId == token.UserId && t.RevokedAt == null)
                .ToListAsync(cancellationToken);

            foreach (var t in activeTokens)
            {
                t.Revoke(now, ip, "Token reuse detected; family revoked");
            }

            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Problem(
                statusCode: StatusCodes.Status401Unauthorized,
                title: "Token reuse detected",
                detail: "Refresh token reuse detected. All active sessions have been revoked.");
        }

        if (token.IsExpired(now))
        {
            return Results.Problem(
                statusCode: StatusCodes.Status401Unauthorized,
                title: "Refresh token expired",
                detail: "The refresh token has expired. Please log in again.");
        }

        var user = await dbContext.Users
            .IgnoreQueryFilters()
            .SingleOrDefaultAsync(u => u.Id == token.UserId && u.IsActive, cancellationToken);

        if (user is null)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status401Unauthorized,
                title: "User inactive",
                detail: "The user account is no longer active.");
        }

        var tenant = await dbContext.Tenants
            .AsNoTracking()
            .SingleAsync(t => t.Id == token.TenantId, cancellationToken);

        var newRefreshToken = tokenService.GenerateRefreshToken(ip);
        token.Revoke(now, ip, "Rotated on refresh", newRefreshToken.TokenHash);

        var newTokenEntity = RefreshToken.Create(
            token.TenantId,
            user.Id,
            newRefreshToken.TokenHash,
            newRefreshToken.ExpiresAt,
            ip);

        dbContext.RefreshTokens.Add(newTokenEntity);

        var accessToken = tokenService.GenerateAccessToken(user, tenant.Slug);
        await dbContext.SaveChangesAsync(cancellationToken);

        var response = new AuthResponse(
            accessToken.Token,
            newRefreshToken.RawToken,
            accessToken.ExpiresAt,
            new UserDto(user.Id, user.TenantId, user.Email, user.DisplayName, user.Role.ToString(), user.IsActive));

        return Results.Ok(response);
    }

    private static async Task<IResult> LogoutAsync(
        [FromBody] RefreshTokenCommand command,
        IValidator<RefreshTokenCommand> validator,
        SlotlyDbContext dbContext,
        ITokenService tokenService,
        TenantContext tenantContext,
        ICurrentUserService currentUserService,
        TimeProvider timeProvider,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(command, cancellationToken);
        if (!validation.IsValid)
        {
            return ValidationProblem(validation);
        }

        if (!currentUserService.UserId.HasValue)
        {
            return Results.Unauthorized();
        }

        var tokenHash = tokenService.HashRefreshToken(command.RefreshToken.Trim());
        var token = await dbContext.RefreshTokens
            .IgnoreQueryFilters()
            .SingleOrDefaultAsync(
                t => t.TokenHash == tokenHash && t.UserId == currentUserService.UserId.Value,
                cancellationToken);

        if (token is not null && !token.IsRevoked)
        {
            tenantContext.SetTenant(token.TenantId);
            var now = timeProvider.GetUtcNow();
            var ip = httpContext.Connection.RemoteIpAddress?.ToString();
            token.Revoke(now, ip, "User logout");
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        return Results.Ok(new { message = "Logged out successfully." });
    }

    private static async Task<IResult> ChangePasswordAsync(
        [FromBody] ChangePasswordCommand command,
        IValidator<ChangePasswordCommand> validator,
        SlotlyDbContext dbContext,
        IPasswordHasher passwordHasher,
        TenantContext tenantContext,
        ICurrentUserService currentUserService,
        TimeProvider timeProvider,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(command, cancellationToken);
        if (!validation.IsValid)
        {
            return ValidationProblem(validation);
        }

        if (!currentUserService.UserId.HasValue)
        {
            return Results.Unauthorized();
        }

        var user = await dbContext.Users
            .IgnoreQueryFilters()
            .SingleOrDefaultAsync(u => u.Id == currentUserService.UserId.Value, cancellationToken);

        if (user is null)
        {
            return Results.NotFound();
        }

        tenantContext.SetTenant(user.TenantId);

        var isCurrentValid = passwordHasher.VerifyPassword(user, user.PasswordHash, command.CurrentPassword);
        if (!isCurrentValid)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Invalid current password",
                detail: "The current password provided is incorrect.");
        }

        var newHash = passwordHasher.HashPassword(user, command.NewPassword);
        user.SetPasswordHash(newHash);

        var now = timeProvider.GetUtcNow();
        var ip = httpContext.Connection.RemoteIpAddress?.ToString();
        var activeTokens = await dbContext.RefreshTokens
            .IgnoreQueryFilters()
            .Where(t => t.UserId == user.Id && t.RevokedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var t in activeTokens)
        {
            t.Revoke(now, ip, "Password changed");
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.Ok(new { message = "Password changed successfully. Existing sessions have been revoked." });
    }

    private static async Task<IResult> InviteStaffAsync(
        [FromBody] InviteStaffCommand command,
        IValidator<InviteStaffCommand> validator,
        SlotlyDbContext dbContext,
        IPasswordHasher passwordHasher,
        ITenantContext tenantContext,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(command, cancellationToken);
        if (!validation.IsValid)
        {
            return ValidationProblem(validation);
        }

        if (!tenantContext.TenantId.HasValue)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Tenant context required",
                detail: "An active tenant context is required to invite staff.");
        }

        var tenantId = tenantContext.TenantId.Value;
        var normalizedEmail = command.Email.Trim().ToLowerInvariant();

        var existingUser = await dbContext.Users
            .AnyAsync(u => u.TenantId == tenantId && u.Email == normalizedEmail, cancellationToken);

        if (existingUser)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status409Conflict,
                title: "Staff already exists",
                detail: $"A user with email '{normalizedEmail}' already exists in this tenant.");
        }

        var passwordHash = passwordHasher.HashPassword(null!, command.Password);
        var staffUser = User.Create(
            tenantId,
            normalizedEmail,
            command.DisplayName.Trim(),
            UserRole.Staff,
            passwordHash);

        var staffEntity = Staff.Create(
            tenantId,
            staffUser.Id,
            command.DisplayName.Trim(),
            normalizedEmail);

        dbContext.Users.Add(staffUser);
        dbContext.Staff.Add(staffEntity);
        await dbContext.SaveChangesAsync(cancellationToken);

        var dto = new UserDto(
            staffUser.Id,
            staffUser.TenantId,
            staffUser.Email,
            staffUser.DisplayName,
            staffUser.Role.ToString(),
            staffUser.IsActive);

        return Results.Created($"/api/v1/auth/me", dto);
    }

    private static async Task<IResult> GetCurrentUserAsync(
        SlotlyDbContext dbContext,
        ICurrentUserService currentUserService,
        CancellationToken cancellationToken)
    {
        if (!currentUserService.UserId.HasValue)
        {
            return Results.Unauthorized();
        }

        var user = await dbContext.Users
            .IgnoreQueryFilters()
            .SingleOrDefaultAsync(u => u.Id == currentUserService.UserId.Value, cancellationToken);

        if (user is null)
        {
            return Results.NotFound();
        }

        var dto = new UserDto(
            user.Id,
            user.TenantId,
            user.Email,
            user.DisplayName,
            user.Role.ToString(),
            user.IsActive);

        return Results.Ok(dto);
    }

    private static IResult ValidationProblem(ValidationResult validationResult)
    {
        var errors = validationResult.Errors
            .GroupBy(e => e.PropertyName)
            .ToDictionary(
                g => g.Key,
                g => g.Select(e => e.ErrorMessage).ToArray());

        return Results.ValidationProblem(
            errors: errors,
            title: "Validation error",
            detail: "One or more validation errors occurred.",
            statusCode: StatusCodes.Status400BadRequest);
    }
}
