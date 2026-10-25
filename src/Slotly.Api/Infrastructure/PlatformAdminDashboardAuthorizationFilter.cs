using Hangfire.Dashboard;
using Slotly.Domain.Users;

namespace Slotly.Api.Infrastructure;

internal sealed class PlatformAdminDashboardAuthorizationFilter : IDashboardAuthorizationFilter
{
    public bool Authorize(DashboardContext context)
        => context.GetHttpContext().User.Identity?.IsAuthenticated == true
            && context.GetHttpContext().User.IsInRole(UserRole.PlatformAdmin.ToString());
}
