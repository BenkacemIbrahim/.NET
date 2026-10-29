import FullCalendar, { type CalendarRef } from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import interactionPlugin from "@fullcalendar/react/interaction";
import classicThemePlugin from "@fullcalendar/react/themes/classic";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import {
  Calendar as CalendarIcon,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Filter,
  HelpCircle,
  LayoutGrid,
  List,
  Search,
  Settings,
  User,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/classic/theme.css";

import { Card } from "../components/ui/card";
import { ThemeToggle } from "../components/theme-toggle";
import { cn } from "../lib/cn";
import { SidebarToggleButton, useBookings, useTenantSettings } from "./admin";

interface StatusBadge {
  label: string;
  cardClass: string;
}

const statusBadges: Record<number, StatusBadge> = {
  1: {
    label: "Pending",
    cardClass: "border-l-[3px] border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  2: {
    label: "Confirmed",
    cardClass: "border-l-[3px] border-[#0069FF] bg-[#0069FF]/10 text-[#0069FF] dark:text-[#4D9BFF]",
  },
  3: {
    label: "Cancelled",
    cardClass: "border-l-[3px] border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-400 line-through",
  },
  4: {
    label: "Completed",
    cardClass: "border-l-[3px] border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  5: {
    label: "No show",
    cardClass: "border-l-[3px] border-gray-500 bg-gray-500/10 text-gray-700 dark:text-gray-400",
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

  // Interactive Dropdown States
  const [mySlotlyOpen, setMySlotlyOpen] = useState(false);
  const [scope, setScope] = useState<"my" | "team">("my");

  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<number | "all">("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [staffFilter, setStaffFilter] = useState<string>("all");

  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [pickerMonth, setPickerMonth] = useState<Date>(new Date());

  const mySlotlyRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (mySlotlyRef.current && !mySlotlyRef.current.contains(target)) {
        setMySlotlyOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(target)) {
        setFilterOpen(false);
      }
      if (datePickerRef.current && !datePickerRef.current.contains(target)) {
        setDatePickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const meetings = useMemo(() => {
    return bookings.data ?? [];
  }, [bookings.data]);

  // Dynamic filter options
  const servicesList = useMemo(() => {
    const set = new Set<string>();
    meetings.forEach((m) => {
      if (m.serviceName) set.add(m.serviceName);
    });
    return Array.from(set);
  }, [meetings]);

  const staffList = useMemo(() => {
    const set = new Set<string>();
    meetings.forEach((m) => {
      if (m.staffName) set.add(m.staffName);
    });
    return Array.from(set);
  }, [meetings]);

  const activeFilterCount =
    (statusFilter !== "all" ? 1 : 0) +
    (serviceFilter !== "all" ? 1 : 0) +
    (staffFilter !== "all" ? 1 : 0);

  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      // Search Query
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

      // Status Filter
      if (statusFilter !== "all" && m.status !== statusFilter) {
        return false;
      }

      // Service Filter
      if (serviceFilter !== "all" && m.serviceName !== serviceFilter) {
        return false;
      }

      // Staff Filter
      if (staffFilter !== "all" && m.staffName !== staffFilter) {
        return false;
      }

      // Scope Filter (My Slotly vs All Team)
      if (scope === "my" && staffList.length > 1) {
        // In "My Slotly" view, show primary user's appointments (first staff member or unassigned)
        if (m.staffName && m.staffName !== staffList[0]) {
          return false;
        }
      }

      // Date Range Filter
      if (dateRange === "today") {
        const d = new Date(m.startsAt!);
        return d.toDateString() === selectedDate.toDateString();
      }
      if (dateRange === "upcoming") {
        return new Date(m.startsAt!) >= new Date();
      }
      if (dateRange === "week") {
        const d = new Date(m.startsAt!);
        const now = selectedDate;
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        return d >= startOfWeek && d <= endOfWeek;
      }
      if (dateRange === "last_week") {
        const d = new Date(m.startsAt!);
        const now = selectedDate;
        const startOfLastWeek = new Date(now);
        startOfLastWeek.setDate(now.getDate() - now.getDay() - 7);
        startOfLastWeek.setHours(0, 0, 0, 0);
        const endOfLastWeek = new Date(startOfLastWeek);
        endOfLastWeek.setDate(startOfLastWeek.getDate() + 7);
        return d >= startOfLastWeek && d <= endOfLastWeek;
      }
      return true;
    });
  }, [meetings, searchQuery, statusFilter, serviceFilter, staffFilter, scope, staffList, dateRange, selectedDate]);

  // Mini Calendar generation helpers
  const miniCalendarDays = useMemo(() => {
    const year = pickerMonth.getFullYear();
    const month = pickerMonth.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days: { date: Date; isCurrentMonth: boolean; hasMeetings: boolean }[] = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthDays - i);
      days.push({
        date: d,
        isCurrentMonth: false,
        hasMeetings: meetings.some(
          (m) => new Date(m.startsAt!).toDateString() === d.toDateString()
        ),
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      days.push({
        date: d,
        isCurrentMonth: true,
        hasMeetings: meetings.some(
          (m) => new Date(m.startsAt!).toDateString() === d.toDateString()
        ),
      });
    }

    // Next month padding to fill complete weeks (up to 35 or 42 cells)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let day = 1; day <= remaining; day++) {
      const d = new Date(year, month + 1, day);
      days.push({
        date: d,
        isCurrentMonth: false,
        hasMeetings: meetings.some(
          (m) => new Date(m.startsAt!).toDateString() === d.toDateString()
        ),
      });
    }

    return days;
  }, [pickerMonth, meetings]);

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    setDateRange("today");
    setDatePickerOpen(false);
    if (calendarRef.current) {
      calendarRef.current.getApi().gotoDate(date);
    }
  };

  return (
    <div className="space-y-6 text-white">
      {/* Top Header: Calendar Title + Settings & Layout icons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <SidebarToggleButton />
          <h1 className="text-2xl font-bold tracking-tight text-white">Calendar</h1>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle className="size-9 rounded-lg border-gray-200 dark:border-[#1C283A] bg-white dark:bg-[#111A28] text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#162234] shadow-sm transition-colors" />
          <button
            onClick={() => toast.info("Slotly Help Center is available 24/7.")}
            className="grid size-9 place-items-center rounded-lg border border-gray-200 dark:border-[#1C283A] bg-white dark:bg-[#111A28] text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#162234] shadow-sm transition-colors"
            title="Help"
          >
            <HelpCircle className="size-4" />
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("slotly:open-settings"))}
            className="grid size-9 place-items-center rounded-lg border border-gray-200 dark:border-[#1C283A] bg-white dark:bg-[#111A28] text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#162234] shadow-sm transition-colors"
            title="Settings"
          >
            <Settings className="size-4" />
          </button>
          <button
            onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
            className="grid size-9 place-items-center rounded-lg border border-gray-200 dark:border-[#1C283A] bg-white dark:bg-[#111A28] text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#162234] shadow-sm transition-colors"
            title={viewMode === "list" ? "Switch to Grid view" : "Switch to List view"}
          >
            {viewMode === "list" ? <LayoutGrid className="size-4" /> : <List className="size-4" />}
          </button>
        </div>
      </div>

      {/* Toolbar: My Slotly + Search + Filter + All meetings / Slotly only toggle */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b border-gray-200 dark:border-[#1C283A] pb-4">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Dropdown: My Slotly */}
          <div className="relative" ref={mySlotlyRef}>
            <button
              onClick={() => setMySlotlyOpen((prev) => !prev)}
              className="flex h-10 items-center gap-2 rounded-xl border border-gray-200 dark:border-[#1C283A] bg-white dark:bg-[#111A28] px-3.5 text-xs font-semibold text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-[#162234] shadow-sm transition-colors"
            >
              <span>{scope === "my" ? "My Slotly" : "All Team Meetings"}</span>
              <ChevronDown className={cn("size-3.5 text-gray-400 transition-transform", mySlotlyOpen && "rotate-180")} />
            </button>

            {mySlotlyOpen && (
              <div className="absolute left-0 top-12 z-50 w-64 rounded-2xl border border-gray-200 dark:border-[#1C283A] bg-white dark:bg-[#111A28] p-2 shadow-2xl animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Calendar Scope
                </div>
                <button
                  onClick={() => {
                    setScope("my");
                    setMySlotlyOpen(false);
                    toast.success("Switched to My Slotly calendar");
                  }}
                  className={cn(
                    "w-full flex items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors",
                    scope === "my"
                      ? "bg-blue-50 text-[#0069FF] dark:bg-[#0069FF]/10 dark:text-[#4D9BFF]"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#162234]"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <User className="size-3.5" />
                    <span>My Slotly</span>
                  </div>
                  {scope === "my" && <Check className="size-3.5 text-[#0069FF]" />}
                </button>
                <button
                  onClick={() => {
                    setScope("team");
                    setMySlotlyOpen(false);
                    toast.success("Showing all team meetings");
                  }}
                  className={cn(
                    "w-full flex items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors",
                    scope === "team"
                      ? "bg-blue-50 text-[#0069FF] dark:bg-[#0069FF]/10 dark:text-[#4D9BFF]"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#162234]"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Users className="size-3.5" />
                    <span>All Team Meetings</span>
                  </div>
                  {scope === "team" && <Check className="size-3.5 text-[#0069FF]" />}
                </button>

                <div className="my-1.5 border-t border-gray-100 dark:border-[#1C283A]" />

                <Link
                  to={`/book/${tenantSlug}`}
                  target="_blank"
                  onClick={() => setMySlotlyOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#162234] hover:text-[#0069FF] transition-colors"
                >
                  <span>Public Booking Page</span>
                  <ExternalLink className="size-3 text-gray-400" />
                </Link>
                <Link
                  to="/admin/services"
                  onClick={() => setMySlotlyOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#162234] hover:text-[#0069FF] transition-colors"
                >
                  <span>Manage Event Types</span>
                </Link>
              </div>
            )}
          </div>

          {/* Search meetings */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search meetings"
              className="h-10 w-52 sm:w-64 rounded-xl border border-gray-200 dark:border-[#1C283A] bg-white dark:bg-[#111A28] pl-9 pr-3 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-[#0069FF] focus:outline-none shadow-sm transition-colors"
            />
          </div>

          {/* Filter Dropdown */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setFilterOpen((prev) => !prev)}
              className={cn(
                "flex h-10 items-center gap-1.5 rounded-xl border px-3.5 text-xs font-semibold transition-colors shadow-sm",
                activeFilterCount > 0
                  ? "border-[#0069FF] bg-blue-50/50 text-[#0069FF] dark:bg-[#0069FF]/10 dark:text-[#4D9BFF]"
                  : "border-gray-200 dark:border-[#1C283A] bg-white dark:bg-[#111A28] text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-[#162234]"
              )}
            >
              <Filter className="size-3.5 text-gray-400" />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span className="flex size-4 items-center justify-center rounded-full bg-[#0069FF] text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown className={cn("size-3 text-gray-400 transition-transform", filterOpen && "rotate-180")} />
            </button>

            {filterOpen && (
              <div className="absolute left-0 sm:right-0 sm:left-auto top-12 z-50 w-72 rounded-2xl border border-gray-200 dark:border-[#1C283A] bg-white dark:bg-[#111A28] p-4 shadow-2xl animate-in fade-in zoom-in-95 space-y-3.5">
                <div className="flex items-center justify-between pb-1 border-b border-gray-100 dark:border-[#1C283A]">
                  <span className="text-xs font-bold text-gray-900 dark:text-white">Filter Meetings</span>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={() => {
                        setStatusFilter("all");
                        setServiceFilter("all");
                        setStaffFilter("all");
                      }}
                      className="text-[11px] font-semibold text-[#0069FF] hover:underline"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {/* Status Filter */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value === "all" ? "all" : Number(e.target.value))
                    }
                    className="w-full h-8 rounded-lg border border-gray-200 dark:border-[#1C283A] bg-white dark:bg-[#0B111A] px-2.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-[#0069FF]"
                  >
                    <option value="all">All statuses</option>
                    <option value={2}>Confirmed</option>
                    <option value={1}>Pending</option>
                    <option value={4}>Completed</option>
                    <option value={3}>Cancelled</option>
                    <option value={5}>No show</option>
                  </select>
                </div>

                {/* Event Type / Service Filter */}
                {servicesList.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      Event Type
                    </label>
                    <select
                      value={serviceFilter}
                      onChange={(e) => setServiceFilter(e.target.value)}
                      className="w-full h-8 rounded-lg border border-gray-200 dark:border-[#1C283A] bg-white dark:bg-[#0B111A] px-2.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-[#0069FF]"
                    >
                      <option value="all">All event types</option>
                      {servicesList.map((svc) => (
                        <option key={svc} value={svc}>
                          {svc}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Staff Filter */}
                {staffList.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      Staff / Host
                    </label>
                    <select
                      value={staffFilter}
                      onChange={(e) => setStaffFilter(e.target.value)}
                      className="w-full h-8 rounded-lg border border-gray-200 dark:border-[#1C283A] bg-white dark:bg-[#0B111A] px-2.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-[#0069FF]"
                    >
                      <option value="all">All practitioners</option>
                      {staffList.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="pt-1">
                  <button
                    onClick={() => setFilterOpen(false)}
                    className="w-full rounded-xl bg-[#0069FF] py-2 text-xs font-bold text-white shadow-sm hover:bg-[#0056D6] transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Toggle: All meetings | Slotly only */}
        <div className="inline-flex rounded-xl border border-gray-200 dark:border-[#1C283A] bg-gray-100 dark:bg-[#090E17] p-1">
          <button
            onClick={() => setFilterType("all")}
            className={cn(
              "rounded-lg px-4 py-1.5 text-xs font-semibold transition-all",
              filterType === "all"
                ? "bg-white text-gray-900 shadow-sm dark:bg-[#111A28] dark:text-white"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            )}
          >
            All meetings
          </button>
          <button
            onClick={() => setFilterType("slotly")}
            className={cn(
              "rounded-lg px-4 py-1.5 text-xs font-semibold transition-all",
              filterType === "slotly"
                ? "bg-white text-gray-900 shadow-sm dark:bg-[#111A28] dark:text-white"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            )}
          >
            Slotly only
          </button>
        </div>
      </div>

      {/* Date & Range Row: Date dropdown, Today, Upcoming, This week, Last week, Count */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Calendar Date Picker Dropdown Button */}
          <div className="relative" ref={datePickerRef}>
            <button
              onClick={() => {
                setDatePickerOpen((prev) => !prev);
                setPickerMonth(selectedDate);
              }}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 dark:border-[#1C283A] bg-white dark:bg-[#111A28] px-3 text-xs font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-[#162234] shadow-sm transition-colors"
            >
              <CalendarIcon className="size-3.5 text-[#0069FF]" />
              <span>
                {selectedDate.toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <ChevronDown className={cn("size-3 text-gray-400 transition-transform", datePickerOpen && "rotate-180")} />
            </button>

            {datePickerOpen && (
              <div className="absolute left-0 top-11 z-50 w-72 rounded-2xl border border-gray-200 dark:border-[#1C283A] bg-white dark:bg-[#111A28] p-3.5 shadow-2xl animate-in fade-in zoom-in-95">
                {/* Month Navigation */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 dark:border-[#1C283A]">
                  <span className="text-xs font-bold text-gray-900 dark:text-white">
                    {pickerMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        setPickerMonth(
                          new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() - 1, 1)
                        )
                      }
                      className="grid size-6 place-items-center rounded-lg hover:bg-gray-100 dark:hover:bg-[#162234] text-gray-500 hover:text-gray-900 dark:hover:text-white"
                      title="Previous month"
                    >
                      <ChevronLeft className="size-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        setPickerMonth(
                          new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() + 1, 1)
                        )
                      }
                      className="grid size-6 place-items-center rounded-lg hover:bg-gray-100 dark:hover:bg-[#162234] text-gray-500 hover:text-gray-900 dark:hover:text-white"
                      title="Next month"
                    >
                      <ChevronRight className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* Day Names */}
                <div className="grid grid-cols-7 text-center text-[10px] font-bold text-gray-400 mb-1">
                  <span>Su</span>
                  <span>Mo</span>
                  <span>Tu</span>
                  <span>We</span>
                  <span>Th</span>
                  <span>Fr</span>
                  <span>Sa</span>
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {miniCalendarDays.map(({ date, isCurrentMonth, hasMeetings }) => {
                    const isSelected =
                      date.toDateString() === selectedDate.toDateString();
                    const isToday =
                      date.toDateString() === new Date().toDateString();

                    return (
                      <button
                        key={date.toISOString()}
                        onClick={() => handleSelectDate(date)}
                        className={cn(
                          "relative flex flex-col items-center justify-center h-8 rounded-lg text-xs font-medium transition-colors",
                          isSelected
                            ? "bg-[#0069FF] text-white font-bold shadow-xs btn-keep-white"
                            : isCurrentMonth
                              ? "text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#162234]"
                              : "text-gray-300 dark:text-gray-600 hover:bg-gray-50 dark:hover:bg-[#162234]/50",
                          isToday && !isSelected && "ring-1 ring-[#0069FF] font-bold text-[#0069FF]"
                        )}
                      >
                        <span>{date.getDate()}</span>
                        {hasMeetings && (
                          <span
                            className={cn(
                              "size-1 rounded-full",
                              isSelected ? "bg-white" : "bg-[#0069FF]"
                            )}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Quick actions footer */}
                <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-[#1C283A] flex items-center justify-between text-[11px]">
                  <button
                    onClick={() => handleSelectDate(new Date())}
                    className="font-bold text-[#0069FF] hover:underline"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      handleSelectDate(tomorrow);
                    }}
                    className="font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    Tomorrow
                  </button>
                  <button
                    onClick={() => {
                      setDateRange("week");
                      setDatePickerOpen(false);
                    }}
                    className="font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    This week
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Date Range Pills (Today, Upcoming, This week, Last week) */}
          <div className="flex items-center gap-1.5">
            {[
              ["today", "Today"],
              ["upcoming", "Upcoming"],
              ["week", "This week"],
              ["last_week", "Last week"],
            ].map(([key, label]) => {
              const isSelected = dateRange === key;
              return (
                <button
                  key={key}
                  onClick={() => {
                    setDateRange(key as any);
                    if (key === "today") {
                      setSelectedDate(new Date());
                      if (calendarRef.current) {
                        calendarRef.current.getApi().gotoDate(new Date());
                      }
                    }
                  }}
                  className={cn(
                    "h-8 rounded-full px-3.5 text-xs font-bold transition-all",
                    isSelected
                      ? "bg-[#0B1A2C] text-white shadow-sm dark:bg-white dark:text-[#0B1A2C] hover:bg-[#162B46] dark:hover:bg-gray-100 btn-keep-white !text-white dark:!text-[#0B1A2C]"
                      : "border border-gray-200 dark:border-[#1C283A] bg-white dark:bg-[#111A28] text-gray-700 dark:text-[#8B9CB0] hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#162234] shadow-xs"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="text-xs text-gray-500 dark:text-[#8B9CB0] font-medium">
          Displaying {filteredMeetings.length} {filteredMeetings.length === 1 ? "meeting" : "meetings"}
        </div>
      </div>

      {/* View Content: List (with empty state) or FullCalendar Grid */}
      {viewMode === "list" ? (
        filteredMeetings.length === 0 ? (
          /* Empty State */
          <div className="rounded-3xl border border-gray-200 dark:border-[#1C283A] bg-white dark:bg-[#111A28] p-8 sm:p-14 shadow-sm">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              {/* Left Column: Heading, description, CTA */}
              <div className="space-y-5">
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight">
                  Prepare for your perfect first meeting here
                </h2>
                <p className="text-sm text-gray-500 dark:text-[#8B9CB0] leading-relaxed">
                  Once you get your first meeting booked, this is where you'll be able to review invitee details, add private notes, reschedule, follow-up, or mark invitees as no-shows.
                </p>
                <div className="pt-1">
                  <Link
                    to={`/book/${tenantSlug}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#0069FF] dark:text-[#4D9BFF] hover:underline"
                  >
                    <HelpCircle className="size-3.5" />
                    <span>Learn more &gt;</span>
                  </Link>
                </div>
                <div className="pt-2">
                  <Link
                    to={`/book/${tenantSlug}`}
                    target="_blank"
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#0069FF] px-5 text-xs font-bold text-white shadow-md hover:bg-[#0056D6] transition-colors btn-keep-white"
                  >
                    <CalendarIcon className="size-4 text-white" />
                    <span>Schedule your first meeting</span>
                  </Link>
                </div>
              </div>

              {/* Right Column: Visual illustration mockup */}
              <div className="relative flex items-center justify-center py-6">
                <div className="absolute inset-0 m-auto h-56 w-72 rounded-full bg-blue-500/10 blur-2xl" />

                <div className="relative flex flex-col items-center gap-4">
                  <div className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-xl text-[#0B1A2C] -rotate-3 transition-transform hover:rotate-0 border border-gray-100">
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
          <div className="divide-y divide-gray-100 dark:divide-[#1C283A] rounded-2xl border border-gray-200 dark:border-[#1C283A] bg-white dark:bg-[#111A28] p-4 shadow-sm">
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
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 px-3 hover:bg-slate-50 dark:hover:bg-[#162234]/40 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="grid size-11 place-items-center rounded-2xl bg-blue-50 dark:bg-[#0069FF]/20 text-[#0069FF] dark:text-[#4D9BFF] font-bold text-sm shrink-0 border border-blue-100 dark:border-transparent">
                      {initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                          {item.customerName || `Appointment #${item.id?.slice(0, 8)}`}
                        </h3>
                        {item.customerEmail && (
                          <span className="text-xs text-gray-500 dark:text-[#8B9CB0]">
                            ({item.customerEmail})
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-[#8B9CB0]">
                        <span className="text-gray-900 dark:text-white font-medium">{item.serviceName || "Consultation"}</span>
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
                      className="rounded-lg border border-gray-200 dark:border-[#1C283A] bg-white dark:bg-transparent px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-[#162234] transition-colors shadow-sm"
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
        <Card className="overflow-hidden border border-gray-200 dark:border-[#1C283A] bg-white dark:bg-[#111A28] p-4 sm:p-6 text-gray-900 dark:text-white shadow-sm">
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
