namespace Slotly.Application.Bookings;

public interface IAvailabilityEngine
{
    IReadOnlyCollection<AvailableSlot> FindAvailableSlots(AvailabilitySearch search);
}
