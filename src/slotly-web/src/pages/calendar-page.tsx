import FullCalendar, { type CalendarRef } from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import interactionPlugin from "@fullcalendar/react/interaction";
import classicThemePlugin from "@fullcalendar/react/themes/classic";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  Clock,
  Filter,
  HelpCircle,
  LayoutGrid,
  List,
  Search,
  Settings,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/classic/theme.css";

import { Card } from "../components/ui/card";
import { ThemeToggle } from "../components/theme-toggle";
import { cn } from "../lib/cn";
import { useBookings, useTenantSettings } from "./admin";

interface StatusBadge {
  label: string;
  cardClass: string;
}

const statusBadges: Record<number, StatusBadge> = {
  1: {
    label: "Pending",
    cardClass: "border-l-[3px] border-amber-500 bg-amber-500/10 text-white",
  },
  2: {
    label: "Confirmed",
    cardClass: "border-l-[3px] border-[#0069FF] bg-[#0069FF]/10 text-white",
  },
  3: {
    label: "Cancelled",
    cardClass: "border-l-[3px] border-rose-500 bg-rose-500/10 text-gray-400 line-through",
  },
  4: {
    label: "Completed",
    cardClass: "border-l-[3px] border-emerald-500 bg-emerald-500/10 text-white",
  },
  5: {
    label: "No show",
    cardClass: "border-l-[3px] border-gray-500 bg-gray-500/10 text-gray-400",
  },
};

