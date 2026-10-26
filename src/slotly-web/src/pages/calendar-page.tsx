import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import interactionPlugin from "@fullcalendar/react/interaction";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import { Card } from "../components/ui/card";
import { PageTitle, useBookings } from "./admin";

const bookingStatuses: Record<number, string> = {
  1: "Pending",
  2: "Confirmed",
  3: "Cancelled",
  4: "Completed",
  5: "No show",
};

export default function CalendarPage() {
  const bookings = useBookings();
  return (
    <div>
      <PageTitle
        title="Calendar"
        description="See your team's schedule at a glance."
      />
      <Card className="mt-7 p-3 sm:p-5">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          height="auto"
          nowIndicator
          events={(bookings.data ?? []).map((booking) => ({
            id: booking.id,
            title: bookingStatuses[booking.status ?? 0] ?? "Booking",
            start: booking.startsAt,
            end: booking.endsAt,
            className: "slotly-event",
          }))}
        />
      </Card>
    </div>
  );
}
