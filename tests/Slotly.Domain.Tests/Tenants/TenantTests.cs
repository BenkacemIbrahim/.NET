using FluentAssertions;
using Slotly.Domain.Tenants;

namespace Slotly.Domain.Tests.Tenants;

public sealed class TenantTests
{
    [Fact]
    public void DepositPolicyCalculatesTenantSpecificAmount()
    {
        var tenant = Tenant.Create("Clinic", "clinic");

        tenant.ConfigurePaymentPolicy(true, 25m);

        tenant.CalculatePaymentAmount(199.99m).Should().Be(50m);
    }

    [Fact]
    public void ConfiguresValidatedBranding()
    {
        var tenant = Tenant.Create("Clinic", "clinic");

        tenant.ConfigureBranding("#2f6fed", "https://cdn.example.com/clinic.svg");

        tenant.PrimaryColor.Should().Be("#2F6FED");
        tenant.LogoUrl.Should().Be("https://cdn.example.com/clinic.svg");
    }

    [Theory]
    [InlineData("blue", null)]
    [InlineData("#12345G", null)]
    [InlineData("#123456", "javascript:alert(1)")]
    public void RejectsUnsafeBranding(string color, string? logoUrl)
    {
        var tenant = Tenant.Create("Clinic", "clinic");

        var act = () => tenant.ConfigureBranding(color, logoUrl);

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void ConfiguresBookingPolicy()
    {
        var tenant = Tenant.Create("Atlas Clinic", "atlas-clinic");

        tenant.ConfigureBookingPolicy("Africa/Casablanca", 12);

        tenant.TimeZoneId.Should().Be("Africa/Casablanca");
        tenant.CancellationWindowHours.Should().Be(12);
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(2161)]
    public void RejectsInvalidCancellationWindow(int hours)
    {
        var tenant = Tenant.Create("Atlas Clinic", "atlas-clinic");

        var act = () => tenant.ConfigureBookingPolicy("UTC", hours);

        act.Should().Throw<ArgumentOutOfRangeException>();
    }
}
