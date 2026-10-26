import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  ChevronRight,
  Clock,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Scissors,
  Settings,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import {
  useForm,
  type FieldValues,
  type Path,
  type UseFormReturn,
} from "react-hook-form";
import {
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
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { FieldError, Label } from "../components/ui/label";
import { Skeleton } from "../components/ui/skeleton";
import { cn } from "../lib/cn";

type Booking = ApiSchemas["BookingDto"];
const nav = [
  ["/admin", "Overview", LayoutDashboard],
  ["/admin/calendar", "Calendar", CalendarDays],
  ["/admin/bookings", "Bookings", Clock],
  ["/admin/services", "Services", Scissors],
  ["/admin/staff", "Team", Users],
  ["/admin/schedule", "Availability", CalendarDays],
  ["/admin/settings", "Settings", Settings],
] as const;

export function AdminGuard() {
  const { session } = useAuth();
  return session ? <AdminShell /> : <Navigate to="/login" replace />;
}

export function LoginPage() {
  const { session, login } = useAuth();
  const navigate = useNavigate();
  const schema = z.object({
    tenantSlug: z.string().min(2, "Enter your workspace slug."),
    email: z.email(),
    password: z.string().min(8),
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
    <main className="grid min-h-dvh lg:grid-cols-2">
      <section className="hidden bg-[radial-gradient(circle_at_top_left,_var(--primary),_#171245_70%)] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3 text-xl font-bold">
          <span className="grid size-10 place-items-center rounded-md bg-white/15">
            <CalendarDays />
          </span>
          Slotly
        </div>
        <div>
          <p className="max-w-lg text-4xl font-bold leading-tight">
            A calmer way to run every appointment.
          </p>
          <p className="mt-4 max-w-md text-lg text-white/70">
            Your schedule, team, customers, and payments in one focused
            workspace.
          </p>
        </div>
        <p className="text-sm text-white/50">Secure multi-tenant scheduling</p>
      </section>
      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-9 flex items-center justify-between lg:justify-end">
            <div className="flex items-center gap-2 font-bold lg:hidden">
              <CalendarDays className="text-primary" />
              Slotly
            </div>
            <ThemeToggle />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-muted-foreground">
            Sign in to manage today's schedule.
          </p>
          <form
            className="mt-8 space-y-5"
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
            {(["tenantSlug", "email", "password"] as const).map((field) => (
              <div key={field} className="space-y-2">
                <Label htmlFor={field}>
                  {field === "tenantSlug"
                    ? "Workspace"
                    : field === "email"
                      ? "Email address"
                      : "Password"}
                </Label>
                <Input
                  id={field}
                  type={field === "password" ? "password" : "text"}
                  {...form.register(field)}
                  aria-invalid={!!form.formState.errors[field]}
                />
                <FieldError>{form.formState.errors[field]?.message}</FieldError>
              </div>
            ))}
            <Button
              className="w-full"
              size="lg"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Demo: northstar-health · amira@northstar.example · Password123!
          </p>
        </div>
      </section>
    </main>
  );
}

function AdminShell() {
  const [open, setOpen] = useState(false);
  const { session, logout } = useAuth();
  const location = useLocation();
  const title =
    nav.find(([path]) => path === location.pathname)?.[1] || "Workspace";
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_1fr]">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-[280px] border-r bg-card p-4 transition-transform lg:static lg:w-auto lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-12 items-center justify-between px-2">
          <span className="flex items-center gap-2 font-bold">
            <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
              <CalendarDays className="size-4" />
            </span>
            Slotly
          </span>
          <Button
            className="lg:hidden"
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
          >
            <X />
          </Button>
        </div>
        <nav className="mt-6 space-y-1">
          {nav.map(([href, label, Icon]) => (
            <NavLink
              end={href === "/admin"}
              key={href}
              to={href}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                  isActive && "bg-primary/10 text-primary",
                )
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-4 left-4 right-4 border-t pt-4">
          <div className="px-3">
            <p className="truncate text-sm font-semibold">
              {session?.user.displayName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {session?.user.email}
            </p>
          </div>
          <Button
            variant="ghost"
            className="mt-2 w-full justify-start"
            onClick={logout}
          >
            <LogOut />
            Sign out
          </Button>
        </div>
      </aside>
      <div>
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen(true)}
          >
            <Menu />
          </Button>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Workspace</span>
            <ChevronRight className="size-3.5 text-muted-foreground" />
            <span className="font-semibold">{title}</span>
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>
        <main className="mx-auto max-w-[1440px] p-4 sm:p-6 lg:p-8">
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
  const [today] = useState(() => new Date().toDateString());
  const todays =
    bookings.data?.filter(
      (x) => new Date(x.startsAt!).toDateString() === today,
    ) ?? [];
  return (
    <div>
      <PageTitle
        title="Good morning"
        description="Here's what is happening with your schedule today."
      />
      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        <Metric
          label="Today's bookings"
          value={todays.length}
          detail="Across your team"
        />
        <Metric
          label="Confirmed"
          value={todays.filter((x) => x.status === 2).length}
          detail="Ready to welcome"
        />
        <Metric
          label="Needs attention"
          value={todays.filter((x) => x.status === 1).length}
          detail="Pending payment"
        />
      </div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Today's schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.isLoading ? (
            <Skeleton className="h-48" />
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
    </div>
  );
}
export function BookingsPage() {
  const bookings = useBookings();
  return (
    <div>
      <PageTitle
        title="Bookings"
        description="Review upcoming appointments and their status."
      />
      <Card className="mt-7">
        <CardContent className="pt-5">
          {bookings.isLoading ? (
            <Skeleton className="h-72" />
          ) : bookings.data?.length ? (
            <BookingRows items={bookings.data} />
          ) : (
            <EmptyState
              icon={Clock}
              title="No bookings yet"
              description="Share your booking page to start filling your calendar."
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
          ? { version: booking.version, reason: "Cancelled by tenant administrator" }
          : { version: booking.version };
      const result =
        action === "cancel"
          ? await api.POST("/api/v1/bookings/{id}/cancel", { params, body })
          : action === "complete"
            ? await api.POST("/api/v1/bookings/{id}/complete", { params, body })
            : await api.POST("/api/v1/bookings/{id}/no-show", { params, body });
      if (!result.response.ok) throw new Error("The booking could not be updated.");
    },
    onSuccess: () => {
      toast.success("Booking updated");
      void qc.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (error) => toast.error(apiMessage(error)),
  });
  return (
    <div className="divide-y">
      {items.map((item) => (
        <div
          key={item.id}
          className="grid gap-2 py-4 text-sm sm:grid-cols-[1fr_140px_110px_auto] sm:items-center"
        >
          <div>
            <p className="font-semibold">Appointment</p>
            <p className="mt-1 text-muted-foreground">
              {new Date(item.startsAt!).toLocaleString([], {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <span className="text-xs text-muted-foreground">
            {item.staffId?.slice(0, 8)}
          </span>
          <Status value={item.status} />
          <div className="flex flex-wrap justify-end gap-1">
            {item.status === 2 && (
              <>
                <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ booking: item, action: "complete" })}>Complete</Button>
                <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ booking: item, action: "no-show" })}>No show</Button>
              </>
            )}
            {(item.status === 1 || item.status === 2) && (
              <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ booking: item, action: "cancel" })}>Cancel</Button>
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
    name: z.string().min(2),
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
    <div>
      <PageTitle
        title="Services"
        description="Define what customers can book and how long it takes."
      />
      <div className="mt-7 grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card>
          <CardContent className="pt-5">
            {services.data?.length ? (
              <div className="divide-y">
                {services.data.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between py-4"
                  >
                    <div>
                      <p className="font-semibold">{s.name}</p>
                      <p className="text-sm text-muted-foreground">
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
  const schema = z.object({ displayName: z.string().min(2), email: z.email() });
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
    <div>
      <PageTitle
        title="Team"
        description="Manage the people customers can book with."
      />
      <div className="mt-7 grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card>
          <CardContent className="pt-5">
            {staff.data?.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-4 border-b py-4 last:border-0"
              >
                <div className="grid size-10 place-items-center rounded-full bg-primary/10 font-semibold text-primary">
                  {p.displayName?.slice(0, 1)}
                </div>
                <div>
                  <p className="font-semibold">{p.displayName}</p>
                  <p className="text-sm text-muted-foreground">{p.email}</p>
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
    <div>
      <PageTitle
        title="Availability"
        description="Working hours and time off are managed per team member."
      />
      {!staff.data?.length ? (
        <Card className="mt-7">
          <CardContent className="pt-5">
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
          <div className="mt-7 max-w-sm">
            <Label htmlFor="schedule-staff">Team member</Label>
            <select
              id="schedule-staff"
              className="mt-2 h-11 w-full rounded-md border bg-background px-3 text-sm"
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
          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Weekly hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {hours.data?.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between py-3 text-sm"
                    >
                      <span>
                        <strong>{dayNames[entry.dayOfWeek ?? 0]}</strong> /{" "}
                        {entry.startsAt?.slice(0, 5)}-
                        {entry.endsAt?.slice(0, 5)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
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
                  className="mt-5 grid gap-3 border-t pt-5 sm:grid-cols-3"
                  onSubmit={hoursForm.handleSubmit((value) =>
                    addHours.mutate(value),
                  )}
                >
                  <select
                    aria-label="Weekday"
                    className="h-11 rounded-md border bg-background px-3 text-sm"
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
                    className="sm:col-span-3"
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
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {timeOff.data?.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between gap-3 py-3 text-sm"
                    >
                      <span>
                        <strong>{entry.reason || "Unavailable"}</strong>
                        <br />
                        <span className="text-muted-foreground">
                          {new Date(entry.startsAt!).toLocaleString()} –{" "}
                          {new Date(entry.endsAt!).toLocaleString()}
                        </span>
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
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
                  className="mt-5 grid gap-3 border-t pt-5"
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
                  <Button disabled={addTimeOff.isPending}>Add time off</Button>
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
          primaryColor: settings.data.primaryColor || "#5145CD",
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
    <div>
      <PageTitle
        title="Settings"
        description="Control your public brand and booking policy."
      />
      <Card className="mt-7 max-w-2xl">
        <CardContent className="pt-6">
          <form
            className="space-y-5"
            onSubmit={form.handleSubmit((v) => save.mutate(v))}
          >
            {(
              [
                ["name", "Business name"],
                ["timeZoneId", "Time zone"],
                ["cancellationWindowHours", "Cancellation window (hours)"],
                ["primaryColor", "Primary color"],
                ["logoUrl", "Logo URL"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-2">
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
                  {...form.register(key, {
                    valueAsNumber: key === "cancellationWindowHours",
                  })}
                />
                <FieldError>{form.formState.errors[key]?.message}</FieldError>
              </div>
            ))}
            <Button disabled={save.isPending}>
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
    <div className="flex items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          {description}
        </p>
      </div>
    </div>
  );
}
function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-bold tabular-nums">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
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
            <div key={String(key)} className="space-y-2">
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
          <Button className="w-full" disabled={pending}>
            <Plus />
            {pending ? "Saving…" : "Add"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
