using Microsoft.AspNetCore.SignalR;

namespace Slotly.Api.Realtime;

public sealed class BookingChangePublisher(IHubContext<AvailabilityHub> hubContext)
{
    public Task PublishAsync(
        Guid tenantId,
        Guid bookingId,
        Guid serviceId,
        Guid staffId,
        DateTimeOffset startsAt,
        string change,
        CancellationToken cancellationToken)
    {
        var date = DateOnly.FromDateTime(startsAt.UtcDateTime);
        return hubContext.Clients.Group(AvailabilityGroups.For(tenantId, serviceId, date))
            .SendAsync(
                "SlotChanged",
                new SlotChangedMessage(bookingId, serviceId, staffId, date, change, startsAt),
                cancellationToken);
    }
}
