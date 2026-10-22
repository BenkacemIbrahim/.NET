using Slotly.Domain.Common;
using Slotly.Domain.ValueObjects;

namespace Slotly.Domain.Services;

public sealed class Service : Entity, ITenantOwned
{
    private int _bufferMinutes;
    private int _durationMinutes;
    private decimal _priceAmount;
    private string _priceCurrency = string.Empty;

    private Service()
    {
    }

    private Service(
        Guid tenantId,
        string name,
        TimeSpan duration,
        Money price,
        TimeSpan bufferTime)
    {
        TenantId = DomainGuard.NotEmpty(tenantId, nameof(tenantId));
        Name = DomainGuard.NotBlank(name, nameof(name), 200);
        SetScheduling(duration, bufferTime);
        SetPrice(price);
        IsActive = true;
    }

    public Guid TenantId { get; private set; }

    public string Name { get; private set; } = string.Empty;

    public TimeSpan Duration => TimeSpan.FromMinutes(_durationMinutes);

    public Money Price => new(_priceAmount, _priceCurrency);

    public TimeSpan BufferTime => TimeSpan.FromMinutes(_bufferMinutes);

    public bool IsActive { get; private set; }

    public static Service Create(
        Guid tenantId,
        string name,
        TimeSpan duration,
        Money price,
        TimeSpan bufferTime)
        => new(tenantId, name, duration, price, bufferTime);

    public void Update(
        string name,
        TimeSpan duration,
        Money price,
        TimeSpan bufferTime)
    {
        Name = DomainGuard.NotBlank(name, nameof(name), 200);
        SetScheduling(duration, bufferTime);
        SetPrice(price);
    }

    public void Activate() => IsActive = true;

    public void Deactivate() => IsActive = false;

    private void SetScheduling(TimeSpan duration, TimeSpan bufferTime)
    {
        if (duration <= TimeSpan.Zero || duration.TotalMinutes > 1440 || duration.TotalMinutes % 1 != 0)
        {
            throw new ArgumentOutOfRangeException(
                nameof(duration),
                "Duration must be a positive whole number of minutes not exceeding one day.");
        }

        if (bufferTime < TimeSpan.Zero || bufferTime.TotalMinutes > 1440 || bufferTime.TotalMinutes % 1 != 0)
        {
            throw new ArgumentOutOfRangeException(
                nameof(bufferTime),
                "Buffer time must be a non-negative whole number of minutes not exceeding one day.");
        }

        _durationMinutes = checked((int)duration.TotalMinutes);
        _bufferMinutes = checked((int)bufferTime.TotalMinutes);
    }

    private void SetPrice(Money price)
    {
        ArgumentNullException.ThrowIfNull(price);
        _priceAmount = price.Amount;
        _priceCurrency = price.Currency;
    }
}
