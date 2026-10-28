import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Calendar,
  CalendarDays,
  Check,
  ChevronDown,
  Clock,
  ExternalLink,
  FileText,
  HelpCircle,
  Hourglass,
  Info,
  Lightbulb,
  Link as LinkIcon,
  LogOut,
  Mail,
  Menu,
  MessageCircle,
  Mic,
  MoreVertical,
  Mountain,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Scissors,
  Search,
  Settings,
  Share2,
  Sparkles,
  User,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
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

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const mainNavItems: NavItem[] = [
  { href: "/admin", label: "Scheduling", icon: Hourglass },
  { href: "/admin/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/admin/bookings", label: "Notetaker", icon: FileText },
  { href: "/admin/staff", label: "Contacts", icon: Users },
  { href: "/admin/schedule", label: "Automations", icon: Sparkles },
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
      email: "amira.benali@northstarhealth.ma",
      password: "",
    },
  });

  if (session) return <Navigate to="/admin" replace />;

  return (
    <main className="grid min-h-dvh bg-[#0B111A] text-white lg:grid-cols-2">
      <section className="relative hidden items-center justify-center overflow-hidden border-r border-[#1C283A] bg-[#070D15] p-12 lg:flex">
        <div className="max-w-md text-center space-y-6">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#0069FF] text-white shadow-xl">
            <Hourglass className="size-8" />
          </div>
          <h2 className="font-serif text-4xl font-normal text-white">
            Easy scheduling ahead.
          </h2>
          <p className="text-sm text-[#8B9CB0] leading-relaxed">
            Join millions of professionals who use Slotly to streamline appointments, calendars, and client meetings.
          </p>
        </div>
      </section>

      {/* Login Form */}
      <section className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8 rounded-3xl bg-[#111A28] border border-[#1C283A] p-8 sm:p-10 shadow-2xl">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="grid size-8 place-items-center rounded-lg bg-[#0069FF] text-white">
                <Hourglass className="size-4" />
              </div>
              <span className="font-bold text-lg text-white">Slotly</span>
            </Link>
            <ThemeToggle />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Log in to your account
            </h1>
            <p className="mt-1 text-xs text-[#8B9CB0]">
              Enter your credentials to access your scheduling workspace.
            </p>
          </div>

          <form
            className="space-y-4"
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
              <Label htmlFor="tenantSlug" className="text-xs text-[#8B9CB0]">Workspace handle</Label>
              <Input
                id="tenantSlug"
                placeholder="e.g. northstar-health"
                className="bg-[#0B111A] border-[#1C283A] text-white"
                {...form.register("tenantSlug")}
                aria-invalid={!!form.formState.errors.tenantSlug}
              />
              <FieldError>{form.formState.errors.tenantSlug?.message}</FieldError>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs text-[#8B9CB0]">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@domain.com"
                className="bg-[#0B111A] border-[#1C283A] text-white"
                {...form.register("email")}
                aria-invalid={!!form.formState.errors.email}
              />
              <FieldError>{form.formState.errors.email?.message}</FieldError>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs text-[#8B9CB0]">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="bg-[#0B111A] border-[#1C283A] text-white"
                {...form.register("password")}
                aria-invalid={!!form.formState.errors.password}
              />
              <FieldError>{form.formState.errors.password?.message}</FieldError>
            </div>

            <Button
              className="mt-2 w-full rounded-full bg-[#0069FF] text-white font-semibold hover:bg-[#0056D6]"
              size="lg"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Signing in…" : "Continue"}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}

function AdminShell() {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("slotly_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("slotly_sidebar_collapsed", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const { session, logout } = useAuth();
  const userName = session?.user.displayName || "Ibrahim Benkacem";

  return (
    <div
      className={cn(
        "min-h-dvh bg-[#0B111A] text-white transition-[grid-template-columns] duration-300 lg:grid",
        collapsed ? "lg:grid-cols-[72px_1fr]" : "lg:grid-cols-[240px_1fr]",
      )}
    >
      {/* Calendly Dark Left Sidebar (Image 1) */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-[#1C283A] bg-[#090E17] transition-all duration-300 lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
          collapsed ? "w-[72px] lg:w-[72px]" : "w-[240px] lg:w-[240px]",
        )}
      >
        {/* Top: User Avatar Dropdown & Collapse Trigger */}
        <div className="flex h-16 shrink-0 items-center justify-between px-3 border-b border-[#1C283A]/40">
          {!collapsed ? (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="grid size-8 shrink-0 place-items-center rounded-full bg-[#00897B] font-bold text-xs text-white">
                {userName.charAt(0)}
              </div>
              <span className="truncate text-xs font-semibold text-white">
                {userName}
              </span>
              <ChevronDown className="size-3.5 text-gray-400 shrink-0" />
            </div>
          ) : (
            <div className="mx-auto grid size-8 place-items-center rounded-full bg-[#00897B] font-bold text-xs text-white">
              {userName.charAt(0)}
            </div>
          )}

          <button
            onClick={toggleCollapse}
            className="hidden lg:grid size-7 place-items-center rounded-md text-gray-400 hover:text-white hover:bg-[#162234]"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen className="size-3.5" /> : <PanelLeftClose className="size-3.5" />}
          </button>

          <Button
            className="lg:hidden"
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
          >
            <X className="size-4 text-white" />
          </Button>
        </div>

        {/* "+ Create" Pill Button (Image 1) */}
        <div className="p-3">
          <Link
            to="/admin/services"
            className={cn(
              "flex h-10 items-center justify-center gap-1.5 rounded-full border border-white/20 bg-transparent text-xs font-bold text-white transition-all hover:border-white hover:bg-white/5",
              collapsed ? "w-10 px-0 mx-auto" : "w-full px-4"
            )}
          >
            <Plus className="size-3.5" />
            {!collapsed && <span>Create</span>}
            {!collapsed && <ChevronDown className="size-3 text-gray-400 ml-0.5" />}
          </Link>
        </div>

        {/* Primary Navigation Menu */}
        <nav className="flex-1 space-y-1 px-2.5 py-2">
          {mainNavItems.map(({ href, label, icon: Icon }) => (
            <NavLink
              end={href === "/admin"}
              key={href}
              to={href}
              title={collapsed ? label : undefined}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex h-10 items-center rounded-xl text-xs font-semibold transition-colors",
                  collapsed ? "justify-center size-10 mx-auto" : "gap-3 px-3",
                  isActive
                    ? "bg-[#152B46] text-[#4D9BFF]"
                    : "text-[#8B9CB0] hover:bg-[#111A28] hover:text-white"
                )
              }
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Sidebar: Upgrade Plan & Settings (Image 1) */}
        <div className="shrink-0 space-y-2 p-3 border-t border-[#1C283A]/50">
          {!collapsed ? (
            <button
              onClick={() => toast.info("Slotly Enterprise trial active.")}
              className="flex h-9 w-full items-center justify-center gap-2 rounded-full border border-white/20 text-xs font-semibold text-white hover:bg-white/5"
            >
              <ArrowUpRight className="size-3.5" />
              <span>Upgrade plan</span>
            </button>
          ) : (
            <button
              onClick={() => toast.info("Slotly Enterprise trial active.")}
              className="grid size-9 mx-auto place-items-center rounded-full border border-white/20 text-white hover:bg-white/5"
              title="Upgrade plan"
            >
              <ArrowUpRight className="size-4" />
            </button>
          )}

          <NavLink
            to="/admin/settings"
            title={collapsed ? "Settings" : undefined}
            className={({ isActive }) =>
              cn(
                "flex h-9 items-center rounded-xl text-xs font-semibold transition-colors",
                collapsed ? "justify-center size-9 mx-auto" : "gap-3 px-3",
                isActive
                  ? "bg-[#152B46] text-[#4D9BFF]"
                  : "text-[#8B9CB0] hover:bg-[#111A28] hover:text-white"
              )
            }
          >
            <Settings className="size-4 shrink-0" />
            {!collapsed && <span>Settings</span>}
          </NavLink>

          <button
            onClick={logout}
            className={cn(
              "flex h-8 items-center rounded-xl text-xs font-semibold text-gray-500 hover:text-red-400 transition-colors",
              collapsed ? "justify-center size-9 mx-auto" : "gap-3 px-3 w-full"
            )}
            title="Log out"
          >
            <LogOut className="size-3.5 shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col bg-[#0B111A]">
        {/* Mobile top trigger */}
        <div className="flex h-14 items-center justify-between border-b border-[#1C283A] px-4 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(true)}
            className="text-white"
          >
            <Menu className="size-5" />
          </Button>
          <span className="font-bold text-sm text-white">Slotly</span>
          <ThemeToggle />
        </div>

        {/* View Outlet */}
        <main className="w-full flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto">
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
  const dot =
    label === "Confirmed"
      ? "bg-emerald-400"
      : label === "Pending"
        ? "bg-amber-400"
        : label === "Cancelled"
          ? "bg-rose-400"
          : "bg-gray-400";
  return (
    <span className="inline-flex items-center gap-2 text-xs font-semibold text-white">
      <span className={cn("size-1.5 rounded-full", dot)} />
      {label}
    </span>
  );
}

/* -------------------------------------------------------------
 * DASHBOARD / SCHEDULING VIEW (Image 1)
 * ------------------------------------------------------------- */
export function DashboardPage() {
  const { session } = useAuth();
  const userName = session?.user.displayName || "Ibrahim Benkacem";
  const [activeTab, setActiveTab] = useState<"event-types" | "single-use" | "polls" | "routing">("event-types");
  const [searchQuery, setSearchQuery] = useState("");
  const [getStartedOpen, setGetStartedOpen] = useState(true);

  // Fetch services/event types from API
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

  const filteredServices = useMemo(() => {
    if (!services.data?.length) {
      // Default fallback demo service matching Image 1
      return [
        {
          id: "demo-30m",
          name: "30 Minute Meeting",
          durationMinutes: 30,
          priceAmount: 0,
          currency: "USD",
          bufferMinutes: 0,
          isActive: true,
        },
      ];
    }
    return services.data.filter((s) =>
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [services.data, searchQuery]);

  const copyPublicLink = () => {
    const url = `${window.location.origin}/book/northstar-health`;
    void navigator.clipboard.writeText(url);
    toast.success("Booking link copied to clipboard!");
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar (Scheduling Title + Ask Callie + Manage Availability + Create - Image 1) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">Scheduling</h1>
          <button
            className="text-gray-400 hover:text-white"
            title="Scheduling event types and meeting links"
          >
            <Info className="size-4" />
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => toast.info("Slotly Help Center is available 24/7.")}
            className="grid size-9 place-items-center rounded-lg border border-[#1C283A] text-gray-400 hover:text-white hover:bg-[#111A28]"
            title="Help"
          >
            <HelpCircle className="size-4" />
          </button>

          {/* Ask Callie AI Button (Image 1) */}
          <button
            onClick={() => toast.info("Callie AI Assistant is ready to help coordinate your meetings.")}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-950/20 px-3.5 text-xs font-bold text-purple-300 hover:bg-purple-900/30 transition-colors"
          >
            <Sparkles className="size-3.5 text-purple-400" />
            <span>Ask Callie</span>
          </button>

          <Link
            to="/admin/schedule"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#1C283A] bg-[#111A28] px-3.5 text-xs font-semibold text-white hover:bg-[#162234] transition-colors"
          >
            <Calendar className="size-3.5 text-gray-400" />
            <span>Manage availability</span>
          </Link>

          <Link
            to="/admin/services"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-4 text-xs font-bold text-[#0B1A2C] shadow-sm hover:bg-neutral-100 transition-colors"
          >
            <Plus className="size-3.5" />
            <span>Create</span>
            <ChevronDown className="size-3 text-gray-500" />
          </Link>
        </div>
      </div>

      {/* Sub-Navigation Tabs (Event types, Single-use links, Meeting polls, Routing forms - Image 1) */}
      <div className="border-b border-[#1C283A]">
        <div className="flex gap-6 text-sm font-semibold">
          {[
            ["event-types", "Event types"],
            ["single-use", "Single-use links"],
            ["polls", "Meeting polls"],
            ["routing", "Routing forms"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={cn(
                "pb-3 transition-colors relative",
                activeTab === key
                  ? "text-white font-bold"
                  : "text-[#8B9CB0] hover:text-white"
              )}
            >
              {label}
              {activeTab === key && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0069FF] rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Left Event Types + Right Get Started Drawer (Image 1) */}
      <div className={cn("grid gap-8 items-start", getStartedOpen ? "xl:grid-cols-[1fr_360px]" : "grid-cols-1")}>
        {/* Left Column */}
        <div className="space-y-5">
          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search event types"
              className="h-10 w-full rounded-xl border border-[#1C283A] bg-[#111A28] pl-10 pr-4 text-xs text-white placeholder:text-gray-500 focus:border-[#0069FF] focus:outline-none"
            />
          </div>

          {/* User Row (Image 1) */}
          <div className="flex items-center justify-between border-b border-[#1C283A] pb-3 pt-1">
            <div className="flex items-center gap-3">
              <div className="grid size-7 place-items-center rounded-full bg-[#00897B] font-bold text-xs text-white">
                {userName.charAt(0)}
              </div>
              <span className="text-sm font-bold text-white">{userName}</span>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/book/northstar-health"
                target="_blank"
                className="flex items-center gap-1 text-xs font-semibold text-[#4D9BFF] hover:underline"
              >
                <span>View landing page</span>
                <ExternalLink className="size-3" />
              </Link>
              <button className="text-gray-400 hover:text-white">
                <MoreVertical className="size-4" />
              </button>
            </div>
          </div>

          {/* Event Type Cards List (Image 1) */}
          <div className="space-y-3">
            {filteredServices.map((service, index) => {
              const accentColors = ["bg-purple-500", "bg-blue-500", "bg-emerald-500", "bg-amber-500"];
              const accentColor = accentColors[index % accentColors.length];

              return (
                <div
                  key={service.id}
                  className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-[#1C283A] bg-[#111A28] p-4 transition-all hover:border-[#27374E]"
                >
                  {/* Left Accent Bar */}
                  <div className={cn("absolute left-0 top-3 bottom-3 w-1 rounded-r-md", accentColor)} />

                  <div className="flex items-start gap-3.5 pl-2">
                    <input
                      type="checkbox"
                      className="mt-1 rounded border-[#1C283A] bg-[#0B111A] text-[#0069FF] focus:ring-0"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-[#4D9BFF] transition-colors">
                        {service.name}
                      </h3>
                      <p className="mt-1 text-xs text-[#8B9CB0] leading-relaxed">
                        {service.durationMinutes} min • Google Meet • One-on-One
                        <br />
                        Weekdays, 09:00 - 17:00
                      </p>
                    </div>
                  </div>

                  {/* Actions on Right (Copy link, Share, Menu) */}
                  <div className="flex items-center gap-2 ml-auto sm:ml-0">
                    <button
                      onClick={copyPublicLink}
                      className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/20 bg-transparent px-3 text-xs font-semibold text-white hover:bg-white/5 transition-colors"
                    >
                      <LinkIcon className="size-3" />
                      <span>Copy link</span>
                    </button>

                    <Link
                      to="/book/northstar-health"
                      target="_blank"
                      className="grid size-8 place-items-center rounded-lg text-gray-400 hover:text-white hover:bg-[#162234]"
                      title="Open booking page"
                    >
                      <Share2 className="size-3.5" />
                    </Link>

                    <Link
                      to="/admin/services"
                      className="grid size-8 place-items-center rounded-lg text-gray-400 hover:text-white hover:bg-[#162234]"
                      title="Settings"
                    >
                      <MoreVertical className="size-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right "Get started" Drawer (Image 1) */}
        {getStartedOpen && (
          <div className="rounded-2xl border border-[#1C283A] bg-[#111A28] p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[#1C283A] pb-4">
              <h2 className="text-base font-bold text-white">Get started</h2>
              <button
                onClick={() => setGetStartedOpen(false)}
                className="text-gray-400 hover:text-white"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-2 rounded-xl hover:bg-[#162234] transition-colors cursor-pointer">
                <div className="grid size-9 place-items-center rounded-lg bg-blue-900/40 text-[#4D9BFF] shrink-0">
                  <Lightbulb className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Get to know Slotly</p>
                  <p className="text-[11px] text-[#8B9CB0]">1 video</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2 rounded-xl hover:bg-[#162234] transition-colors cursor-pointer">
                <div className="grid size-9 place-items-center rounded-lg bg-blue-900/40 text-[#4D9BFF] shrink-0">
                  <Calendar className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">The perfect scheduling setup</p>
                  <p className="text-[11px] text-[#8B9CB0]">2 tasks</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2 rounded-xl hover:bg-[#162234] transition-colors cursor-pointer">
                <div className="grid size-9 place-items-center rounded-lg bg-blue-900/40 text-[#4D9BFF] shrink-0">
                  <Mail className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Automate meeting prep and follow-up</p>
                  <p className="text-[11px] text-[#8B9CB0]">2 tasks</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2 rounded-xl hover:bg-[#162234] transition-colors cursor-pointer">
                <div className="grid size-9 place-items-center rounded-lg bg-blue-900/40 text-[#4D9BFF] shrink-0">
                  <Mountain className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Using Slotly with a team</p>
                  <p className="text-[11px] text-[#8B9CB0]">2 tasks</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setGetStartedOpen(false)}
              className="w-full rounded-xl border border-white/20 py-2.5 text-xs font-bold text-white hover:bg-white/5 transition-colors"
            >
              Don't show again
            </button>
          </div>
        )}
      </div>

      {/* Floating Chat Bubble at Bottom Right (Image 1 & 2) */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => toast.info("Slotly Assistant: Callie is standing by.")}
          className="grid size-12 place-items-center rounded-full bg-[#0069FF] text-white shadow-2xl transition-all hover:scale-105"
          aria-label="Support chat"
        >
          <MessageCircle className="size-5" />
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------
 * BOOKINGS PAGE
 * ------------------------------------------------------------- */
export function BookingsPage() {
  const bookings = useBookings();
  const [filter, setFilter] = useState<"all" | "confirmed" | "pending" | "cancelled">("all");

  const filteredItems = useMemo(() => {
    if (!bookings.data) return [];
    if (filter === "confirmed") return bookings.data.filter((x) => x.status === 2);
    if (filter === "pending") return bookings.data.filter((x) => x.status === 1);
    if (filter === "cancelled") return bookings.data.filter((x) => x.status === 3);
    return bookings.data;
  }, [bookings.data, filter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Notetaker & Bookings</h1>
          <p className="mt-1 text-xs text-[#8B9CB0]">
            Review all scheduled meetings, client details, and AI summaries.
          </p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-[#1C283A] pb-3">
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
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
              filter === key
                ? "bg-[#152B46] text-[#4D9BFF]"
                : "text-[#8B9CB0] hover:text-white"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-[#1C283A] bg-[#111A28] p-6">
        {bookings.isLoading ? (
          <Skeleton className="h-72 bg-[#162234]" />
        ) : filteredItems.length ? (
          <BookingRows items={filteredItems} />
        ) : (
          <EmptyState
            icon={Clock}
            title="No bookings match your filter"
            description="Appointments matching your current filter will show here."
          />
        )}
      </div>
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
    <div className="divide-y divide-[#1C283A]">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3.5 text-sm sm:flex-nowrap"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">Appointment</span>
              <span className="font-mono text-[11px] text-[#8B9CB0]">
                #{item.id?.slice(0, 8)}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-[#8B9CB0] tabular-nums">
              {new Date(item.startsAt!).toLocaleString([], {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <span className="shrink-0 font-mono text-xs text-[#8B9CB0]">
            Staff: {item.staffId?.slice(0, 8)}
          </span>
          <div className="shrink-0">
            <Status value={item.status} />
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            {item.status === 2 && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-[#1C283A] text-white hover:bg-[#162234]"
                  onClick={() =>
                    updateStatus.mutate({ booking: item, action: "complete" })
                  }
                >
                  Complete
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-gray-400 hover:text-white"
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
                className="text-red-400 hover:bg-red-950/20 hover:text-red-300"
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

/* -------------------------------------------------------------
 * SERVICES PAGE
 * ------------------------------------------------------------- */
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Event Types & Services</h1>
        <p className="mt-1 text-xs text-[#8B9CB0]">
          Configure durations, pricing, buffer times, and public booking settings.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="rounded-2xl border border-[#1C283A] bg-[#111A28] p-6">
          {services.data?.length ? (
            <div className="divide-y divide-[#1C283A]">
              {services.data.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between py-4"
                >
                  <div>
                    <p className="font-semibold text-white">{s.name}</p>
                    <p className="text-xs text-[#8B9CB0] tabular-nums">
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
        </div>

        <QuickForm
          title="New event type"
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

/* -------------------------------------------------------------
 * STAFF PAGE
 * ------------------------------------------------------------- */
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Contacts & Team</h1>
        <p className="mt-1 text-xs text-[#8B9CB0]">
          Manage practitioners and team members clients can book with.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="rounded-2xl border border-[#1C283A] bg-[#111A28] p-6">
          {staff.data?.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-4 border-b border-[#1C283A] py-4 last:border-0"
            >
              <div className="grid size-10 place-items-center rounded-full bg-[#0069FF]/20 font-bold text-sm text-[#4D9BFF]">
                {p.displayName?.slice(0, 1)}
              </div>
              <div>
                <p className="font-semibold text-white">{p.displayName}</p>
                <p className="text-xs text-[#8B9CB0]">{p.email}</p>
              </div>
            </div>
          ))}
        </div>

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

/* -------------------------------------------------------------
 * SCHEDULE & AVAILABILITY PAGE
 * ------------------------------------------------------------- */
export function SchedulePage() {
  const qc = useQueryClient();
  const staff = useQuery({
    queryKey: ["schedule-staff"],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/staff", {
        params: { query: { page: 1, pageSize: 100 } },
      });
      if (!data) throw error;
      return data.items ?? [];
    },
  });
  const [selectedStaffId, setStaffId] = useState<string>("");

  useEffect(() => {
    if (staff.data?.length && !selectedStaffId) {
      setStaffId(staff.data[0].id!);
    }
  }, [staff.data, selectedStaffId]);

  const hours = useQuery({
    queryKey: ["hours", selectedStaffId],
    enabled: !!selectedStaffId,
    queryFn: async () => {
      const { data, error } = await api.GET(
        "/api/v1/staff/{staffId}/working-hours",
        {
          params: { path: { staffId: selectedStaffId } },
        },
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

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const hoursForm = useForm({
    defaultValues: { dayOfWeek: 1, startsAt: "09:00", endsAt: "17:00" },
  });

  const timeOffForm = useForm({
    defaultValues: { startsAt: "", endsAt: "", reason: "" },
  });

  const addHours = useMutation({
    mutationFn: async (v: {
      dayOfWeek: number;
      startsAt: string;
      endsAt: string;
    }) => {
      const { data, error } = await api.POST(
        "/api/v1/staff/{staffId}/working-hours",
        {
          params: { path: { staffId: selectedStaffId } },
          body: {
            dayOfWeek: v.dayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6,
            startsAt: `${v.startsAt}:00`,
            endsAt: `${v.endsAt}:00`,
          },
        },
      );
      if (!data) throw error;
      return data;
    },
    onSuccess() {
      toast.success("Hours added");
      void qc.invalidateQueries({ queryKey: ["working-hours", selectedStaffId] });
    },
  });

  const addTimeOff = useMutation({
    mutationFn: async (v: {
      startsAt: string;
      endsAt: string;
      reason: string;
    }) => {
      const { data, error } = await api.POST(
        "/api/v1/staff/{staffId}/time-off",
        {
          params: { path: { staffId: selectedStaffId } },
          body: {
            startsAt: new Date(v.startsAt).toISOString(),
            endsAt: new Date(v.endsAt).toISOString(),
            reason: v.reason || undefined,
          },
        },
      );
      if (!data) throw error;
      return data;
    },
    onSuccess() {
      toast.success("Time off registered");
      void qc.invalidateQueries({ queryKey: ["time-off", selectedStaffId] });
    },
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
      const res =
        kind === "hours"
          ? await api.DELETE("/api/v1/staff/{staffId}/working-hours/{id}", {
              params: { path },
            })
          : await api.DELETE("/api/v1/staff/{staffId}/time-off/{id}", {
              params: { path },
            });
      if (!res.response.ok) throw new Error("Could not remove item.");
    },
    onSuccess(_, variables) {
      toast.success("Removed");
      void qc.invalidateQueries({
        queryKey: [
          variables.kind === "hours" ? "working-hours" : "time-off",
          selectedStaffId,
        ],
      });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Availability & Working Hours</h1>
        <p className="mt-1 text-xs text-[#8B9CB0]">
          Set recurring schedules and blackout dates per team member.
        </p>
      </div>

      <div className="max-w-sm">
        <Label htmlFor="schedule-staff" className="text-xs text-[#8B9CB0]">Select team member</Label>
        <select
          id="schedule-staff"
          className="mt-1.5 h-11 w-full rounded-xl border border-[#1C283A] bg-[#111A28] px-3 text-sm text-white"
          value={selectedStaffId}
          onChange={(event) => setStaffId(event.target.value)}
        >
          {staff.data?.map((member) => (
            <option key={member.id} value={member.id}>
              {member.displayName}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-[#1C283A] bg-[#111A28] p-6">
          <h2 className="text-base font-bold text-white mb-4">Weekly working hours</h2>
          <div className="divide-y divide-[#1C283A]">
            {hours.data?.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between py-3 text-sm"
              >
                <span className="tabular-nums">
                  <strong className="text-white">
                    {dayNames[entry.dayOfWeek ?? 0]}
                  </strong>{" "}
                  <span className="text-[#8B9CB0]">
                    {entry.startsAt?.slice(0, 5)} - {entry.endsAt?.slice(0, 5)}
                  </span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:bg-red-950/20"
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
            className="mt-5 grid gap-3 border-t border-[#1C283A] pt-5 sm:grid-cols-3"
            onSubmit={hoursForm.handleSubmit((value) => addHours.mutate(value))}
          >
            <select
              aria-label="Weekday"
              className="h-11 rounded-xl border border-[#1C283A] bg-[#0B111A] px-3 text-sm text-white"
              {...hoursForm.register("dayOfWeek", { valueAsNumber: true })}
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
              className="bg-[#0B111A] border-[#1C283A] text-white"
              {...hoursForm.register("startsAt")}
            />
            <Input
              aria-label="End time"
              type="time"
              className="bg-[#0B111A] border-[#1C283A] text-white"
              {...hoursForm.register("endsAt")}
            />
            <Button
              className="sm:col-span-3 rounded-full bg-[#0069FF] text-white hover:bg-[#0056D6]"
              disabled={addHours.isPending}
            >
              Add working day
            </Button>
          </form>
        </div>

        <div className="rounded-2xl border border-[#1C283A] bg-[#111A28] p-6">
          <h2 className="text-base font-bold text-white mb-4">Upcoming time off & holidays</h2>
          <div className="divide-y divide-[#1C283A]">
            {timeOff.data?.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-3 py-3 text-sm"
              >
                <div>
                  <strong className="text-white">
                    {entry.reason || "Unavailable"}
                  </strong>
                  <p className="text-xs text-[#8B9CB0] tabular-nums">
                    {new Date(entry.startsAt!).toLocaleString()} –{" "}
                    {new Date(entry.endsAt!).toLocaleString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:bg-red-950/20"
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
            className="mt-5 grid gap-3 border-t border-[#1C283A] pt-5"
            onSubmit={timeOffForm.handleSubmit((value) => addTimeOff.mutate(value))}
          >
            <Input
              aria-label="Time off starts"
              type="datetime-local"
              className="bg-[#0B111A] border-[#1C283A] text-white"
              {...timeOffForm.register("startsAt")}
            />
            <Input
              aria-label="Time off ends"
              type="datetime-local"
              className="bg-[#0B111A] border-[#1C283A] text-white"
              {...timeOffForm.register("endsAt")}
            />
            <Input
              aria-label="Reason"
              placeholder="Reason (e.g. Conference / Vacation)"
              className="bg-[#0B111A] border-[#1C283A] text-white"
              {...timeOffForm.register("reason")}
            />
            <Button
              disabled={addTimeOff.isPending}
              className="rounded-full bg-[#0069FF] text-white hover:bg-[#0056D6]"
            >
              Add time off
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------
 * SETTINGS / PROFILE MODAL (Image 3)
 * ------------------------------------------------------------- */
export function SettingsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { session } = useAuth();
  const userName = session?.user.displayName || "Ibrahim Benkacem";

  const [activeSettingsNav, setActiveSettingsNav] = useState<
    "profile" | "scheduling" | "branding" | "mylink" | "privacy" | "workspace"
  >("profile");
  const [profileTab, setProfileTab] = useState<"general" | "login">("general");

  const [currentTime, setCurrentTime] = useState("");
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

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
    welcomeMessage: z.string().optional(),
    timeZoneId: z.string().min(2),
    language: z.string().optional(),
    dateFormat: z.string().optional(),
    timeFormat: z.string().optional(),
    country: z.string().optional(),
    cancellationWindowHours: z.number().min(0).max(2160),
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    logoUrl: z.union([z.url(), z.literal("")]),
  });
  type Form = z.infer<typeof schema>;

  const form = useForm<Form>({
    resolver: zodResolver(schema),
    values: {
      name: settings.data?.name || userName,
      welcomeMessage:
        "Welcome to my scheduling page. Please follow the instructions to add an event to my calendar.",
      timeZoneId: settings.data?.timeZoneId || "Africa/Casablanca",
      language: "English",
      dateFormat: "DD/MM/YYYY",
      timeFormat: "24h",
      country: "Morocco",
      cancellationWindowHours: settings.data?.cancellationWindowHours || 0,
      primaryColor: settings.data?.primaryColor || "#0069FF",
      logoUrl: settings.data?.logoUrl || "",
    },
  });

  const save = useMutation({
    mutationFn: async (v: Form) => {
      const { data, error } = await api.PUT("/api/v1/settings", {
        body: {
          name: v.name,
          timeZoneId: v.timeZoneId,
          cancellationWindowHours: v.cancellationWindowHours,
          primaryColor: v.primaryColor,
          logoUrl: v.logoUrl || null,
        },
      });
      if (!data) throw error;
      return data;
    },
    onSuccess() {
      toast.success("Settings saved successfully");
      void qc.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  return (
    <div className="mx-auto max-w-5xl rounded-3xl border border-[#1C283A] bg-[#111A28] shadow-2xl overflow-hidden flex flex-col md:flex-row">
      {/* Left Sidebar inside Settings Modal (Image 3) */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[#1C283A] bg-[#090E17] p-5 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Group 1: My account */}
          <div className="space-y-1">
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">
              My account
            </p>
            {[
              ["profile", "Profile", User],
              ["scheduling", "Scheduling", Calendar],
              ["branding", "Branding", Sparkles],
              ["mylink", "My link", LinkIcon],
              ["privacy", "Privacy", Check],
            ].map(([key, label, Icon]: any) => (
              <button
                key={key}
                onClick={() => setActiveSettingsNav(key)}
                className={cn(
                  "flex h-9 w-full items-center gap-3 rounded-xl px-3 text-xs font-semibold transition-colors",
                  activeSettingsNav === key
                    ? "bg-[#152B46] text-[#4D9BFF]"
                    : "text-[#8B9CB0] hover:bg-[#111A28] hover:text-white"
                )}
              >
                <Icon className="size-3.5 shrink-0" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Group 2: Features */}
          <div className="space-y-1">
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Features
            </p>
            {[
              ["notetaker", "Notetaker", Mic],
              ["contacts", "Contacts settings", Users],
            ].map(([key, label, Icon]: any) => (
              <button
                key={key}
                onClick={() => setActiveSettingsNav(key)}
                className={cn(
                  "flex h-9 w-full items-center gap-3 rounded-xl px-3 text-xs font-semibold transition-colors text-[#8B9CB0] hover:bg-[#111A28] hover:text-white"
                )}
              >
                <Icon className="size-3.5 shrink-0" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Group 3: Admin */}
          <div className="space-y-1">
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Admin
            </p>
          </div>
        </div>

        {/* Bottom Workspace Link (Image 3) */}
        <div className="pt-4 border-t border-[#1C283A]/60">
          <button
            onClick={() => setActiveSettingsNav("workspace")}
            className="flex items-center gap-2.5 px-3 text-xs font-semibold text-gray-400 hover:text-white w-full"
          >
            <Hourglass className="size-4" />
            <span>Workspace</span>
          </button>
        </div>
      </aside>

      {/* Main Settings Panel (Image 3) */}
      <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between">
        <div>
          {/* Header & Close */}
          <div className="flex items-center justify-between border-b border-[#1C283A] pb-4">
            <h2 className="text-xl font-bold text-white">Profile</h2>
            <button
              onClick={() => navigate("/admin")}
              className="text-gray-400 hover:text-white"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Subtabs: General & Login (Image 3) */}
          <div className="flex gap-6 border-b border-[#1C283A] pt-4 text-xs font-bold">
            <button
              onClick={() => setProfileTab("general")}
              className={cn(
                "pb-3 relative transition-colors",
                profileTab === "general"
                  ? "text-white"
                  : "text-gray-400 hover:text-white"
              )}
            >
              General
              {profileTab === "general" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
              )}
            </button>
            <button
              onClick={() => setProfileTab("login")}
              className={cn(
                "pb-3 relative transition-colors",
                profileTab === "login"
                  ? "text-white"
                  : "text-gray-400 hover:text-white"
              )}
            >
              Login
              {profileTab === "login" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
              )}
            </button>
          </div>

          {/* Avatar Picture Section (Image 3) */}
          <div className="mt-6 flex items-center gap-5">
            <div className="grid size-18 place-items-center rounded-full bg-neutral-200 text-neutral-400 border border-neutral-300">
              <User className="size-9 text-neutral-400" />
            </div>
            <div>
              <button
                type="button"
                onClick={() => toast.info("Image upload dialog opened")}
                className="inline-flex h-9 items-center justify-center rounded-full border border-white/20 px-4 text-xs font-bold text-white hover:bg-white/5 transition-colors"
              >
                Upload picture
              </button>
              <p className="mt-1.5 text-[11px] text-gray-400">
                JPG, GIF or PNG. Max size of 5MB.
              </p>
            </div>
          </div>

          {/* Form Fields (Image 3) */}
          <form
            id="settingsForm"
            className="mt-6 space-y-5"
            onSubmit={form.handleSubmit((v) => save.mutate(v))}
          >
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs text-white flex items-center gap-1 font-semibold">
                Name <Info className="size-3 text-gray-400" />
              </Label>
              <Input
                id="name"
                className="bg-[#0B111A] border-[#1C283A] text-white h-10 rounded-xl"
                {...form.register("name")}
              />
            </div>

            {/* Welcome message */}
            <div className="space-y-1.5">
              <Label htmlFor="welcomeMessage" className="text-xs text-white flex items-center gap-1 font-semibold">
                Welcome message <Info className="size-3 text-gray-400" />
              </Label>
              <textarea
                id="welcomeMessage"
                rows={3}
                className="w-full rounded-xl border border-[#1C283A] bg-[#0B111A] p-3 text-xs text-white placeholder:text-gray-500 focus:border-[#0069FF] focus:outline-none"
                {...form.register("welcomeMessage")}
              />
            </div>

            {/* Language */}
            <div className="space-y-1.5">
              <Label htmlFor="language" className="text-xs text-white font-semibold">
                Language
              </Label>
              <select
                id="language"
                className="h-10 w-full rounded-xl border border-[#1C283A] bg-[#0B111A] px-3 text-xs text-white"
                {...form.register("language")}
              >
                <option value="English">English</option>
                <option value="French">Français</option>
                <option value="Spanish">Español</option>
                <option value="Arabic">العربية</option>
              </select>
            </div>

            {/* Date format & Time format in 2 columns (Image 3) */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="dateFormat" className="text-xs text-white flex items-center gap-1 font-semibold">
                  Date format <Info className="size-3 text-gray-400" />
                </Label>
                <select
                  id="dateFormat"
                  className="h-10 w-full rounded-xl border border-[#1C283A] bg-[#0B111A] px-3 text-xs text-white"
                  {...form.register("dateFormat")}
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="timeFormat" className="text-xs text-white flex items-center gap-1 font-semibold">
                  Time format <Info className="size-3 text-gray-400" />
                </Label>
                <select
                  id="timeFormat"
                  className="h-10 w-full rounded-xl border border-[#1C283A] bg-[#0B111A] px-3 text-xs text-white"
                  {...form.register("timeFormat")}
                >
                  <option value="24h">24h</option>
                  <option value="12h">12h (am/pm)</option>
                </select>
              </div>
            </div>

            {/* Country */}
            <div className="space-y-1.5">
              <Label htmlFor="country" className="text-xs text-white font-semibold">
                Country
              </Label>
              <select
                id="country"
                className="h-10 w-full rounded-xl border border-[#1C283A] bg-[#0B111A] px-3 text-xs text-white"
                {...form.register("country")}
              >
                <option value="Morocco">Morocco</option>
                <option value="France">France</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Canada">Canada</option>
              </select>
            </div>

            {/* Time zone with Current Time (Image 3) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="timeZoneId" className="text-xs text-white font-semibold">
                  Time zone
                </Label>
                <span className="text-[11px] text-gray-400">
                  Current Time: {currentTime}
                </span>
              </div>
              <select
                id="timeZoneId"
                className="h-10 w-full rounded-xl border border-[#1C283A] bg-[#0B111A] px-3 text-xs text-white"
                {...form.register("timeZoneId")}
              >
                <option value="Africa/Casablanca">Morocco Time (Casablanca)</option>
                <option value="Europe/Paris">Central European Time (Paris)</option>
                <option value="Europe/London">Greenwich Mean Time (London)</option>
                <option value="America/New_York">Eastern Time (US & Canada)</option>
                <option value="UTC">UTC Universal Time</option>
              </select>
            </div>

            {/* Danger Zone: Delete account button (Image 3) */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => toast.error("Account deletion is restricted to workspace owner.")}
                className="rounded-xl bg-[#F87171]/20 px-4 py-2 text-xs font-bold text-[#F87171] hover:bg-[#F87171]/30 transition-colors"
              >
                Delete account
              </button>
            </div>
          </form>
        </div>

        {/* Footer actions: Cancel and Save changes (Image 3) */}
        <div className="mt-8 flex items-center justify-end gap-3 border-t border-[#1C283A] pt-4">
          <button
            type="button"
            onClick={() => navigate("/admin")}
            className="rounded-full border border-white/20 px-5 py-2 text-xs font-bold text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="settingsForm"
            disabled={save.isPending}
            className="rounded-full bg-white px-5 py-2 text-xs font-bold text-[#0B1A2C] shadow-md hover:bg-neutral-100 transition-colors"
          >
            {save.isPending ? "Saving changes…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PageTitle({
  title,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
        {title}
      </h1>
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
    <Card className="rounded-2xl border-[#1C283A] bg-[#111A28] text-white">
      <CardHeader>
        <CardTitle className="text-white text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          {fields.map(([key, label]) => (
            <div key={String(key)} className="space-y-1.5">
              <Label htmlFor={String(key)} className="text-xs text-[#8B9CB0]">{label}</Label>
              <Input
                id={String(key)}
                type={
                  ["durationMinutes", "priceAmount", "bufferMinutes"].includes(
                    key,
                  )
                    ? "number"
                    : "text"
                }
                className="bg-[#0B111A] border-[#1C283A] text-white"
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
          <Button className="w-full rounded-full bg-[#0069FF] text-white hover:bg-[#0056D6]" disabled={pending}>
            <Plus className="size-4" />
            {pending ? "Saving…" : "Add"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
