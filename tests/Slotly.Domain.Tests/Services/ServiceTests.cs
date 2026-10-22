using FluentAssertions;
using Slotly.Domain.Services;
using Slotly.Domain.ValueObjects;

namespace Slotly.Domain.Tests.Services;

public sealed class ServiceTests
{
    [Fact]
    public void CreateNormalizesSchedulingAndPrice()
    {
        var service = Service.Create(
            Guid.NewGuid(),
            "Physiotherapy assessment",
            TimeSpan.FromMinutes(45),
            new Money(450.126m, "mad"),
            TimeSpan.FromMinutes(15));

        service.Duration.Should().Be(TimeSpan.FromMinutes(45));
        service.BufferTime.Should().Be(TimeSpan.FromMinutes(15));
        service.Price.Should().Be(new Money(450.13m, "MAD"));
    }

    [Fact]
    public void CreateRejectsFractionalMinuteDuration()
    {
        var act = () => Service.Create(
            Guid.NewGuid(),
            "Consultation",
            TimeSpan.FromSeconds(90),
            new Money(200, "MAD"),
            TimeSpan.Zero);

        act.Should().Throw<ArgumentOutOfRangeException>();
    }
}
