using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Slotly.Application.Common.Interfaces;

namespace Slotly.Infrastructure.Authentication;

public sealed class CurrentUserService(IHttpContextAccessor httpContextAccessor) : ICurrentUserService
{
    private ClaimsPrincipal? User => httpContextAccessor.HttpContext?.User;

    public Guid? UserId
    {
        get
        {
            var value = User?.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User?.FindFirstValue("sub");
            return Guid.TryParse(value, out var id) ? id : null;
        }
    }

    public Guid? TenantId
    {
        get
        {
            var value = User?.FindFirstValue("tenant_id");
            return Guid.TryParse(value, out var id) ? id : null;
        }
    }

    public string? Email => User?.FindFirstValue(ClaimTypes.Email) ?? User?.FindFirstValue("email");

    public string? Role => User?.FindFirstValue(ClaimTypes.Role) ?? User?.FindFirstValue("role");

    public bool IsAuthenticated => User?.Identity?.IsAuthenticated ?? false;
}
