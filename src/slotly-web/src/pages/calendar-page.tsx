import FullCalendar, { type CalendarRef } from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import interactionPlugin from "@fullcalendar/react/interaction";
import classicThemePlugin from "@fullcalendar/react/themes/classic";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";

import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/classic/theme.css";

import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { cn } from "../lib/cn";
import { PageTitle, useBookings } from "./admin";

interface StatusBadge {
  label: string;
  cardClass: string;
}

const statusBadges: Record<number, StatusBadge> = {
  1: {
    label: "Pending",
    cardClass: "border-l-[3px] border-warning bg-warning/10 text-foreground",
  },
  2: {
    label: "Confirmed",
    cardClass: "border-l-[3px] border-primary bg-primary/10 text-foreground",
  },
  3: {
    label: "Cancelled",
    cardClass: "border-l-[3px] border-destructive bg-destructive/10 text-muted-foreground line-through",
  },
  4: {
    label: "Completed",
    cardClass: "border-l-[3px] border-success bg-success/10 text-foreground",
  },
  5: {
    label: "No show",
    cardClass: "border-l-[3px] border-muted-foreground bg-muted text-muted-foreground",
  },
};

export default function CalendarPage() {
  const bookings = useBookings();
  const calendarRef = useRef<CalendarRef>(null);
  const [currentTitle, setCurrentTitle] = useState("");
  const [activeView, setActiveView] = useState<"timeGridDay" | "timeGridWeek" | "dayGridMonth">("timeGridWeek");

  const handlePrev = () => calendarRef.current?.getApi().prev();
  const handleNext = () => calendarRef.current?.getApi().next();
  const handleToday = () => calendarRef.current?.getApi().today();
  const handleViewChange = (viewName: "timeGridDay" | "timeGridWeek" | "dayGridMonth") => {
    setActiveView(viewName);
    calendarRef.current?.getApi().changeView(viewName);
  };

  return (
    <div className="space-y-5">
      <PageTitle title="Calendar" />

      {/* Modern High-End Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Navigation Controls: Prev, Today, Next */}
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9 rounded-lg border border-border bg-card hover:bg-muted"
            onClick={handlePrev}
            title="Previous"
          >
            <ChevronLeft className="size-4 text-foreground" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 rounded-lg border border-border bg-card px-4 text-xs font-semibold text-foreground hover:bg-muted"
            onClick={handleToday}
          >
            Today
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9 rounded-lg border border-border bg-card hover:bg-muted"
            onClick={handleNext}
            title="Next"
          >
            <ChevronRight className="size-4 text-foreground" />
          </Button>
        </div>

        {/* Current Date / Month Title */}
        <div className="flex items-center gap-2">
          <CalendarIcon className="size-4 text-primary" />
          <h2 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
            {currentTitle || "Schedule"}
          </h2>
        </div>

        {/* View Switcher: Day | Week | Month */}
        <div className="inline-flex rounded-lg border border-border bg-muted p-1">
          {(
            [
              { id: "timeGridDay", label: "Day" },
              { id: "timeGridWeek", label: "Week" },
              { id: "dayGridMonth", label: "Month" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleViewChange(item.id)}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                activeView === item.id
                  ? "border border-border bg-card text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar View Container */}
      <Card className="overflow-hidden border border-border bg-card p-2 sm:p-5">
        <FullCalendar
          ref={calendarRef}
          plugins={[classicThemePlugin, dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={false}
          datesSet={(dateInfo) => setCurrentTitle(dateInfo.view.title)}
          slotMinTime="08:00:00"
          slotMaxTime="20:00:00"
          scrollTime="08:30:00"
          slotDuration="00:30:00"
          eventMinHeight={38}
          allDaySlot={false}
          nowIndicator={true}
          expandRows={true}
          dayHeaderFormat={{ weekday: "short", day: "numeric" }}
          events={(bookings.data ?? []).map((booking) => {
            const status = booking.status ?? 2;
            const badge = statusBadges[status] ?? statusBadges[2];
            return {
              id: booking.id,
              title: `${badge.label} Session`,
              start: booking.startsAt,
              end: booking.endsAt,
              extendedProps: {
                status,
                id: booking.id,
              },
            };
          })}
          eventContent={(info) => {
            const statusNum = (info.event.extendedProps.status as number) ?? 2;
            const badge = statusBadges[statusNum] ?? statusBadges[2];
            return (
              <div
                className={cn(
                  "flex h-full w-full cursor-pointer flex-col justify-center overflow-hidden rounded-md px-2 py-1 text-xs",
                  badge.cardClass,
                )}
              >
                <div className="flex items-center gap-1 overflow-hidden leading-tight">
                  <span className="truncate font-bold tracking-tight">
                    {info.event.title}
                  </span>
                </div>
                <div className="mt-0.5 text-[10px] font-medium opacity-90 tabular-nums">
                  {info.timeText}
                </div>
              </div>
            );
          }}
        />
      </Card>
    </div>
  );
}
