using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Slotly.Api.IntegrationTests;

public sealed class SlotlyWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting(
            "ConnectionStrings:SlotlyDatabase",
            "Host=localhost;Port=1;Database=unused;Username=unused;Password=unused");
    }
}
