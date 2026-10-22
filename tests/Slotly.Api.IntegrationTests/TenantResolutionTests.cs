using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;

namespace Slotly.Api.IntegrationTests;

public sealed class TenantResolutionTests : IClassFixture<SlotlyWebApplicationFactory>, IDisposable
{
    private readonly HttpClient _client;

    public TenantResolutionTests(SlotlyWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task InvalidTenantHeaderReturnsProblemDetails()
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "/health");
        request.Headers.Add("X-Tenant-Id", "not-a-guid");

        using var response = await _client.SendAsync(request, CancellationToken.None);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>(
            CancellationToken.None);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
        problem.Should().NotBeNull();
        problem!.Title.Should().Be("Invalid tenant identifier");
    }

    public void Dispose() => _client.Dispose();
}
