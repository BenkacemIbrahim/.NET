using FluentAssertions;
using Slotly.Domain.Tenants;

namespace Slotly.Domain.Tests.Tenants;

public sealed class TenantTests
{
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
