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
  pillClass: string;
}

const statusBadges: Record<number, StatusBadge> = {
  1: {
    label: "Pending",
    cardClass: "bg-amber-600/90 text-white border-l-4 border-amber-300 shadow-sm",
    pillClass: "bg-black/20 text-white",
  },
  2: {
    label: "Confirmed",
    cardClass: "bg-blue-600/90 text-white border-l-4 border-blue-300 shadow-sm",
    pillClass: "bg-black/20 text-white",
  },
  3: {
    label: "Cancelled",
    cardClass: "bg-rose-900/60 text-zinc-300 border-l-4 border-rose-500 opacity-60 line-through",
    pillClass: "bg-black/30 text-rose-200",
  },
  4: {
    label: "Completed",
    cardClass: "bg-emerald-600/90 text-white border-l-4 border-emerald-300 shadow-sm",
    pillClass: "bg-black/20 text-white",
  },
  5: {
    label: "No show",
    cardClass: "bg-zinc-700 text-zinc-200 border-l-4 border-zinc-400 opacity-70",
    pillClass: "bg-black/30 text-zinc-300",
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
            className="size-9 rounded-xl border border-border bg-card shadow-sm hover:bg-muted"
            onClick={handlePrev}
            title="Previous"
          >
            <ChevronLeft className="size-4 text-foreground" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 px-4 rounded-xl border border-border bg-card text-xs font-semibold text-foreground shadow-sm hover:bg-muted"
            onClick={handleToday}
          >
            Today
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9 rounded-xl border border-border bg-card shadow-sm hover:bg-muted"
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
        <div className="inline-flex rounded-xl border border-border bg-card p-1 shadow-sm">
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
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar View Container */}
      <Card className="overflow-hidden border border-border bg-card p-2 sm:p-5 shadow-sm">
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
                  "flex h-full w-full flex-col justify-center px-2 py-1 text-xs transition-transform hover:scale-[1.01] overflow-hidden rounded-md cursor-pointer",
                  badge.cardClass,
                )}
              >
                <div className="flex items-center justify-between gap-1 overflow-hidden leading-tight">
                  <span className="truncate font-bold tracking-tight">
                    {info.event.title}
                  </span>
                  <span
                    className={cn(
                      "rounded px-1 py-0.2 text-[9px] font-semibold uppercase tracking-wider shrink-0",
                      badge.pillClass,
                    )}
                  >
                    {badge.label}
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
