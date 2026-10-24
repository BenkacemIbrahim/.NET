using Microsoft.AspNetCore.Authorization;
using Slotly.Application.Common.Interfaces;
using Slotly.Domain.Users;

namespace Slotly.Infrastructure.Authentication;

public static class AuthorizationPolicies
{
    public const string PlatformAdminOnly = "PlatformAdminOnly";
    public const string TenantOwnerOnly = "TenantOwnerOnly";
    public const string StaffOnly = "StaffOnly";
    public const string CustomerOnly = "CustomerOnly";
    public const string ActiveTenantOnly = "ActiveTenantOnly";
}

public sealed class MustBelongToActiveTenantRequirement : IAuthorizationRequirement;

public sealed class TenantAuthorizationHandler(
    ITenantContext tenantContext)
    : AuthorizationHandler<MustBelongToActiveTenantRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        MustBelongToActiveTenantRequirement requirement)
    {
        if (context.User.IsInRole(UserRole.PlatformAdmin.ToString()))
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        var tenantClaim = context.User.FindFirst("tenant_id")?.Value;
        if (Guid.TryParse(tenantClaim, out var userTenantId)
            && tenantContext.TenantId.HasValue
            && userTenantId == tenantContext.TenantId.Value)
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}
