using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Slotly.Domain.Services;
using Slotly.Domain.Tenants;
using Slotly.Domain.ValueObjects;
using Slotly.Infrastructure.Persistence;
using Slotly.Infrastructure.Tenancy;
using Testcontainers.PostgreSql;

namespace Slotly.Api.IntegrationTests;

public sealed class TenantIsolationTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _database = new PostgreSqlBuilder("postgres:16-alpine")
        .WithDatabase("slotly_tenant_tests")
        .WithUsername("slotly")
        .WithPassword("slotly_tests_password")
        .Build();

    public async Task InitializeAsync()
    {
        await _database.StartAsync();
        var tenantContext = new TenantContext();
        await using var context = CreateContext(tenantContext);
        await context.Database.MigrateAsync();
    }

    public Task DisposeAsync() => _database.DisposeAsync().AsTask();

    [Fact]
    public async Task TenantCannotReadOrUpdateAnotherTenantsData()
    {
        var tenantA = Tenant.Create("Tenant A Clinic", "tenant-a");
        var tenantB = Tenant.Create("Tenant B Salon", "tenant-b");

        await using (var context = CreateContext(new TenantContext()))
        {
            context.Tenants.AddRange(tenantA, tenantB);
            await context.SaveChangesAsync();
        }

        await AddServiceAsync(tenantA.Id, "Tenant A Consultation");
        await AddServiceAsync(tenantB.Id, "Tenant B Treatment");

        var tenantAContext = new TenantContext();
        tenantAContext.SetTenant(tenantA.Id);
        await using var contextA = CreateContext(tenantAContext);

        var visibleServices = await contextA.Services.ToListAsync();

        visibleServices.Should().ContainSingle()
            .Which.Name.Should().Be("Tenant A Consultation");

        var tenantBService = await contextA.Services
            .IgnoreQueryFilters()
            .SingleAsync(service => service.TenantId == tenantB.Id);
        tenantBService.Deactivate();

        var saveCrossTenantWrite = async () => await contextA.SaveChangesAsync();

        await saveCrossTenantWrite.Should()
            .ThrowAsync<InvalidOperationException>()
            .WithMessage("Cross-tenant writes are not permitted.");
    }

    [Fact]
    public async Task NewEntityIsAlwaysStampedWithActiveTenant()
    {
        var tenantA = Tenant.Create("Tenant A Gym", "tenant-a-gym");
        var tenantB = Tenant.Create("Tenant B Gym", "tenant-b-gym");

        await using (var context = CreateContext(new TenantContext()))
        {
            context.Tenants.AddRange(tenantA, tenantB);
            await context.SaveChangesAsync();
        }

        var tenantContext = new TenantContext();
        tenantContext.SetTenant(tenantA.Id);
        await using var tenantAContext = CreateContext(tenantContext);
        var spoofedService = CreateService(tenantB.Id, "Spoofed Service");
        tenantAContext.Services.Add(spoofedService);

        await tenantAContext.SaveChangesAsync();

        spoofedService.TenantId.Should().Be(tenantA.Id);
        (await tenantAContext.Services.CountAsync()).Should().Be(1);
    }

    private async Task AddServiceAsync(Guid tenantId, string name)
    {
        var tenantContext = new TenantContext();
        tenantContext.SetTenant(tenantId);
        await using var context = CreateContext(tenantContext);
        context.Services.Add(CreateService(tenantId, name));
        await context.SaveChangesAsync();
    }

    private SlotlyDbContext CreateContext(TenantContext tenantContext)
    {
        var options = new DbContextOptionsBuilder<SlotlyDbContext>()
            .UseNpgsql(_database.GetConnectionString())
            .UseSnakeCaseNamingConvention()
            .Options;

        return new SlotlyDbContext(options, tenantContext, TimeProvider.System);
    }

    private static Service CreateService(Guid tenantId, string name)
        => Service.Create(
            tenantId,
            name,
            TimeSpan.FromMinutes(30),
            new Money(250, "MAD"),
            TimeSpan.FromMinutes(10));
}