export default function CalendarPage() {
  const bookings = useBookings();
  const tenantSettings = useTenantSettings();
  const tenantSlug = tenantSettings.data?.slug || "northstar-health";
  const calendarRef = useRef<CalendarRef>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [filterType, setFilterType] = useState<"slotly" | "all">("slotly");
  const [dateRange, setDateRange] = useState<"today" | "upcoming" | "week" | "last_week">("today");
  const [searchQuery, setSearchQuery] = useState("");

  const meetings = useMemo(() => {
    return bookings.data ?? [];
  }, [bookings.data]);

  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesId = m.id?.toLowerCase().includes(query);
        const matchesCustomer = m.customerName?.toLowerCase().includes(query);
        const matchesService = m.serviceName?.toLowerCase().includes(query);
        const matchesStaff = m.staffName?.toLowerCase().includes(query);
        const matchesEmail = m.customerEmail?.toLowerCase().includes(query);
        if (!matchesId && !matchesCustomer && !matchesService && !matchesStaff && !matchesEmail) {
          return false;
        }
      }
      if (dateRange === "today") {
        const d = new Date(m.startsAt!);
        const now = new Date();
        return d.toDateString() === now.toDateString();
      }
      if (dateRange === "upcoming") {
        return new Date(m.startsAt!) >= new Date();
      }
      if (dateRange === "week") {
        const d = new Date(m.startsAt!);
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        return d >= startOfWeek && d <= endOfWeek;
      }
      if (dateRange === "last_week") {
        const d = new Date(m.startsAt!);
        const now = new Date();
        const startOfLastWeek = new Date(now);
        startOfLastWeek.setDate(now.getDate() - now.getDay() - 7);
        startOfLastWeek.setHours(0, 0, 0, 0);
        const endOfLastWeek = new Date(startOfLastWeek);
        endOfLastWeek.setDate(startOfLastWeek.getDate() + 7);
        return d >= startOfLastWeek && d <= endOfLastWeek;
      }
      return true;
    });
  }, [meetings, searchQuery, dateRange]);

  return (
    <div className="space-y-6 text-white">
      {/* Top Header: Calendar Title + Settings & Layout icons (Image 2) */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-white">Calendar</h1>

        <div className="flex items-center gap-2">
          <ThemeToggle className="size-9 rounded-lg border-[#1C283A] bg-[#111A28] text-gray-400 hover:text-white hover:bg-[#162234]" />
          <button
            onClick={() => toast.info("Slotly Help Center is available 24/7.")}
            className="grid size-9 place-items-center rounded-lg border border-[#1C283A] text-gray-400 hover:text-white hover:bg-[#111A28]"
            title="Help"
          >
            <HelpCircle className="size-4" />
          </button>
          <button
            onClick={() => toast.info("Calendar settings")}
            className="grid size-9 place-items-center rounded-lg border border-[#1C283A] text-gray-400 hover:text-white hover:bg-[#111A28] transition-colors"
            title="Calendar settings"
          >
            <Settings className="size-4" />
          </button>
          <button
            onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
            className="grid size-9 place-items-center rounded-lg border border-[#1C283A] text-gray-400 hover:text-white hover:bg-[#111A28] transition-colors"
            title={viewMode === "list" ? "Switch to Grid view" : "Switch to List view"}
          >
            {viewMode === "list" ? <LayoutGrid className="size-4" /> : <List className="size-4" />}
          </button>
        </div>
      </div>

      {/* Toolbar: My Slotly + Search + Filter + All meetings / Slotly only toggle (Image 2) */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b border-[#1C283A] pb-4">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Dropdown: My Slotly */}
          <button className="flex h-10 items-center gap-2 rounded-xl border border-[#1C283A] bg-[#111A28] px-3.5 text-xs font-semibold text-white hover:bg-[#162234]">
            <span>My Slotly</span>
            <ChevronDown className="size-3.5 text-gray-400" />
          </button>

          {/* Search meetings */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search meetings"
              className="h-10 w-52 sm:w-64 rounded-xl border border-[#1C283A] bg-[#111A28] pl-9 pr-3 text-xs text-white placeholder:text-gray-500 focus:border-[#0069FF] focus:outline-none"
            />
          </div>

          {/* Filter */}
          <button className="flex h-10 items-center gap-1.5 rounded-xl border border-[#1C283A] bg-[#111A28] px-3.5 text-xs font-semibold text-white hover:bg-[#162234]">
            <Filter className="size-3.5 text-gray-400" />
            <span>Filter</span>
            <ChevronDown className="size-3 text-gray-400" />
          </button>
        </div>

        {/* Toggle: All meetings | Slotly only (Image 2) */}
        <div className="inline-flex rounded-xl border border-[#1C283A] bg-[#090E17] p-1">
          <button
            onClick={() => setFilterType("all")}
            className={cn(
              "rounded-lg px-4 py-1.5 text-xs font-semibold transition-all",
              filterType === "all"
                ? "bg-[#111A28] text-white"
                : "text-gray-400 hover:text-white"
            )}
          >
            All meetings
          </button>
          <button
            onClick={() => setFilterType("slotly")}
            className={cn(
              "rounded-lg px-4 py-1.5 text-xs font-semibold transition-all",
              filterType === "slotly"
                ? "bg-[#111A28] text-white"
                : "text-gray-400 hover:text-white"
            )}
          >
            Slotly only
          </button>
        </div>
      </div>

      {/* Date & Range Row: Date dropdown, Today, Upcoming, This week, Last week, Count (Image 2) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Current Date Button */}
          <button className="flex h-9 items-center gap-1.5 rounded-xl border border-[#1C283A] bg-[#111A28] px-3 text-xs font-semibold text-white">
            <span>{new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
            <ChevronDown className="size-3 text-gray-400" />
          </button>

          {/* Pills */}
          <div className="flex items-center gap-1.5">
            {[
              ["today", "Today"],
              ["upcoming", "Upcoming"],
              ["week", "This week"],
              ["last_week", "Last week"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setDateRange(key as any)}
                className={cn(
                  "h-8 rounded-full px-3.5 text-xs font-bold transition-all",
                  dateRange === key
                    ? "bg-white text-[#0B1A2C] shadow-sm"
                    : "border border-[#1C283A] bg-[#111A28] text-[#8B9CB0] hover:text-white hover:bg-[#162234]"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-[#8B9CB0]">
          Displaying {filteredMeetings.length} meetings
        </div>
      </div>

      {/* View Content: List (with empty state from Image 2) or FullCalendar Grid */}
      {viewMode === "list" ? (
        filteredMeetings.length === 0 ? (
          /* Empty State Matching Image 2 Precisely */
          <div className="rounded-3xl border border-[#1C283A] bg-[#111A28] p-8 sm:p-14">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              {/* Left Column: Heading, description, CTA */}
              <div className="space-y-5">
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
                  Prepare for your perfect first meeting here
                </h2>
                <p className="text-sm text-[#8B9CB0] leading-relaxed">
                  Once you get your first meeting booked, this is where you'll be able to review invitee details, add private notes, reschedule, follow-up, or mark invitees as no-shows.
                </p>
                <div className="pt-1">
                  <Link
                    to={`/book/${tenantSlug}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#4D9BFF] hover:underline"
                  >
                    <HelpCircle className="size-3.5" />
                    <span>Learn more &gt;</span>
                  </Link>
                </div>
                <div className="pt-2">
                  <Link
                    to={`/book/${tenantSlug}`}
                    target="_blank"
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-xs font-bold text-[#0B1A2C] shadow-md hover:bg-neutral-100 transition-colors"
                  >
                    <CalendarIcon className="size-4 text-[#0B1A2C]" />
                    <span>Schedule your first meeting</span>
                  </Link>
                </div>
              </div>

              {/* Right Column: Visual illustration mockup (Image 2) */}
              <div className="relative flex items-center justify-center py-6">
                {/* Background blue amorphous shape */}
                <div className="absolute inset-0 m-auto h-56 w-72 rounded-full bg-blue-500/10 blur-2xl" />

                <div className="relative flex flex-col items-center gap-4">
                  {/* Confirmed pill card with avatar */}
                  <div className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-xl text-[#0B1A2C] -rotate-3 transition-transform hover:rotate-0">
                    <div className="size-10 rounded-full overflow-hidden bg-neutral-200">
                      <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
                        alt="Participant"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-[#0B1A2C]">Confirmed</p>
                      <p className="text-[11px] text-gray-500 flex items-center gap-1">
                        <CalendarIcon className="size-3 text-[#0069FF]" /> Google Meet
                      </p>
                    </div>
                  </div>

                  {/* Overlapping browser window card */}
                  <div className="w-72 rounded-2xl bg-white p-5 shadow-2xl text-[#0B1A2C] rotate-2 transition-transform hover:rotate-0 border border-gray-100">
                    <div className="flex items-center gap-1.5 border-b border-gray-100 pb-3">
                      <span className="size-2 rounded-full bg-red-400" />
                      <span className="size-2 rounded-full bg-yellow-400" />
                      <span className="size-2 rounded-full bg-emerald-400" />
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <span className="size-2.5 rounded-full bg-purple-600" />
                      <span className="text-xs font-bold text-[#0B1A2C]">Scheduled with you</span>
                    </div>
                    <div className="mt-3 rounded-xl bg-blue-50/70 p-3 text-xs text-[#0069FF] font-semibold flex items-center gap-1.5">
                      <Clock className="size-3.5" />
                      <span>Add meeting notes</span>
                    </div>
                    <div className="mt-3 space-y-1.5">
                      <div className="h-1.5 w-full bg-gray-200 rounded-full" />
                      <div className="h-1.5 w-3/4 bg-gray-200 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* List of meetings */
          <div className="divide-y divide-[#1C283A] rounded-2xl border border-[#1C283A] bg-[#111A28] p-4">
            {filteredMeetings.map((item) => {
              const status = item.status ?? 2;
              const badge = statusBadges[status] ?? statusBadges[2];
              const initials = (item.customerName || item.serviceName || "A")
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 px-2 hover:bg-[#162234]/40 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="grid size-11 place-items-center rounded-2xl bg-[#0069FF]/20 text-[#4D9BFF] font-bold text-sm shrink-0">
                      {initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white">
                          {item.customerName || `Appointment #${item.id?.slice(0, 8)}`}
                        </h3>
                        {item.customerEmail && (
                          <span className="text-xs text-[#8B9CB0]">
                            ({item.customerEmail})
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-[#8B9CB0]">
                        <span className="text-white font-medium">{item.serviceName || "Consultation"}</span>
                        {item.staffName && <span> • with {item.staffName}</span>}
                        <span> • </span>
                        {new Date(item.startsAt!).toLocaleString([], {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn("rounded-full px-3 py-1 text-xs font-bold", badge.cardClass)}>
                      {badge.label}
                    </span>
                    <Link
                      to="/admin/bookings"
                      className="rounded-lg border border-[#1C283A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#162234]"
                    >
                      Manage
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* FullCalendar Grid View */
        <Card className="overflow-hidden border border-[#1C283A] bg-[#111A28] p-4 sm:p-6 text-white">
          <FullCalendar
            ref={calendarRef}
            plugins={[classicThemePlugin, dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={false}
            slotMinTime="08:00:00"
            slotMaxTime="20:00:00"
            scrollTime="08:30:00"
            slotDuration="00:30:00"
            eventMinHeight={38}
            allDaySlot={false}
            nowIndicator={true}
            expandRows={true}
            dayHeaderFormat={{ weekday: "short", day: "numeric" }}
            events={meetings.map((booking) => {
              const status = booking.status ?? 2;
              const badge = statusBadges[status] ?? statusBadges[2];
              const title = booking.customerName
                ? `${booking.customerName} - ${booking.serviceName || "Session"}`
                : `${badge.label} Session`;
              return {
                id: booking.id,
                title,
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
                  <span className="truncate font-bold tracking-tight">
                    {info.event.title}
                  </span>
                  <span className="mt-0.5 text-[10px] font-medium opacity-90 tabular-nums">
                    {info.timeText}
                  </span>
                </div>
              );
            }}
          />
        </Card>
      )}
    </div>
  );
}
