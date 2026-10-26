using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Slotly.Application.Authentication.Commands;
using Slotly.Application.Authentication.Models;
using Slotly.Application.Common.Models;
using Slotly.Application.Management;

namespace Slotly.Api.IntegrationTests;

public sealed class PublicTenantEndpointTests(AuthTestWebApplicationFactory factory)
    : IClassFixture<AuthTestWebApplicationFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task PublicCatalogAndBrandingResolveFromTenantSlugWithoutAuthentication()
    {
        var suffix = Guid.NewGuid().ToString("N")[..10];
        var slug = $"public-{suffix}";
        using var registration = await _client.PostAsJsonAsync(
            "/api/v1/auth/register-tenant",
            new RegisterTenantCommand("Public Clinic", slug, $"owner@{suffix}.example", "Owner", "P@ssword123!"));
        registration.EnsureSuccessStatusCode();
        var auth = (await registration.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions))!;

        using var update = AuthorizedRequest(
            HttpMethod.Put,
            "/api/v1/settings",
            auth,
            new TenantSettingsRequest(
                "Public Clinic",
                "UTC",
                12,
                "#2F6FED",
                "https://cdn.example.com/public-clinic.svg"));
        using var updateResponse = await _client.SendAsync(update);
        updateResponse.StatusCode.Should().Be(HttpStatusCode.OK, await updateResponse.Content.ReadAsStringAsync());

        using var createService = AuthorizedRequest(
            HttpMethod.Post,
            "/api/v1/services",
            auth,
            new ServiceRequest("First visit", 45, 80, "EUR", 10));
        using var createResponse = await _client.SendAsync(createService);
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created, await createResponse.Content.ReadAsStringAsync());

        using var publicTenant = TenantRequest(HttpMethod.Get, "/api/v1/public/tenant", slug);
        using var publicTenantResponse = await _client.SendAsync(publicTenant);
        publicTenantResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var settings = await publicTenantResponse.Content.ReadFromJsonAsync<TenantSettingsDto>(JsonOptions);
        settings!.PrimaryColor.Should().Be("#2F6FED");
        settings.LogoUrl.Should().Be("https://cdn.example.com/public-clinic.svg");

        using var catalog = TenantRequest(HttpMethod.Get, "/api/v1/services?page=1&pageSize=10", slug);
        using var catalogResponse = await _client.SendAsync(catalog);
        catalogResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var services = await catalogResponse.Content.ReadFromJsonAsync<PagedResponse<ServiceDto>>(JsonOptions);
        services!.Items.Should().ContainSingle(service => service.Name == "First visit");
    }

    private static HttpRequestMessage TenantRequest(HttpMethod method, string url, string slug)
    {
        var request = new HttpRequestMessage(method, url);
        request.Headers.Add("X-Tenant", slug);
        return request;
    }

    private static HttpRequestMessage AuthorizedRequest<T>(
        HttpMethod method,
        string url,
        AuthResponse auth,
        T body)
    {
        var request = new HttpRequestMessage(method, url) { Content = JsonContent.Create(body) };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", auth.AccessToken);
        request.Headers.Add("X-Tenant-Id", auth.User.TenantId.ToString());
        return request;
    }
}
