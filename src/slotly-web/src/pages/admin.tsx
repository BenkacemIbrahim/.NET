import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar as CalendarIcon,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Scissors,
  Search,
  Settings,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  useForm,
  type FieldValues,
  type Path,
  type UseFormReturn,
} from "react-hook-form";
import {
  Link,
  Navigate,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { api, apiMessage, type ApiSchemas } from "../api/client";
import { useAuth } from "../auth/auth-context";
import { EmptyState } from "../components/empty-state";
import { ThemeToggle } from "../components/theme-toggle";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { FieldError, Label } from "../components/ui/label";
import { Skeleton } from "../components/ui/skeleton";
import { cn } from "../lib/cn";

type Booking = ApiSchemas["BookingDto"];

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: "MAIN",
    items: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard },
      { href: "/admin/calendar", label: "Calendar", icon: CalendarDays },
      { href: "/admin/bookings", label: "Bookings", icon: Clock },
    ],
  },
  {
    title: "WORKSPACE",
    items: [
      { href: "/admin/services", label: "Services", icon: Scissors },
      { href: "/admin/staff", label: "Team", icon: Users },
      { href: "/admin/schedule", label: "Availability", icon: CalendarIcon },
    ],
  },
  {
    title: "ACCOUNT",
    items: [
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function AdminGuard() {
  const { session } = useAuth();
  return session ? <AdminShell /> : <Navigate to="/login" replace />;
}

export function LoginPage() {
  const { session, login } = useAuth();
  const navigate = useNavigate();
  const schema = z.object({
    tenantSlug: z.string().min(2, "Enter your workspace slug."),
    email: z.email("Enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
  });
  type Login = z.infer<typeof schema>;
  const form = useForm<Login>({
    resolver: zodResolver(schema),
    defaultValues: {
      tenantSlug: "northstar-health",
      email: "amira@northstar.example",
      password: "",
    },
  });

  if (session) return <Navigate to="/admin" replace />;

  return (
    <main className="grid min-h-dvh bg-background lg:grid-cols-2">
      <section className="relative hidden items-center justify-center overflow-hidden border-r border-primary bg-primary p-12 lg:flex">
        <img
          src="/slotly-auth-illustration.png"
          alt=""
          className="h-auto max-h-[82vh] w-full max-w-[540px] object-contain drop-shadow-2xl"
        />
      </section>

      {/* Login Form */}
      <section className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-2.5 font-bold lg:hidden">
              <span className="grid size-8 place-items-center rounded-xl bg-primary text-white text-sm font-bold">
                S
              </span>
              <span className="text-lg tracking-tight">Slotly</span>
            </div>
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
            Sign in to your workspace
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your workspace slug and credentials to manage your team's schedule.
          </p>

          <form
            className="mt-8 space-y-4"
            onSubmit={form.handleSubmit(async (v) => {
              try {
                await login(v.email, v.password, v.tenantSlug);
                navigate("/admin");
              } catch (e) {
                toast.error(
                  apiMessage(e, "Check your workspace, email, and password."),
                );
              }
            })}
          >
            <div className="space-y-1.5">
              <Label htmlFor="tenantSlug">Workspace</Label>
              <Input
                id="tenantSlug"
                placeholder="e.g. northstar-health"
                {...form.register("tenantSlug")}
                aria-invalid={!!form.formState.errors.tenantSlug}
              />
              <FieldError>{form.formState.errors.tenantSlug?.message}</FieldError>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@clinic.example"
                {...form.register("email")}
                aria-invalid={!!form.formState.errors.email}
              />
              <FieldError>{form.formState.errors.email?.message}</FieldError>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...form.register("password")}
                aria-invalid={!!form.formState.errors.password}
              />
              <FieldError>{form.formState.errors.password?.message}</FieldError>
            </div>

            <Button
              className="mt-2 w-full rounded-full"
              size="lg"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>


        </div>
      </section>
    </main>
  );
}

function AdminShell() {
  const [open, setOpen] = useState(false);
  const { session, logout } = useAuth();
  const location = useLocation();

  const allItems: NavItem[] = useMemo(
    () => navGroups.flatMap((group) => group.items),
    [],
  );

  const currentItem =
    allItems.find((item) => item.href === location.pathname) || {
      label: "Workspace",
      href: "/admin",
      icon: LayoutDashboard,
    };

  return (
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-[260px_1fr]">
      {/* Sidebar (YowTrip & Medicore Style) */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-border bg-card transition-transform duration-200 lg:static lg:w-auto lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <Link to="/admin" className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-xl bg-primary text-white font-bold text-sm">
              S
            </span>
            <span className="text-lg font-bold tracking-tight text-foreground">
              Slotly
            </span>
          </Link>
          <Button
            className="lg:hidden"
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Quick Search Input */}
        <div className="p-3">
          <div className="relative flex items-center">
            <Search className="absolute left-3 size-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              readOnly
              placeholder="Search appointments..."
              className="h-9 w-full rounded-xl border border-input bg-muted/40 pl-8 pr-8 text-xs text-foreground placeholder:text-muted-foreground cursor-pointer focus:bg-card"
            />
            <kbd className="absolute right-2.5 rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Categorized Navigation */}
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-2">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.title}
              </p>
              <div className="mt-1 space-y-0.5">
                {group.items.map(({ href, label, icon: Icon }) => (
                  <NavLink
                    end={href === "/admin"}
                    key={href}
                    to={href}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-accent font-semibold text-accent-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )
                    }
                  >
                    <Icon className="size-4 shrink-0" />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile Card (Bottom of Sidebar) */}
        <div className="border-t border-border p-3">
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-2.5">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 font-bold text-xs text-primary">
                {session?.user.displayName?.slice(0, 1) || "U"}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-foreground">
                  {session?.user.displayName}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {session?.user.email}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
              title="Sign out"
              onClick={logout}
            >
              <LogOut className="size-3.5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setOpen(true)}
            >
              <Menu className="size-4" />
            </Button>

            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Workspace</span>
              <ChevronRight className="size-3.5 text-muted-foreground" />
              <span className="font-semibold text-foreground">
                {currentItem.label}
              </span>
            </div>
          </div>

          {/* Right Header Utilities */}
          <div className="flex items-center gap-2.5">
            <Link
              to="/book/northstar-health"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted sm:inline-flex"
            >
              <span>Public booking page</span>
              <ExternalLink className="size-3 text-muted-foreground" />
            </Link>
            <ThemeToggle />
          </div>
        </header>

        {/* View Content */}
        <main className="mx-auto w-full max-w-[1440px] flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function useBookings() {
  return useQuery({
    queryKey: ["bookings"],
    queryFn: async () => {
      const now = new Date();
      const end = new Date(now);
      end.setMonth(end.getMonth() + 2);
      const { data, error } = await api.GET("/api/v1/bookings", {
        params: {
          query: {
            page: 1,
            pageSize: 100,
            startsAfter: new Date(now.setHours(0, 0, 0, 0)).toISOString(),
            startsBefore: end.toISOString(),
          },
        },
      });
      if (!data) throw error;
      return data.items ?? [];
    },
  });
}

function status(value?: number) {
  return (
    ["", "Pending", "Confirmed", "Cancelled", "Completed", "No-show"][
      value || 0
    ] || "Unknown"
  );
}

function Status({ value }: { value?: number }) {
  const label = status(value);
  return (
    <Badge
      variant={
        label === "Confirmed"
          ? "success"
          : label === "Pending"
            ? "warning"
            : label === "Cancelled"
              ? "destructive"
              : "neutral"
      }
    >
      {label}
    </Badge>
  );
}

export function DashboardPage() {
  const bookings = useBookings();
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => new Date());
  const [today] = useState(() => new Date());
  const todayStr = useMemo(() => today.toDateString(), [today]);
  const todayFormatted = useMemo(
    () =>
      today.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    [today],
  );
  const todayDateNum = today.getDate();
  const todayMonthNum = today.getMonth();

  const todays = useMemo(
    () =>
      bookings.data?.filter(
        (x) => new Date(x.startsAt!).toDateString() === todayStr,
      ) ?? [],
    [bookings.data, todayStr],
  );

  const confirmedCount = todays.filter((x) => x.status === 2).length;
  const pendingCount = todays.filter((x) => x.status === 1).length;

  return (
    <div className="space-y-6">
      {/* Greeting & Date Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageTitle
          title="Good morning"
          description="Here's what is happening with your clinic and team today."
        />
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-foreground">
            <CalendarIcon className="size-3.5 text-primary" />
            <span>{todayFormatted}</span>
          </div>
          <Button asChild size="sm" variant="dark">
            <Link to="/book/northstar-health" target="_blank">
              Book appointment
            </Link>
          </Button>
        </div>
      </div>

      {/* 3-Card High-Impact Metric Deck (Inspired by MTicket & Medicore) */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Dark Midnight Slate Highlight Card */}
        <div className="rounded-2xl border border-dark-surface bg-dark-surface p-5 text-dark-surface-foreground">
          <div className="flex items-center justify-between text-xs font-medium text-white/70">
            <span>Today's bookings</span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-emerald-400 font-semibold">
              Active
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold tabular-nums text-white">
            {todays.length}
          </p>
          <div className="mt-3 flex items-center justify-between text-xs text-white/60 border-t border-white/10 pt-3">
            <span>Capacity across team</span>
            <span className="font-semibold text-white/90">100% available</span>
          </div>
        </div>

        {/* Confirmed Metric Card */}
        <Card className="p-5">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Confirmed</span>
            <span className="size-2 rounded-full bg-success" />
          </div>
          <p className="mt-3 text-3xl font-bold tabular-nums text-foreground">
            {confirmedCount}
          </p>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
            <span>Ready to welcome</span>
            <span className="font-medium text-foreground">Verified</span>
          </div>
        </Card>

        {/* Needs Attention / Pending Metric Card */}
        <Card className="p-5">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Needs attention</span>
            <span className="size-2 rounded-full bg-warning" />
          </div>
          <p className="mt-3 text-3xl font-bold tabular-nums text-foreground">
            {pendingCount}
          </p>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
            <span>Pending payment or checkout</span>
            <span className="font-medium text-foreground">15m lock</span>
          </div>
        </Card>
      </div>

      {/* Main Clinical & Scheduling Centerpiece (2-Column Grid like Medicore) */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Left Column: Today's Appointments List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Today's schedule</CardTitle>
              <CardDescription>
                Confirmed and pending appointments for your workspace.
              </CardDescription>
            </div>
            <Link
              to="/admin/bookings"
              className="text-xs font-semibold text-primary hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {bookings.isLoading ? (
              <Skeleton className="h-56" />
            ) : todays.length ? (
              <BookingRows items={todays} />
            ) : (
              <EmptyState
                icon={CalendarDays}
                title="A clear day"
                description="No appointments are scheduled today. New bookings will appear here automatically."
              />
            )}
          </CardContent>
        </Card>

        {/* Right Column: Mini Calendar & Fast Context Widget (Medicore style) */}
        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">
                {selectedCalendarDate.toLocaleDateString(undefined, {
                  month: "long",
                  year: "numeric",
                })}
              </h3>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() =>
                    setSelectedCalendarDate(
                      new Date(
                        selectedCalendarDate.getFullYear(),
                        selectedCalendarDate.getMonth() - 1,
                        1,
                      ),
                    )
                  }
                >
                  <ChevronLeft className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() =>
                    setSelectedCalendarDate(
                      new Date(
                        selectedCalendarDate.getFullYear(),
                        selectedCalendarDate.getMonth() + 1,
                        1,
                      ),
                    )
                  }
                >
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="mt-4 grid grid-cols-7 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <div key={day} className="py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days Matrix */}
            <div className="mt-1 grid grid-cols-7 gap-y-1 text-center text-xs">
              {Array.from({ length: 31 }).map((_, i) => {
                const day = i + 1;
                const isToday =
                  day === todayDateNum &&
                  selectedCalendarDate.getMonth() === todayMonthNum;
                return (
                  <button
                    key={day}
                    type="button"
                    className={cn(
                      "mx-auto flex size-8 items-center justify-center rounded-full font-medium tabular-nums transition-colors",
                      isToday
                        ? "bg-primary font-bold text-white"
                        : "text-foreground hover:bg-muted",
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Quick Team Status Card */}
          <Card className="p-5">
            <h3 className="text-sm font-bold text-foreground">Team status</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Practitioners on schedule today
            </p>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="grid size-7 place-items-center rounded-full bg-primary/10 font-bold text-primary text-[11px]">
                    A
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Amira Hadad</p>
                    <p className="text-[11px] text-muted-foreground">General Medicine</p>
                  </div>
                </div>
                <Badge variant="success">Available</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function BookingsPage() {
  const bookings = useBookings();
  const [filter, setFilter] = useState<"all" | "confirmed" | "pending" | "cancelled">("all");
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(() => {
    let items = bookings.data ?? [];
    if (filter === "confirmed") items = items.filter((x) => x.status === 2);
    else if (filter === "pending") items = items.filter((x) => x.status === 1);
    else if (filter === "cancelled") items = items.filter((x) => x.status === 3);

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (x) =>
          x.id?.toLowerCase().includes(q) ||
          x.staffId?.toLowerCase().includes(q),
      );
    }
    return items;
  }, [bookings.data, filter, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageTitle
          title="Bookings"
          description="Review upcoming appointments and manage reservation status."
        />
        <div className="flex items-center gap-2">
          <Input
            placeholder="Filter by ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-48 text-xs rounded-xl"
          />
        </div>
      </div>

      {/* Segmented Pill Status Navigation (Medicore / MTicket style) */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border pb-3 text-sm">
        {(
          [
            ["all", "All bookings"],
            ["confirmed", "Confirmed"],
            ["pending", "Pending"],
            ["cancelled", "Cancelled"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
              filter === key
                ? "bg-dark-surface text-dark-surface-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          {bookings.isLoading ? (
            <Skeleton className="h-72" />
          ) : filteredItems.length ? (
            <BookingRows items={filteredItems} />
          ) : (
            <EmptyState
              icon={Clock}
              title="No bookings match your filter"
              description="Appointments matching your current filter will show here."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BookingRows({ items }: { items: Booking[] }) {
  const qc = useQueryClient();
  const updateStatus = useMutation({
    mutationFn: async ({
      booking,
      action,
    }: {
      booking: Booking;
      action: "cancel" | "complete" | "no-show";
    }) => {
      const params = { path: { id: booking.id! } };
      const body =
        action === "cancel"
          ? {
              version: booking.version,
              reason: "Cancelled by tenant administrator",
            }
          : { version: booking.version };
      const result =
        action === "cancel"
          ? await api.POST("/api/v1/bookings/{id}/cancel", { params, body })
          : action === "complete"
            ? await api.POST("/api/v1/bookings/{id}/complete", { params, body })
            : await api.POST("/api/v1/bookings/{id}/no-show", { params, body });
      if (!result.response.ok)
        throw new Error("The booking could not be updated.");
    },
    onSuccess: () => {
      toast.success("Booking updated");
      void qc.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (error) => toast.error(apiMessage(error)),
  });

  return (
    <div className="divide-y divide-border">
      {items.map((item) => (
        <div
          key={item.id}
          className="grid gap-3 py-3.5 text-sm sm:grid-cols-[1fr_140px_110px_auto] sm:items-center"
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">Appointment</span>
              <span className="font-mono text-[11px] text-muted-foreground">
                #{item.id?.slice(0, 8)}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
              {new Date(item.startsAt!).toLocaleString([], {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            Staff: {item.staffId?.slice(0, 8)}
          </span>
          <div>
            <Status value={item.status} />
          </div>
          <div className="flex flex-wrap justify-end gap-1.5">
            {item.status === 2 && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    updateStatus.mutate({ booking: item, action: "complete" })
                  }
                >
                  Complete
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    updateStatus.mutate({ booking: item, action: "no-show" })
                  }
                >
                  No show
                </Button>
              </>
            )}
            {(item.status === 1 || item.status === 2) && (
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() =>
                  updateStatus.mutate({ booking: item, action: "cancel" })
                }
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ServicesPage() {
  const qc = useQueryClient();
  const services = useQuery({
    queryKey: ["services-admin"],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/services", {
        params: { query: { page: 1, pageSize: 100, includeInactive: true } },
      });
      if (!data) throw error;
      return data.items ?? [];
    },
  });
  const schema = z.object({
    name: z.string().min(2, "Service name required"),
    durationMinutes: z.number().min(5),
    priceAmount: z.number().min(0),
    currency: z.string().length(3),
    bufferMinutes: z.number().min(0),
  });
  type Form = z.infer<typeof schema>;
  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      durationMinutes: 30,
      priceAmount: 0,
      currency: "MAD",
      bufferMinutes: 0,
    },
  });
  const create = useMutation({
    mutationFn: async (v: Form) => {
      const { data, error } = await api.POST("/api/v1/services", { body: v });
      if (!data) throw error;
      return data;
    },
    onSuccess() {
      toast.success("Service created");
      form.reset();
      void qc.invalidateQueries({ queryKey: ["services-admin"] });
    },
    onError: (e) => toast.error(apiMessage(e)),
  });

  return (
    <div className="space-y-6">
      <PageTitle
        title="Services"
        description="Define what appointments customers can book, pricing, and durations."
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card>
          <CardContent className="pt-6">
            {services.data?.length ? (
              <div className="divide-y divide-border">
                {services.data.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between py-4"
                  >
                    <div>
                      <p className="font-semibold text-foreground">{s.name}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {s.durationMinutes} min · {s.priceAmount} {s.currency} ·{" "}
                        {s.bufferMinutes} min buffer
                      </p>
                    </div>
                    <Badge variant={s.isActive ? "success" : "neutral"}>
                      {s.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Scissors}
                title="Add your first service"
                description="Services become available on your public booking page."
              />
            )}
          </CardContent>
        </Card>
        <QuickForm
          title="New service"
          form={form}
          fields={[
            ["name", "Service name"],
            ["durationMinutes", "Duration (minutes)"],
            ["priceAmount", "Price"],
            ["currency", "Currency"],
            ["bufferMinutes", "Buffer (minutes)"],
          ]}
          onSubmit={(v) => create.mutate(v)}
          pending={create.isPending}
        />
      </div>
    </div>
  );
}

export function StaffPage() {
  const qc = useQueryClient();
  const staff = useQuery({
    queryKey: ["staff-admin"],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/staff", {
        params: { query: { page: 1, pageSize: 100, includeInactive: true } },
      });
      if (!data) throw error;
      return data.items ?? [];
    },
  });
  const schema = z.object({
    displayName: z.string().min(2, "Name required"),
    email: z.email("Valid email required"),
  });
  type Form = z.infer<typeof schema>;
  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { displayName: "", email: "" },
  });
  const create = useMutation({
    mutationFn: async (v: Form) => {
      const { data, error } = await api.POST("/api/v1/staff", { body: v });
      if (!data) throw error;
      return data;
    },
    onSuccess() {
      toast.success("Team member added");
      form.reset();
      void qc.invalidateQueries({ queryKey: ["staff-admin"] });
    },
  });

  return (
    <div className="space-y-6">
      <PageTitle
        title="Team"
        description="Manage practitioners and staff members customers can book with."
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card>
          <CardContent className="pt-6">
            {staff.data?.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-4 border-b border-border py-4 last:border-0"
              >
                <div className="grid size-10 place-items-center rounded-full bg-primary/10 font-bold text-sm text-primary">
                  {p.displayName?.slice(0, 1)}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{p.displayName}</p>
                  <p className="text-xs text-muted-foreground">{p.email}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <QuickForm
          title="Add team member"
          form={form}
          fields={[
            ["displayName", "Full name"],
            ["email", "Email address"],
          ]}
          onSubmit={(v) => create.mutate(v)}
          pending={create.isPending}
        />
      </div>
    </div>
  );
}

export function SchedulePage() {
  const qc = useQueryClient();
  const staff = useQuery({
    queryKey: ["staff-admin"],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/staff", {
        params: { query: { page: 1, pageSize: 100, includeInactive: false } },
      });
      if (!data) throw error;
      return data.items ?? [];
    },
  });
  const [staffId, setStaffId] = useState("");
  const selectedStaffId = staffId || staff.data?.[0]?.id || "";
  const hours = useQuery({
    queryKey: ["working-hours", selectedStaffId],
    enabled: !!selectedStaffId,
    queryFn: async () => {
      const { data, error } = await api.GET(
        "/api/v1/staff/{staffId}/working-hours",
        { params: { path: { staffId: selectedStaffId } } },
      );
      if (!data) throw error;
      return data;
    },
  });
  const timeOff = useQuery({
    queryKey: ["time-off", selectedStaffId],
    enabled: !!selectedStaffId,
    queryFn: async () => {
      const { data, error } = await api.GET(
        "/api/v1/staff/{staffId}/time-off",
        {
          params: {
            path: { staffId: selectedStaffId },
            query: { page: 1, pageSize: 100 },
          },
        },
      );
      if (!data) throw error;
      return data.items ?? [];
    },
  });
  const hoursSchema = z
    .object({
      dayOfWeek: z.number().min(0).max(6),
      startsAt: z.string().min(1),
      endsAt: z.string().min(1),
    })
    .refine((v) => v.startsAt < v.endsAt, {
      message: "End time must be after start time.",
      path: ["endsAt"],
    });
  type HoursForm = z.infer<typeof hoursSchema>;
  const hoursForm = useForm<HoursForm>({
    resolver: zodResolver(hoursSchema),
    defaultValues: { dayOfWeek: 1, startsAt: "09:00", endsAt: "17:00" },
  });
  const addHours = useMutation({
    mutationFn: async (value: HoursForm) => {
      const { data, error } = await api.POST(
        "/api/v1/staff/{staffId}/working-hours",
        {
          params: { path: { staffId: selectedStaffId } },
          body: {
            dayOfWeek: value.dayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6,
            startsAt: `${value.startsAt}:00`,
            endsAt: `${value.endsAt}:00`,
            breaks: [],
          },
        },
      );
      if (!data) throw error;
    },
    onSuccess: () => {
      toast.success("Working hours added");
      void qc.invalidateQueries({
        queryKey: ["working-hours", selectedStaffId],
      });
    },
    onError: (error) => toast.error(apiMessage(error)),
  });

  const timeOffSchema = z
    .object({
      startsAt: z.string().min(1),
      endsAt: z.string().min(1),
      reason: z.string().max(500),
    })
    .refine((v) => v.startsAt < v.endsAt, {
      message: "End date must be after start date.",
      path: ["endsAt"],
    });
  type TimeOffForm = z.infer<typeof timeOffSchema>;
  const timeOffForm = useForm<TimeOffForm>({
    resolver: zodResolver(timeOffSchema),
    defaultValues: { startsAt: "", endsAt: "", reason: "" },
  });
  const addTimeOff = useMutation({
    mutationFn: async (value: TimeOffForm) => {
      const { data, error } = await api.POST(
        "/api/v1/staff/{staffId}/time-off",
        {
          params: { path: { staffId: selectedStaffId } },
          body: {
            startsAt: new Date(value.startsAt).toISOString(),
            endsAt: new Date(value.endsAt).toISOString(),
            reason: value.reason || null,
          },
        },
      );
      if (!data) throw error;
    },
    onSuccess: () => {
      toast.success("Time off added");
      timeOffForm.reset();
      void qc.invalidateQueries({ queryKey: ["time-off", selectedStaffId] });
    },
    onError: (error) => toast.error(apiMessage(error)),
  });

  const remove = useMutation({
    mutationFn: async ({
      kind,
      id,
    }: {
      kind: "hours" | "timeOff";
      id: string;
    }) => {
      const path = { staffId: selectedStaffId, id };
      const response =
        kind === "hours"
          ? await api.DELETE("/api/v1/staff/{staffId}/working-hours/{id}", {
              params: { path },
            })
          : await api.DELETE("/api/v1/staff/{staffId}/time-off/{id}", {
              params: { path },
            });
      if (!response.response.ok)
        throw new Error("The schedule could not be updated.");
      return kind;
    },
    onSuccess: (kind) => {
      toast.success("Schedule updated");
      void qc.invalidateQueries({
        queryKey: [
          kind === "hours" ? "working-hours" : "time-off",
          selectedStaffId,
        ],
      });
    },
    onError: (error) => toast.error(apiMessage(error)),
  });

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  return (
    <div className="space-y-6">
      <PageTitle
        title="Availability"
        description="Configure weekly working hours and scheduled time off per team member."
      />
      {!staff.data?.length ? (
        <Card className="mt-7">
          <CardContent className="pt-6">
            <EmptyState
              icon={Users}
              title="Add a team member first"
              description="Availability belongs to an active team member."
              action={
                <Button asChild>
                  <NavLink to="/admin/staff">Add team member</NavLink>
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="max-w-sm">
            <Label htmlFor="schedule-staff">Select practitioner</Label>
            <select
              id="schedule-staff"
              className="mt-1.5 h-11 w-full rounded-xl border border-input bg-card px-3 text-sm text-foreground"
              value={selectedStaffId}
              onChange={(event) => setStaffId(event.target.value)}
            >
              {staff.data.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.displayName}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Weekly hours</CardTitle>
                <CardDescription>
                  Recurring weekly shifts available for online appointments.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-border">
                  {hours.data?.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between py-3 text-sm"
                    >
                      <span className="tabular-nums">
                        <strong className="text-foreground">
                          {dayNames[entry.dayOfWeek ?? 0]}
                        </strong>{" "}
                        <span className="text-muted-foreground">
                          {entry.startsAt?.slice(0, 5)} - {entry.endsAt?.slice(0, 5)}
                        </span>
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() =>
                          remove.mutate({ kind: "hours", id: entry.id! })
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
                <form
                  className="mt-5 grid gap-3 border-t border-border pt-5 sm:grid-cols-3"
                  onSubmit={hoursForm.handleSubmit((value) =>
                    addHours.mutate(value),
                  )}
                >
                  <select
                    aria-label="Weekday"
                    className="h-11 rounded-xl border border-input bg-card px-3 text-sm text-foreground"
                    {...hoursForm.register("dayOfWeek", {
                      valueAsNumber: true,
                    })}
                  >
                    {dayNames.map((day, index) => (
                      <option key={day} value={index}>
                        {day}
                      </option>
                    ))}
                  </select>
                  <Input
                    aria-label="Start time"
                    type="time"
                    {...hoursForm.register("startsAt")}
                  />
                  <Input
                    aria-label="End time"
                    type="time"
                    {...hoursForm.register("endsAt")}
                  />
                  {hoursForm.formState.errors.endsAt && (
                    <div className="sm:col-span-3">
                      <FieldError>
                        {hoursForm.formState.errors.endsAt.message}
                      </FieldError>
                    </div>
                  )}
                  <Button
                    className="sm:col-span-3 rounded-full"
                    disabled={addHours.isPending}
                  >
                    Add working day
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upcoming time off</CardTitle>
                <CardDescription>
                  Dates when this team member is blocked from booking.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-border">
                  {timeOff.data?.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between gap-3 py-3 text-sm"
                    >
                      <div>
                        <strong className="text-foreground">
                          {entry.reason || "Unavailable"}
                        </strong>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {new Date(entry.startsAt!).toLocaleString()} –{" "}
                          {new Date(entry.endsAt!).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() =>
                          remove.mutate({ kind: "timeOff", id: entry.id! })
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
                <form
                  className="mt-5 grid gap-3 border-t border-border pt-5"
                  onSubmit={timeOffForm.handleSubmit((value) =>
                    addTimeOff.mutate(value),
                  )}
                >
                  <Input
                    aria-label="Time off starts"
                    type="datetime-local"
                    {...timeOffForm.register("startsAt")}
                  />
                  <Input
                    aria-label="Time off ends"
                    type="datetime-local"
                    {...timeOffForm.register("endsAt")}
                  />
                  <Input
                    aria-label="Reason"
                    placeholder="Reason (optional)"
                    {...timeOffForm.register("reason")}
                  />
                  {timeOffForm.formState.errors.endsAt && (
                    <FieldError>
                      {timeOffForm.formState.errors.endsAt.message}
                    </FieldError>
                  )}
                  <Button disabled={addTimeOff.isPending} className="rounded-full">
                    Add time off
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

export function SettingsPage() {
  const qc = useQueryClient();
  const settings = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/settings");
      if (!data) throw error;
      return data;
    },
  });
  const schema = z.object({
    name: z.string().min(2),
    timeZoneId: z.string().min(2),
    cancellationWindowHours: z.number().min(0).max(2160),
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    logoUrl: z.union([z.url(), z.literal("")]),
  });
  type Form = z.infer<typeof schema>;
  const form = useForm<Form>({
    resolver: zodResolver(schema),
    values: settings.data
      ? {
          name: settings.data.name || "",
          timeZoneId: settings.data.timeZoneId || "UTC",
          cancellationWindowHours: settings.data.cancellationWindowHours || 0,
          primaryColor: settings.data.primaryColor || "#2563EB",
          logoUrl: settings.data.logoUrl || "",
        }
      : undefined,
  });
  const save = useMutation({
    mutationFn: async (v: Form) => {
      const { data, error } = await api.PUT("/api/v1/settings", {
        body: { ...v, logoUrl: v.logoUrl || null },
      });
      if (!data) throw error;
      return data;
    },
    onSuccess() {
      toast.success("Settings saved");
      void qc.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  return (
    <div className="space-y-6">
      <PageTitle
        title="Settings"
        description="Configure your workspace branding, time zone, and cancellation window."
      />
      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((v) => save.mutate(v))}
          >
            {(
              [
                ["name", "Business name"],
                ["timeZoneId", "Time zone"],
                ["cancellationWindowHours", "Cancellation window (hours)"],
                ["primaryColor", "Primary brand color"],
                ["logoUrl", "Logo image URL"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  type={
                    key === "primaryColor"
                      ? "color"
                      : key === "cancellationWindowHours"
                        ? "number"
                        : "text"
                  }
                  className={key === "primaryColor" ? "h-11 w-24 p-1 cursor-pointer" : undefined}
                  {...form.register(key, {
                    valueAsNumber: key === "cancellationWindowHours",
                  })}
                />
                <FieldError>{form.formState.errors[key]?.message}</FieldError>
              </div>
            ))}
            <Button disabled={save.isPending} className="mt-2 rounded-full">
              {save.isPending ? "Saving…" : "Save settings"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export function PageTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {title}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function QuickForm<T extends FieldValues>({
  title,
  form,
  fields,
  onSubmit,
  pending,
}: {
  title: string;
  form: UseFormReturn<T>;
  fields: (readonly [Path<T>, string])[];
  onSubmit: (v: T) => void;
  pending: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          {fields.map(([key, label]) => (
            <div key={String(key)} className="space-y-1.5">
              <Label htmlFor={String(key)}>{label}</Label>
              <Input
                id={String(key)}
                type={
                  ["durationMinutes", "priceAmount", "bufferMinutes"].includes(
                    key,
                  )
                    ? "number"
                    : "text"
                }
                {...form.register(key, {
                  valueAsNumber: [
                    "durationMinutes",
                    "priceAmount",
                    "bufferMinutes",
                  ].includes(key),
                })}
              />
            </div>
          ))}
          <Button className="w-full rounded-full" disabled={pending}>
            <Plus className="size-4" />
            {pending ? "Saving…" : "Add"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
