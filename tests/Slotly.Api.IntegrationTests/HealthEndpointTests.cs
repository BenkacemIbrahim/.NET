using System.Net;
using FluentAssertions;

namespace Slotly.Api.IntegrationTests;

public sealed class HealthEndpointTests : IClassFixture<SlotlyWebApplicationFactory>, IDisposable
{
    private readonly HttpClient _client;

    public HealthEndpointTests(SlotlyWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task HealthEndpointReturnsHealthy()
    {
        using var response = await _client.GetAsync("/health", CancellationToken.None);
        var content = await response.Content.ReadAsStringAsync(CancellationToken.None);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        content.Should().Be("Healthy");
    }

    public void Dispose() => _client.Dispose();
}
