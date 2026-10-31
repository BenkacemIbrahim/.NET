import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  CalendarDays,
  CalendarCheck,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  Globe,
  HelpCircle,
  Hourglass,
  Info,
  Link as LinkIcon,
  LogOut,
  Menu,
  Mic,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Plus,
  Scissors,
  Search,
  Settings,
  Share2,
  Sparkles,
  Trash2,
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
  useOutletContext,
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
import { SlotlyLogo } from "../components/slotly-logo";
import { AiChatWidget } from "../components/ai-chat-widget";
import { ConfirmModal } from "../components/confirm-modal";
import { cn } from "../lib/cn";

type Booking = ApiSchemas["BookingDto"];
type Service = ApiSchemas["ServiceDto"];
type StaffMember = ApiSchemas["StaffDto"];

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const mainNavItems: NavItem[] = [
  { href: "/admin", label: "Scheduling", icon: Hourglass },
  { href: "/admin/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/admin/bookings", label: "Notetaker & Bookings", icon: FileText },
  { href: "/admin/services", label: "Event Types", icon: Scissors },
  { href: "/admin/staff", label: "Contacts & Team", icon: Users },
  { href: "/admin/schedule", label: "Availability & Hours", icon: Sparkles },
];

export function useTenantSettings() {
  return useQuery({
    queryKey: ["tenant-settings"],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/settings");
      if (!data) throw error;
      return data;
    },
  });
}

export function useBookings() {
  return useQuery({
    queryKey: ["bookings"],
    queryFn: async () => {
      const now = new Date();
      const end = new Date(now);
      end.setMonth(end.getMonth() + 2);
      const start = new Date(now);
      start.setMonth(start.getMonth() - 2);
      const { data, error } = await api.GET("/api/v1/bookings", {
        params: {
          query: {
            page: 1,
            pageSize: 100,
            startsAfter: start.toISOString(),
            startsBefore: end.toISOString(),
          },
        },
      });
      if (!data) throw error;
      return data.items ?? [];
    },
  });
}

export function useServices() {
  return useQuery({
    queryKey: ["services-admin"],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/services", {
        params: { query: { page: 1, pageSize: 100, includeInactive: true } },
      });
      if (!data) throw error;
      return data.items ?? [];
    },
  });
}

export function useStaff() {
  return useQuery({
    queryKey: ["staff-admin"],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/staff", {
        params: { query: { page: 1, pageSize: 100, includeInactive: true } },
      });
      if (!data) throw error;
      return data.items ?? [];
    },
  });
}

export function AdminGuard() {
  const { session } = useAuth();
  return session ? <AdminShell /> : <Navigate to="/login" replace />;
}

/* -----------------------------------------------------------------------
 * WorkspaceIdentity – static sidebar header (no switching)
 * --------------------------------------------------------------------- */
function WorkspaceIdentity({
  collapsed,
  currentName,
  currentUser,
  logoUrl,
  brandColor,
}: {
  collapsed: boolean;
  currentName: string;
  currentUser: string;
  logoUrl?: string | null;
  brandColor?: string;
}) {
  const initials = (currentName || currentUser || "S").charAt(0).toUpperCase();
  return (
    <div className="flex items-center gap-2 overflow-hidden rounded-xl px-2 py-1.5 w-full">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={currentName}
          className="size-8 shrink-0 rounded-full object-cover border border-white/20"
          onError={(e) => {
            (e.target as HTMLElement).style.display = "none";
          }}
        />
      ) : (
        <div
          className="grid size-8 shrink-0 place-items-center rounded-full font-bold text-xs text-white shadow-sm transition-colors"
          style={{ backgroundColor: brandColor || "#0069FF" }}
        >
          {initials}
        </div>
      )}
      {!collapsed && (
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-xs font-semibold text-white">{currentUser}</p>
          <p className="truncate text-[10px] text-gray-400">{currentName}</p>
        </div>
      )}
    </div>
  );
}

export function LoginPage() {
  const { session, login } = useAuth();
  const schema = z.object({
    tenantSlug: z.string().min(2, "Enter your workspace slug."),
    email: z.email("Enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
  });
  type Login = z.infer<typeof schema>;
  const form = useForm<Login>({
    resolver: zodResolver(schema),
    defaultValues: {
      tenantSlug: "",
      email: "",
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
      <section className="flex items-center justify-center p-6 pb-24 sm:p-12 sm:pb-28">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-between">
            <Link to="/" className="inline-flex items-center" title="Slotly">
              <SlotlyLogo variant="full" className="h-8 w-auto" />
            </Link>
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </div>

          <div className="mb-6 space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Sign in to your workspace</h1>
          </div>

          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(async (values) => {
              try {
                await login(values.email, values.password, values.tenantSlug);
                toast.success("Signed in successfully");
              } catch (error) {
                toast.error(apiMessage(error, "Could not sign in with these credentials."));
              }
            })}
          >
            <div className="space-y-1.5">
              <Label htmlFor="tenantSlug">Workspace slug</Label>
              <Input id="tenantSlug" placeholder="northstar-health" {...form.register("tenantSlug")} />
              <FieldError error={form.formState.errors.tenantSlug} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="amira.benali@northstarhealth.ma"
                {...form.register("email")}
              />
              <FieldError error={form.formState.errors.email} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...form.register("password")} />
              <FieldError error={form.formState.errors.password} />
            </div>

            <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}

export interface AdminOutletContext {
  collapsed: boolean;
  toggleCollapse: () => void;
}

export function useAdminSidebar() {
  return useOutletContext<AdminOutletContext>();
}

export function SidebarToggleButton() {
  const context = useAdminSidebar();
  if (!context) return null;
  const { collapsed, toggleCollapse } = context;

  return (
    <button
      onClick={toggleCollapse}
      className="hidden lg:grid size-6 shrink-0 place-items-center text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-white transition-colors"
      title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
    </button>
  );
}

function AdminShell() {
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [callieOpen, setCallieOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("slotly_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleOpenSettings = () => setSettingsOpen(true);
    window.addEventListener("slotly:open-settings", handleOpenSettings);
    return () => window.removeEventListener("slotly:open-settings", handleOpenSettings);
  }, []);

  useEffect(() => {
    const handleOpenCallie = () => setCallieOpen((prev) => !prev);
    window.addEventListener("slotly:open-callie", handleOpenCallie);
    return () => window.removeEventListener("slotly:open-callie", handleOpenCallie);
  }, []);

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
  const userName = session?.user.displayName || "Admin User";
  const tenantSettings = useTenantSettings();
  const tenantSlug = tenantSettings.data?.slug || "northstar-health";
  const tenantName = tenantSettings.data?.name || "Northstar Health";
  const brandColor = tenantSettings.data?.primaryColor || "#0069FF";
  const logoUrl = tenantSettings.data?.logoUrl;

  useEffect(() => {
    if (brandColor) {
      document.documentElement.style.setProperty("--primary", brandColor);
      document.documentElement.style.setProperty("--brand-primary", brandColor);
    }
  }, [brandColor]);

  return (
    <div
      style={
        {
          "--primary": brandColor,
          "--brand-primary": brandColor,
        } as React.CSSProperties
      }
      className={cn(
        "min-h-dvh bg-[#0B111A] text-white transition-[grid-template-columns] duration-300 lg:grid",
        collapsed ? "lg:grid-cols-[72px_1fr]" : "lg:grid-cols-[240px_1fr]",
      )}
    >
      {/* Calendly Dark Left Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-[#1C283A] bg-[#090E17] transition-all duration-300 lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
          collapsed ? "w-[72px] lg:w-[72px]" : "w-[240px] lg:w-[240px]",
        )}
      >
        {/* Top: Workspace Identity & Mobile Close */}
        <div className="flex h-16 shrink-0 items-center gap-1 px-2 border-b border-[#1C283A]/40">
          <div className="flex-1 min-w-0">
            <WorkspaceIdentity
              collapsed={collapsed}
              currentName={tenantName}
              currentUser={userName}
              logoUrl={logoUrl}
              brandColor={brandColor}
            />
          </div>

          <Button
            className="lg:hidden"
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
          >
            <X className="size-4 text-white" />
          </Button>
        </div>

        {/* "+ Create" Button */}
        <div className="p-3">
          <Link
            to="/admin/services"
            className={cn(
              "flex h-10 items-center justify-center gap-1.5 rounded-full border text-xs font-bold shadow-sm transition-all hover:opacity-90",
              collapsed ? "w-10 px-0 mx-auto" : "w-full px-4"
            )}
            style={{
              borderColor: `${brandColor}60`,
              backgroundColor: `${brandColor}18`,
              color: brandColor,
            }}
          >
            <Plus className="size-3.5" style={{ color: brandColor }} />
            {!collapsed && <span>Create</span>}
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
                    ? "font-bold shadow-sm"
                    : "text-[#8B9CB0] hover:bg-[#111A28] hover:text-white"
                )
              }
              style={({ isActive }) =>
                isActive
                  ? {
                      backgroundColor: `${brandColor}25`,
                      color: brandColor,
                    }
                  : undefined
              }
            >
              <Icon
                className="size-4 shrink-0 transition-colors"
                style={{ color: "inherit" }}
              />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Sidebar: My link, Upgrade Plan & Settings */}
        <div className="shrink-0 space-y-2 p-3 border-t border-[#1C283A]/50">
          {!collapsed ? (
            <div className="rounded-xl border border-[#1C283A] bg-[#111A28] p-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300">Public Link</span>
                <button
                  onClick={() => {
                    void navigator.clipboard.writeText(`${window.location.origin}/book/${tenantSlug}`);
                    toast.success("Link copied to clipboard!");
                  }}
                  className="text-gray-400 hover:text-white"
                  title="Copy public booking link"
                >
                  <Copy className="size-3" />
                </button>
              </div>
              <a
                href={`/book/${tenantSlug}`}
                target="_blank"
                rel="noreferrer"
                className="mt-1 flex items-center gap-1 text-[11px] hover:underline truncate"
                style={{ color: brandColor }}
              >
                <span>/book/{tenantSlug}</span>
                <ExternalLink className="size-2.5 shrink-0" />
              </a>
            </div>
          ) : (
            <button
              onClick={() => {
                void navigator.clipboard.writeText(`${window.location.origin}/book/${tenantSlug}`);
                toast.success("Link copied!");
              }}
              className="grid size-9 mx-auto place-items-center rounded-full border border-gray-200 dark:border-white/20 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/5"
              title="Copy booking link"
            >
              <LinkIcon className="size-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setSettingsOpen(true);
            }}
            title={collapsed ? "Settings" : undefined}
            className={cn(
              "flex h-9 items-center rounded-xl text-xs font-semibold transition-colors",
              collapsed ? "justify-center size-9 mx-auto" : "gap-3 px-3 w-full",
              settingsOpen
                ? "font-bold shadow-sm"
                : "text-[#8B9CB0] hover:bg-[#111A28] hover:text-white"
            )}
            style={
              settingsOpen
                ? {
                    backgroundColor: `${brandColor}25`,
                    color: brandColor,
                  }
                : undefined
            }
          >
            <Settings className="size-4 shrink-0" style={settingsOpen ? { color: brandColor } : undefined} />
            {!collapsed && <span style={settingsOpen ? { color: brandColor } : undefined}>Settings</span>}
          </button>

          <button
            onClick={logout}
            className={cn(
              "flex h-9 items-center rounded-xl text-xs font-semibold text-gray-500 hover:!text-red-500 dark:hover:!text-red-400 transition-colors",
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
          <span className="font-bold text-sm text-white">{tenantName}</span>
          <ThemeToggle />
        </div>

        {/* View Outlet */}
        <main className="w-full flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto">
          <Outlet context={{ collapsed, toggleCollapse } satisfies AdminOutletContext} />
        </main>
      </div>

      {/* Floating AI Chat Widget — available on all admin pages */}
      <AiChatWidget open={callieOpen} onOpenChange={setCallieOpen} />

      {/* Settings Modal */}
      {settingsOpen && (
        <SettingsModal onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  );
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
          : label === "Completed"
            ? "bg-blue-400"
            : "bg-gray-400";
  return (
    <span className="inline-flex items-center gap-2 text-xs font-semibold text-white">
      <span className={cn("size-1.5 rounded-full", dot)} />
      {label}
    </span>
  );
}

function DashboardMetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
  points,
}: {
  label: string;
  value: number;
  detail: string;
  icon: LucideIcon;
  tone: "brand" | "emerald" | "purple" | "amber";
  points: string;
}) {
  const isBrand = tone === "brand";
  const accentClass = {
    brand: "text-white",
    emerald: "text-emerald-400",
    purple: "text-purple-400",
    amber: "text-amber-400",
  }[tone];
  const iconClass = {
    brand: "bg-white/15 text-white",
    emerald: "bg-emerald-400/10 text-emerald-400",
    purple: "bg-purple-400/10 text-purple-400",
    amber: "bg-amber-400/10 text-amber-400",
  }[tone];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border p-4 shadow-sm transition-transform duration-200 hover:-translate-y-0.5",
        isBrand
          ? "border-transparent text-white shadow-lg"
          : "border-[#1C283A] bg-[#111A28] hover:border-[#2A3C52]"
      )}
      style={isBrand ? { backgroundColor: "var(--brand-primary, #0069FF)", borderColor: "var(--brand-primary, #0069FF)" } : undefined}
    >
      {isBrand && <div className="absolute -right-8 -top-8 size-28 rounded-full bg-white/10 blur-2xl" />}
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className={cn("text-xs font-medium", isBrand ? "text-white/75" : "text-[#8B9CB0]")}>{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-white tabular-nums">{value}</p>
        </div>
        <div className={cn("grid size-9 place-items-center rounded-xl", iconClass)}>
          <Icon className="size-4" />
        </div>
      </div>
      <div className="relative mt-4 flex items-end justify-between gap-3">
        <span className={cn("text-[11px] font-semibold", isBrand ? "text-white/85" : "text-[#8B9CB0]")}>{detail}</span>
        <svg viewBox="0 0 96 30" className={cn("h-8 w-24", accentClass)} aria-hidden="true">
          <path d={`M0 29 L${points} L96 29 Z`} className="fill-current opacity-10" />
          <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------
 * DASHBOARD / SCHEDULING VIEW
 * ------------------------------------------------------------- */
export function DashboardPage() {
  const { session } = useAuth();
  const userName = session?.user.displayName || "Admin User";
  const [activeTab, setActiveTab] = useState<"event-types" | "single-use" | "polls" | "routing">("event-types");
  const [searchQuery, setSearchQuery] = useState("");
  const [getStartedOpen, setGetStartedOpen] = useState(true);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [creatingService, setCreatingService] = useState(false);
  const [deletingService, setDeletingService] = useState<Service | null>(null);

  const qc = useQueryClient();
  const tenantSettings = useTenantSettings();
  const tenantSlug = tenantSettings.data?.slug || "northstar-health";

  const services = useServices();
  const bookings = useBookings();
  const staff = useStaff();

  // Metrics
  const todayCount = useMemo(() => {
    if (!bookings.data) return 0;
    const todayStr = new Date().toDateString();
    return bookings.data.filter((b) => new Date(b.startsAt!).toDateString() === todayStr).length;
  }, [bookings.data]);

  const upcomingCount = useMemo(() => {
    if (!bookings.data) return 0;
    const now = new Date();
    return bookings.data.filter((b) => new Date(b.startsAt!) >= now && (b.status === 1 || b.status === 2)).length;
  }, [bookings.data]);

  const activeServicesCount = useMemo(() => {
    if (!services.data) return 0;
    return services.data.filter((s) => s.isActive).length;
  }, [services.data]);

  const filteredServices = useMemo(() => {
    if (!services.data) return [];
    return services.data.filter((s) =>
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [services.data, searchQuery]);

  const copyPublicLink = (serviceId?: string) => {
    const url = serviceId
      ? `${window.location.origin}/book/${tenantSlug}?serviceId=${serviceId}`
      : `${window.location.origin}/book/${tenantSlug}`;
    void navigator.clipboard.writeText(url);
    toast.success("Booking link copied to clipboard!");
  };

  // Delete service mutation
  const deleteService = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.DELETE("/api/v1/services/{id}", {
        params: { path: { id } },
      });
      if (!res.response.ok) throw new Error("Could not deactivate service.");
    },
    onSuccess: () => {
      toast.success("Service deactivated");
      void qc.invalidateQueries({ queryKey: ["services-admin"] });
    },
    onError: (e) => toast.error(apiMessage(e)),
  });

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <SidebarToggleButton />
          <h1 className="text-2xl font-bold tracking-tight text-white">Scheduling</h1>
          <button
            className="text-gray-400 hover:text-white"
            title="Manage your event types and booking links"
          >
            <Info className="size-4" />
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <ThemeToggle className="size-9 rounded-lg border-[#1C283A] bg-[#111A28] text-gray-400 hover:text-white hover:bg-[#162234]" />
          <button
            onClick={() => toast.info("Slotly Help Center is available 24/7.")}
            className="grid size-9 place-items-center rounded-lg border border-[#1C283A] text-gray-400 hover:text-white hover:bg-[#111A28]"
            title="Help"
          >
            <HelpCircle className="size-4" />
          </button>

          {/* Ask Callie AI Button */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("slotly:open-callie"))}
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

          <button
            onClick={() => setCreatingService(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-4 text-xs font-bold text-[#0B1A2C] shadow-sm hover:bg-neutral-100 transition-colors"
          >
            <Plus className="size-3.5" />
            <span>Create</span>
          </button>
        </div>
      </div>

      {/* Stats Metric Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <DashboardMetricCard label="Today's Sessions" value={todayCount} detail="Today" icon={CalendarCheck} tone="brand" points="8,22 24,17 42,20 59,10 78,14" />
        <DashboardMetricCard label="Upcoming Bookings" value={upcomingCount} detail="Next 7 days" icon={Clock} tone="emerald" points="8,23 24,19 42,22 59,12 78,8" />
        <DashboardMetricCard label="Active Event Types" value={activeServicesCount} detail="Published" icon={Scissors} tone="purple" points="8,22 24,14 42,17 59,11 78,13" />
        <DashboardMetricCard label="Team Members" value={staff.data?.length ?? 0} detail="Active members" icon={Users} tone="amber" points="8,24 24,23 42,16 59,17 78,9" />
      </div>

      {/* Callie AI — uses the floating AI widget in the bottom-right corner */}

      {/* Sub-Navigation Tabs */}
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
                <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ backgroundColor: "var(--brand-primary, #0069FF)" }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === "event-types" && (
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

            {/* User Row */}
            <div className="flex items-center justify-between border-b border-[#1C283A] pb-3 pt-1">
              <div className="flex items-center gap-3">
                <div
                  className="grid size-7 place-items-center rounded-full font-bold text-xs text-white"
                  style={{ backgroundColor: "var(--brand-primary, #0069FF)" }}
                >
                  {userName.charAt(0)}
                </div>
                <span className="text-sm font-bold text-white">{userName}</span>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={`/book/${tenantSlug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs font-semibold hover:underline"
                  style={{ color: "var(--brand-primary, #0069FF)" }}
                >
                  <span>View landing page</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>
            </div>

            {/* Event Type Cards List */}
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
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white group-hover:text-[#4D9BFF] transition-colors">
                            {service.name}
                          </h3>
                          <Badge variant={service.isActive ? "success" : "neutral"} className="text-[10px]">
                            {service.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-[#8B9CB0] leading-relaxed">
                          {service.durationMinutes} min • {service.priceAmount} {service.currency} • {service.bufferMinutes}m buffer
                        </p>
                      </div>
                    </div>

                    {/* Actions on Right */}
                    <div className="flex items-center gap-2 ml-auto sm:ml-0">
                      <button
                        onClick={() => copyPublicLink(service.id)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-gray-200 dark:border-white/20 bg-transparent px-3 text-xs font-semibold text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                      >
                        <LinkIcon className="size-3" />
                        <span>Copy link</span>
                      </button>

                      <a
                        href={`/book/${tenantSlug}?serviceId=${service.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="grid size-8 place-items-center rounded-lg text-gray-400 hover:text-white hover:bg-[#162234]"
                        title="Open booking page"
                      >
                        <Share2 className="size-3.5" />
                      </a>

                      <button
                        onClick={() => setEditingService(service)}
                        className="grid size-8 place-items-center rounded-lg text-gray-400 hover:text-white hover:bg-[#162234]"
                        title="Edit event type"
                      >
                        <Pencil className="size-3.5" />
                      </button>

                      <button
                        onClick={() => setDeletingService(service)}
                        className="grid size-8 place-items-center rounded-lg text-gray-400 hover:text-red-400 hover:bg-[#162234]"
                        title="Deactivate event type"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {!filteredServices.length && (
                <EmptyState
                  icon={Scissors}
                  title="No event types found"
                  description="Create a new event type to allow clients to book appointments with you."
                />
              )}
            </div>
          </div>

          {/* Right "Get started" Drawer */}
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
                <div
                  onClick={() => copyPublicLink()}
                  className="flex items-start gap-3 p-2 rounded-xl hover:bg-[#162234] transition-colors cursor-pointer"
                >
                  <div className="grid size-9 place-items-center rounded-lg bg-blue-900/40 text-[#4D9BFF] shrink-0">
                    <Globe className="size-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Share your public link</p>
                    <p className="text-[11px] text-[#8B9CB0]">Copy link for clients</p>
                  </div>
                </div>

                <Link
                  to="/admin/calendar"
                  className="flex items-start gap-3 p-2 rounded-xl hover:bg-[#162234] transition-colors cursor-pointer"
                >
                  <div className="grid size-9 place-items-center rounded-lg bg-blue-900/40 text-[#4D9BFF] shrink-0">
                    <Calendar className="size-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Calendar overview</p>
                    <p className="text-[11px] text-[#8B9CB0]">Review scheduled appointments</p>
                  </div>
                </Link>

                <Link
                  to="/admin/schedule"
                  className="flex items-start gap-3 p-2 rounded-xl hover:bg-[#162234] transition-colors cursor-pointer"
                >
                  <div className="grid size-9 place-items-center rounded-lg bg-blue-900/40 text-[#4D9BFF] shrink-0">
                    <Clock className="size-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Set working hours</p>
                    <p className="text-[11px] text-[#8B9CB0]">Manage weekly availability</p>
                  </div>
                </Link>

                <Link
                  to="/admin/staff"
                  className="flex items-start gap-3 p-2 rounded-xl hover:bg-[#162234] transition-colors cursor-pointer"
                >
                  <div className="grid size-9 place-items-center rounded-lg bg-blue-900/40 text-[#4D9BFF] shrink-0">
                    <Users className="size-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Invite team members</p>
                    <p className="text-[11px] text-[#8B9CB0]">Add practitioners to workspace</p>
                  </div>
                </Link>
              </div>

              <button
                onClick={() => setGetStartedOpen(false)}
                className="w-full rounded-xl border border-white/20 py-2.5 text-xs font-bold text-white hover:bg-white/5 transition-colors"
              >
                Hide guide
              </button>
            </div>
          )}
        </div>
      )}

      {/* Single-use Links Tab */}
      {activeTab === "single-use" && (
        <SingleUseLinksSection tenantSlug={tenantSlug} services={services.data ?? []} />
      )}

      {/* Meeting Polls Tab */}
      {activeTab === "polls" && (
        <MeetingPollsSection tenantSlug={tenantSlug} />
      )}

      {/* Routing Forms Tab */}
      {activeTab === "routing" && (
        <RoutingFormsSection staff={staff.data ?? []} />
      )}

      {/* Create Service Modal */}
      {creatingService && (
        <ServiceModal
          onClose={() => setCreatingService(false)}
          onSuccess={() => {
            setCreatingService(false);
            void qc.invalidateQueries({ queryKey: ["services-admin"] });
          }}
        />
      )}

      {/* Edit Service Modal */}
      {editingService && (
        <ServiceModal
          service={editingService}
          onClose={() => setEditingService(null)}
          onSuccess={() => {
            setEditingService(null);
            void qc.invalidateQueries({ queryKey: ["services-admin"] });
          }}
        />
      )}

      {/* Deactivate Service Confirmation Modal */}
      <ConfirmModal
        open={Boolean(deletingService)}
        title="Deactivate Event Type"
        description={
          <>
            Are you sure you want to deactivate{" "}
            <span className="font-bold text-gray-900 dark:text-white">
              {deletingService?.name}
            </span>
            ? Clients will no longer be able to book this event type on your public booking page.
          </>
        }
        confirmText="Deactivate"
        isPending={deleteService.isPending}
        onConfirm={() => {
          if (deletingService?.id) {
            deleteService.mutate(deletingService.id, {
              onSuccess: () => setDeletingService(null),
            });
          }
        }}
        onClose={() => setDeletingService(null)}
      />
    </div>
  );
}

/* -------------------------------------------------------------
 * SINGLE-USE LINKS SECTION
 * ------------------------------------------------------------- */
function SingleUseLinksSection({
  tenantSlug,
  services,
}: {
  tenantSlug: string;
  services: Service[];
}) {
  const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id || "");
  const [links, setLinks] = useState<
    { id: string; serviceName: string; url: string; createdAt: string; status: "Active" | "Used" }[]
  >(() => {
    try {
      const stored = localStorage.getItem("slotly_single_use_links");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const generateLink = () => {
    const s = services.find((x) => x.id === selectedServiceId) || services[0];
    if (!s) return;
    const token = Math.random().toString(36).substring(2, 10);
    const linkUrl = `${window.location.origin}/book/${tenantSlug}?serviceId=${s.id}&single_use=${token}`;
    const newEntry = {
      id: token,
      serviceName: s.name || "Consultation",
      url: linkUrl,
      createdAt: new Date().toLocaleDateString(),
      status: "Active" as const,
    };
    const updated = [newEntry, ...links];
    setLinks(updated);
    try {
      localStorage.setItem("slotly_single_use_links", JSON.stringify(updated));
    } catch {
      // ignore
    }
    void navigator.clipboard.writeText(linkUrl);
    toast.success("Single-use link generated and copied to clipboard!");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#1C283A] bg-[#111A28] p-6 space-y-4">
        <h2 className="text-lg font-bold text-white">Generate Single-Use Booking Link</h2>
        <p className="text-xs text-[#8B9CB0]">
          Single-use links prevent double booking and ensure a client can only reserve one specific appointment slot.
        </p>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <select
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            className="h-10 rounded-xl border border-[#1C283A] bg-[#0B111A] px-3.5 text-xs text-white focus:border-[#0069FF] focus:outline-none"
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.durationMinutes} min - {s.priceAmount} {s.currency})
              </option>
            ))}
          </select>

          <Button
            onClick={generateLink}
            className="rounded-xl px-4 text-xs font-bold text-white shadow-md hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "var(--brand-primary, #0069FF)" }}
          >
            <Plus className="size-3.5 mr-1.5" />
            Generate Link
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-[#1C283A] bg-[#111A28] p-6">
        <h3 className="text-sm font-bold text-white mb-4">Active Single-Use Links</h3>
        {links.length ? (
          <div className="divide-y divide-[#1C283A]">
            {links.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-xs">{item.serviceName}</span>
                    <Badge variant="success" className="text-[10px]">
                      {item.status}
                    </Badge>
                  </div>
                  <p className="font-mono text-[11px] text-gray-400 truncate max-w-md mt-0.5">{item.url}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      void navigator.clipboard.writeText(item.url);
                      toast.success("Link copied!");
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#1C283A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#162234]"
                  >
                    <Copy className="size-3" />
                    <span>Copy</span>
                  </button>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-[#1C283A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#162234]"
                  >
                    <ExternalLink className="size-3" />
                  </a>
                  <button
                    onClick={() => {
                      const updated = links.filter((l) => l.id !== item.id);
                      setLinks(updated);
                      try {
                        localStorage.setItem("slotly_single_use_links", JSON.stringify(updated));
                      } catch {}
                      toast.success("Single-use link deleted");
                    }}
                    className="grid size-8 place-items-center rounded-lg text-gray-400 hover:text-red-400 hover:bg-[#162234]"
                    title="Delete link"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#8B9CB0]">No single-use links created yet.</p>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------
 * MEETING POLLS SECTION
 * ------------------------------------------------------------- */
function MeetingPollsSection({ tenantSlug }: { tenantSlug: string }) {
  const [polls, setPolls] = useState<
    { id: string; title: string; duration: number; optionsCount: number; votes: number }[]
  >(() => {
    try {
      const stored = localStorage.getItem("slotly_meeting_polls");
      return stored
        ? JSON.parse(stored)
        : [
            {
              id: "poll-1",
              title: "Clinical Staff Alignment Meeting",
              duration: 45,
              optionsCount: 3,
              votes: 2,
            },
          ];
    } catch {
      return [];
    }
  });

  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(30);

  const createPoll = () => {
    if (!title.trim()) {
      toast.error("Please enter a poll title.");
      return;
    }
    const newPoll = {
      id: `poll-${Date.now()}`,
      title: title.trim(),
      duration,
      optionsCount: 3,
      votes: 0,
    };
    const updated = [newPoll, ...polls];
    setPolls(updated);
    try {
      localStorage.setItem("slotly_meeting_polls", JSON.stringify(updated));
    } catch {
      // ignore
    }
    setTitle("");
    toast.success("Meeting poll created successfully!");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#1C283A] bg-[#111A28] p-6 space-y-4">
        <h2 className="text-lg font-bold text-white">Create a Meeting Poll</h2>
        <p className="text-xs text-[#8B9CB0]">
          Poll invitees on preferred dates and times. The slot with the most votes can automatically be booked.
        </p>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Quarterly Team Planning"
            className="bg-[#0B111A] border-[#1C283A] text-white h-10 rounded-xl max-w-sm"
          />

          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="h-10 rounded-xl border border-[#1C283A] bg-[#0B111A] px-3.5 text-xs text-white"
          >
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>60 minutes</option>
          </select>

          <Button
            onClick={createPoll}
            className="rounded-xl px-4 text-xs font-bold text-white shadow-md hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "var(--brand-primary, #0069FF)" }}
          >
            <Plus className="size-3.5 mr-1.5" />
            Create Poll
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-[#1C283A] bg-[#111A28] p-6">
        <h3 className="text-sm font-bold text-white mb-4">Active Meeting Polls</h3>
        {polls.length ? (
          <div className="divide-y divide-[#1C283A]">
            {polls.map((poll) => (
              <div key={poll.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3">
                <div>
                  <h4 className="font-semibold text-white text-xs">{poll.title}</h4>
                  <p className="text-[11px] text-[#8B9CB0] mt-0.5">
                    {poll.duration} min • {poll.optionsCount} time slots • {poll.votes} votes received
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      void navigator.clipboard.writeText(`${window.location.origin}/book/${tenantSlug}?poll=${poll.id}`);
                      toast.success("Poll link copied to clipboard!");
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#1C283A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#162234]"
                  >
                    <Copy className="size-3" />
                    <span>Share Poll</span>
                  </button>
                  <button
                    onClick={() => {
                      const updated = polls.filter((p) => p.id !== poll.id);
                      setPolls(updated);
                      try {
                        localStorage.setItem("slotly_meeting_polls", JSON.stringify(updated));
                      } catch {}
                      toast.success("Meeting poll deleted");
                    }}
                    className="grid size-8 place-items-center rounded-lg text-gray-400 hover:text-red-400 hover:bg-[#162234]"
                    title="Delete poll"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#8B9CB0]">No polls created yet.</p>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------
 * ROUTING FORMS SECTION
 * ------------------------------------------------------------- */
function RoutingFormsSection({ staff }: { staff: StaffMember[] }) {
  const [ruleType, setRuleType] = useState<"round-robin" | "specialty">(() => {
    try {
      const stored = localStorage.getItem("slotly_routing_config");
      return stored ? JSON.parse(stored).ruleType : "round-robin";
    } catch {
      return "round-robin";
    }
  });
  const [enabled, setEnabled] = useState(() => {
    try {
      const stored = localStorage.getItem("slotly_routing_config");
      return stored ? JSON.parse(stored).enabled : true;
    } catch {
      return true;
    }
  });

  const saveRouting = (nextEnabled: boolean, nextRuleType: "round-robin" | "specialty") => {
    setEnabled(nextEnabled);
    setRuleType(nextRuleType);
    try {
      localStorage.setItem(
        "slotly_routing_config",
        JSON.stringify({ enabled: nextEnabled, ruleType: nextRuleType })
      );
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#1C283A] bg-[#111A28] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Intelligent Booking Routing</h2>
            <p className="text-xs text-[#8B9CB0] mt-1">
              Automatically distribute client appointments across your team members.
            </p>
          </div>
          <button
            onClick={() => {
              const next = !enabled;
              saveRouting(next, ruleType);
              toast.success(`Routing ${next ? "activated" : "disabled"} and saved!`);
            }}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-bold transition-colors cursor-pointer",
              enabled ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : "bg-gray-800 text-gray-400"
            )}
          >
            {enabled ? "Active" : "Disabled"}
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 pt-2">
          <div
            onClick={() => {
              saveRouting(enabled, "round-robin");
              toast.success("Routing rule set to Round-Robin and saved!");
            }}
            className={cn(
              "cursor-pointer rounded-xl border p-4 transition-all",
              ruleType === "round-robin"
                ? "text-white shadow-sm"
                : "border-[#1C283A] bg-[#0B111A] text-gray-400 hover:border-gray-600"
            )}
            style={
              ruleType === "round-robin"
                ? {
                    borderColor: "var(--brand-primary, #0069FF)",
                    backgroundColor: "color-mix(in srgb, var(--brand-primary, #0069FF) 12%, transparent)",
                  }
                : undefined
            }
          >
            <h4 className="font-bold text-xs">Round-Robin Assignment</h4>
            <p className="text-[11px] mt-1 opacity-80">
              Evenly balances appointment distribution across all available staff members on duty.
            </p>
          </div>

          <div
            onClick={() => {
              saveRouting(enabled, "specialty");
              toast.success("Routing rule set to Specialty Matching and saved!");
            }}
            className={cn(
              "cursor-pointer rounded-xl border p-4 transition-all",
              ruleType === "specialty"
                ? "text-white shadow-sm"
                : "border-[#1C283A] bg-[#0B111A] text-gray-400 hover:border-gray-600"
            )}
            style={
              ruleType === "specialty"
                ? {
                    borderColor: "var(--brand-primary, #0069FF)",
                    backgroundColor: "color-mix(in srgb, var(--brand-primary, #0069FF) 12%, transparent)",
                  }
                : undefined
            }
          >
            <h4 className="font-bold text-xs">Practitioner Specialty Matching</h4>
            <p className="text-[11px] mt-1 opacity-80">
              Routes client bookings based on requested medical service discipline.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-[#1C283A] pt-4">
          <h4 className="text-xs font-bold text-gray-900 dark:text-white mb-2">Team Members Participating ({staff.length})</h4>
          <div className="flex flex-wrap gap-2">
            {staff.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-[#1C283A] bg-gray-50 dark:bg-[#0B111A] px-2.5 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 shadow-2xs"
              >
                <span className="size-1.5 rounded-full bg-emerald-500" />
                {s.displayName}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------
 * SERVICE CREATE/EDIT MODAL
 * ------------------------------------------------------------- */
function ServiceModal({
  service,
  onClose,
  onSuccess,
}: {
  service?: Service;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const schema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    durationMinutes: z.number().min(5, "Minimum duration is 5 minutes."),
    priceAmount: z.number().min(0),
    currency: z.string().length(3),
    bufferMinutes: z.number().min(0),
  });

  type ServiceForm = z.infer<typeof schema>;

  const form = useForm<ServiceForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: service?.name || "",
      durationMinutes: service?.durationMinutes || 30,
      priceAmount: service?.priceAmount || 0,
      currency: service?.currency || "MAD",
      bufferMinutes: service?.bufferMinutes || 0,
    },
  });

  const mutation = useMutation({
    mutationFn: async (v: ServiceForm) => {
      if (service?.id) {
        const res = await api.PUT("/api/v1/services/{id}", {
          params: { path: { id: service.id } },
          body: v,
        });
        if (!res.response.ok) throw new Error("Could not update service.");
        return res.data;
      } else {
        const res = await api.POST("/api/v1/services", { body: v });
        if (!res.response.ok) throw new Error("Could not create service.");
        return res.data;
      }
    },
    onSuccess: () => {
      toast.success(service ? "Service updated" : "Service created");
      onSuccess();
    },
    onError: (e) => toast.error(apiMessage(e)),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-[#1C283A] bg-[#111A28] p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-[#1C283A] pb-3">
          <h2 className="text-lg font-bold text-white">
            {service ? "Edit Event Type" : "New Event Type"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="size-4" />
          </button>
        </div>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
        >
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs text-[#8B9CB0]">Service Name</Label>
            <Input
              id="name"
              placeholder="e.g. Physiotherapy Consultation"
              className="bg-[#0B111A] border-[#1C283A] text-white"
              {...form.register("name")}
            />
            <FieldError error={form.formState.errors.name} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="durationMinutes" className="text-xs text-[#8B9CB0]">Duration (minutes)</Label>
              <Input
                id="durationMinutes"
                type="number"
                className="bg-[#0B111A] border-[#1C283A] text-white"
                {...form.register("durationMinutes", { valueAsNumber: true })}
              />
              <FieldError error={form.formState.errors.durationMinutes} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bufferMinutes" className="text-xs text-[#8B9CB0]">Buffer (minutes)</Label>
              <Input
                id="bufferMinutes"
                type="number"
                className="bg-[#0B111A] border-[#1C283A] text-white"
                {...form.register("bufferMinutes", { valueAsNumber: true })}
              />
              <FieldError error={form.formState.errors.bufferMinutes} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="priceAmount" className="text-xs text-[#8B9CB0]">Price</Label>
              <Input
                id="priceAmount"
                type="number"
                className="bg-[#0B111A] border-[#1C283A] text-white"
                {...form.register("priceAmount", { valueAsNumber: true })}
              />
              <FieldError error={form.formState.errors.priceAmount} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="currency" className="text-xs text-[#8B9CB0]">Currency</Label>
              <Input
                id="currency"
                maxLength={3}
                className="bg-[#0B111A] border-[#1C283A] text-white uppercase"
                {...form.register("currency")}
              />
              <FieldError error={form.formState.errors.currency} />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-[#1C283A]">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-[#1C283A] text-white hover:bg-[#162234]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="text-white shadow-md hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "var(--brand-primary, #0069FF)" }}
            >
              {mutation.isPending ? "Saving…" : service ? "Save Changes" : "Create Event Type"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------
 * BOOKINGS PAGE ("Notetaker & Bookings")
 * ------------------------------------------------------------- */
export function BookingsPage() {
  const bookings = useBookings();
  const [filter, setFilter] = useState<"all" | "confirmed" | "pending" | "completed" | "cancelled">("all");
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(() => {
    if (!bookings.data) return [];
    let items = bookings.data;
    if (filter === "confirmed") items = items.filter((x) => x.status === 2);
    if (filter === "pending") items = items.filter((x) => x.status === 1);
    if (filter === "completed") items = items.filter((x) => x.status === 4);
    if (filter === "cancelled") items = items.filter((x) => x.status === 3);

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (b) =>
          b.customerName?.toLowerCase().includes(q) ||
          b.customerEmail?.toLowerCase().includes(q) ||
          b.serviceName?.toLowerCase().includes(q) ||
          b.staffName?.toLowerCase().includes(q) ||
          b.id?.toLowerCase().includes(q)
      );
    }
    return items;
  }, [bookings.data, filter, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <SidebarToggleButton />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Notetaker & Scheduled Events</h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <ThemeToggle className="size-9 rounded-lg border-[#1C283A] bg-[#111A28] text-gray-400 hover:text-white hover:bg-[#162234]" />
          <button
            onClick={() => toast.info("Slotly Help Center is available 24/7.")}
            className="grid size-9 place-items-center rounded-lg border border-[#1C283A] text-gray-400 hover:text-white hover:bg-[#111A28]"
            title="Help"
          >
            <HelpCircle className="size-4" />
          </button>

          {/* Search */}
          <div className="relative max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by client or service"
              className="h-9 w-full rounded-xl border border-[#1C283A] bg-[#111A28] pl-9 pr-3 text-xs text-white placeholder:text-gray-500 focus:border-[#0069FF] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-[#1C283A] pb-3">
        {(
          [
            ["all", "All bookings"],
            ["confirmed", "Confirmed"],
            ["pending", "Pending"],
            ["completed", "Completed"],
            ["cancelled", "Cancelled"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
              filter === key
                ? "shadow-sm font-bold text-white"
                : "text-[#8B9CB0] hover:text-white"
            )}
            style={
              filter === key
                ? {
                    backgroundColor: "var(--brand-primary, #0069FF)",
                  }
                : undefined
            }
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
            description="Appointments matching your criteria will appear here."
          />
        )}
      </div>
    </div>
  );
}

function BookingRows({ items }: { items: Booking[] }) {
  const qc = useQueryClient();
  const [reschedulingBooking, setReschedulingBooking] = useState<Booking | null>(null);
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [notetakerBooking, setNotetakerBooking] = useState<Booking | null>(null);

  const updateStatus = useMutation({
    mutationFn: async ({
      booking,
      action,
      reason,
    }: {
      booking: Booking;
      action: "cancel" | "complete" | "no-show";
      reason?: string;
    }) => {
      const params = { path: { id: booking.id! } };
      const body =
        action === "cancel"
          ? {
              version: booking.version,
              reason: reason || "Cancelled by tenant administrator",
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
      setCancellingBooking(null);
      void qc.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (error) => toast.error(apiMessage(error)),
  });

  return (
    <>
      <div className="divide-y divide-[#1C283A]">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-wrap items-center gap-x-4 gap-y-3 py-4 text-sm sm:flex-nowrap hover:bg-slate-50 dark:hover:bg-[#162234]/30 px-2 rounded-xl transition-colors"
          >
            {/* Client avatar & info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">
                  {item.customerName || `Client #${item.customerId?.slice(0, 8)}`}
                </span>
                {item.customerEmail && (
                  <span className="text-xs text-[#8B9CB0]">({item.customerEmail})</span>
                )}
              </div>
              <p className="mt-1 text-xs text-[#8B9CB0]">
                <span className="text-white font-medium">{item.serviceName || "Consultation"}</span>
                {item.staffName && <span> • Practitioner: {item.staffName}</span>}
                <span> • </span>
                <span className="tabular-nums">
                  {new Date(item.startsAt!).toLocaleString([], {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </p>
            </div>

            {/* Status */}
            <div className="shrink-0">
              <Status value={item.status} />
            </div>

            {/* Action buttons */}
            <div className="ml-auto flex shrink-0 items-center gap-1.5">
              {/* Notetaker button */}
              <Button
                size="sm"
                variant="ghost"
                className="text-[#0069FF] dark:text-[#4D9BFF] hover:bg-blue-50 dark:hover:bg-[#0069FF]/10 font-medium transition-colors"
                onClick={() => setNotetakerBooking(item)}
                title="View/Add Meeting Notes"
              >
                <Mic className="size-3.5 mr-1" />
                Notes
              </Button>

              {/* Reschedule button for pending/confirmed */}
              {(item.status === 1 || item.status === 2) && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-gray-200 dark:border-[#1C283A] bg-white dark:bg-transparent text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-[#162234] shadow-sm font-medium transition-colors"
                  onClick={() => setReschedulingBooking(item)}
                >
                  Reschedule
                </Button>
              )}

              {/* Complete / No-show for confirmed */}
              {item.status === 2 && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-500/60 font-medium transition-colors"
                    onClick={() => updateStatus.mutate({ booking: item, action: "complete" })}
                  >
                    Complete
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 font-medium transition-colors"
                    onClick={() => updateStatus.mutate({ booking: item, action: "no-show" })}
                  >
                    No show
                  </Button>
                </>
              )}

              {/* Cancel button */}
              {(item.status === 1 || item.status === 2) && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-700 dark:hover:text-red-300 font-medium transition-colors"
                  onClick={() => setCancellingBooking(item)}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Reschedule Modal */}
      {reschedulingBooking && (
        <RescheduleModal
          booking={reschedulingBooking}
          onClose={() => setReschedulingBooking(null)}
          onSuccess={() => {
            setReschedulingBooking(null);
            void qc.invalidateQueries({ queryKey: ["bookings"] });
          }}
        />
      )}

      {/* Cancel Confirmation Modal */}
      {cancellingBooking && (
        <CancelModal
          booking={cancellingBooking}
          onClose={() => setCancellingBooking(null)}
          onConfirm={(reason) =>
            updateStatus.mutate({ booking: cancellingBooking, action: "cancel", reason })
          }
          isPending={updateStatus.isPending}
        />
      )}

      {/* Notetaker Notes Modal */}
      {notetakerBooking && (
        <NotetakerModal
          booking={notetakerBooking}
          onClose={() => setNotetakerBooking(null)}
        />
      )}
    </>
  );
}

function RescheduleModal({
  booking,
  onClose,
  onSuccess,
}: {
  booking: Booking;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const currentIso = new Date(booking.startsAt!).toISOString().slice(0, 16);
  const [newDateTime, setNewDateTime] = useState(currentIso);

  const rescheduleMutation = useMutation({
    mutationFn: async () => {
      const startsAt = new Date(newDateTime).toISOString();
      const res = await api.POST("/api/v1/bookings/{id}/reschedule", {
        params: { path: { id: booking.id! } },
        body: {
          version: booking.version,
          startsAt,
        },
      });
      if (!res.response.ok) throw new Error("Could not reschedule appointment.");
      return res.data;
    },
    onSuccess: () => {
      toast.success("Appointment successfully rescheduled");
      onSuccess();
    },
    onError: (e) => toast.error(apiMessage(e)),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[#1C283A] bg-[#111A28] p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#1C283A] pb-3">
          <h3 className="font-bold text-white text-base">Reschedule Appointment</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="size-4" />
          </button>
        </div>

        <p className="text-xs text-[#8B9CB0]">
          Moving appointment for <span className="font-semibold text-white">{booking.customerName || "Client"}</span> ({booking.serviceName}).
        </p>

        <div className="space-y-1.5">
          <Label htmlFor="rescheduleTime" className="text-xs text-white">Select New Date & Time</Label>
          <Input
            id="rescheduleTime"
            type="datetime-local"
            value={newDateTime}
            onChange={(e) => setNewDateTime(e.target.value)}
            className="bg-[#0B111A] border-[#1C283A] text-white"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-[#1C283A]">
          <Button variant="outline" onClick={onClose} className="border-[#1C283A] text-white">
            Cancel
          </Button>
          <Button
            onClick={() => rescheduleMutation.mutate()}
            disabled={rescheduleMutation.isPending}
            className="text-white shadow-md hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "var(--brand-primary, #0069FF)" }}
          >
            {rescheduleMutation.isPending ? "Rescheduling…" : "Confirm Reschedule"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function CancelModal({
  booking,
  onClose,
  onConfirm,
  isPending,
}: {
  booking: Booking;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
}) {
  const [reason, setReason] = useState("Client requested cancellation");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[#1C283A] bg-[#111A28] p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#1C283A] pb-3">
          <h3 className="font-bold text-white text-base">Cancel Appointment</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="size-4" />
          </button>
        </div>

        <p className="text-xs text-[#8B9CB0]">
          Are you sure you want to cancel the appointment for{" "}
          <span className="font-semibold text-white">{booking.customerName || "this client"}</span>?
        </p>

        <div className="space-y-1.5">
          <Label htmlFor="cancelReason" className="text-xs text-white">Cancellation Reason</Label>
          <Input
            id="cancelReason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="bg-[#0B111A] border-[#1C283A] text-white"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-[#1C283A]">
          <Button variant="outline" onClick={onClose} className="border-[#1C283A] text-white">
            Back
          </Button>
          <Button
            onClick={() => onConfirm(reason)}
            disabled={isPending}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {isPending ? "Cancelling…" : "Confirm Cancellation"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function NotetakerModal({
  booking,
  onClose,
}: {
  booking: Booking;
  onClose: () => void;
}) {
  const noteKey = `slotly_notes_${booking.id}`;
  const [notes, setNotes] = useState(() => {
    try {
      return localStorage.getItem(noteKey) || "";
    } catch {
      return "";
    }
  });

  const saveNotes = () => {
    try {
      localStorage.setItem(noteKey, notes);
      toast.success("Meeting notes saved!");
    } catch {
      // ignore
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-[#1C283A] bg-[#111A28] p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#1C283A] pb-3">
          <div className="flex items-center gap-2">
            <Mic className="size-4 text-[#4D9BFF]" />
            <h3 className="font-bold text-white text-base">Notetaker & Consultation Notes</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="size-4" />
          </button>
        </div>

        <div className="rounded-xl border border-[#1C283A] bg-[#0B111A] p-3 text-xs space-y-1">
          <p className="text-white font-semibold">
            {booking.customerName || "Client"} • {booking.serviceName || "Session"}
          </p>
          <p className="text-[#8B9CB0]">
            {new Date(booking.startsAt!).toLocaleString()} • Practitioner: {booking.staffName || "Staff"}
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sessionNotes" className="text-xs text-white">Private Clinical / Meeting Notes</Label>
          <textarea
            id="sessionNotes"
            rows={6}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Type meeting discussion notes, treatment observations, diagnosis, or follow-up instructions here..."
            className="w-full rounded-xl border border-[#1C283A] bg-[#0B111A] p-3 text-xs text-white placeholder:text-gray-500 focus:border-[#0069FF] focus:outline-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-[#1C283A]">
          <Button variant="outline" onClick={onClose} className="border-[#1C283A] text-white">
            Close
          </Button>
          <Button
            onClick={saveNotes}
            className="text-white shadow-md hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "var(--brand-primary, #0069FF)" }}
          >
            Save Notes
          </Button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------
 * SERVICES PAGE ("Event Types & Services")
 * ------------------------------------------------------------- */
export function ServicesPage() {
  const qc = useQueryClient();
  const services = useServices();
  const tenantSettings = useTenantSettings();
  const tenantSlug = tenantSettings.data?.slug || "northstar-health";
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingService, setDeletingService] = useState<Service | null>(null);

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

  const deleteService = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.DELETE("/api/v1/services/{id}", {
        params: { path: { id } },
      });
      if (!res.response.ok) throw new Error("Could not deactivate service.");
    },
    onSuccess: () => {
      toast.success("Service deactivated");
      void qc.invalidateQueries({ queryKey: ["services-admin"] });
    },
    onError: (e) => toast.error(apiMessage(e)),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <SidebarToggleButton />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Event Types & Services</h1>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <ThemeToggle className="size-9 rounded-lg border-[#1C283A] bg-[#111A28] text-gray-400 hover:text-white hover:bg-[#162234]" />
          <button
            onClick={() => toast.info("Slotly Help Center is available 24/7.")}
            className="grid size-9 place-items-center rounded-lg border border-[#1C283A] text-gray-400 hover:text-white hover:bg-[#111A28]"
            title="Help"
          >
            <HelpCircle className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="rounded-2xl border border-[#1C283A] bg-[#111A28] p-6">
          {services.data?.length ? (
            <div className="divide-y divide-[#1C283A]">
              {services.data.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white">{s.name}</p>
                      <Badge variant={s.isActive ? "success" : "neutral"} className="text-[10px]">
                        {s.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#8B9CB0] tabular-nums mt-0.5">
                      {s.durationMinutes} min · {s.priceAmount} {s.currency} · {s.bufferMinutes} min buffer
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        void navigator.clipboard.writeText(`${window.location.origin}/book/${tenantSlug}?serviceId=${s.id}`);
                        toast.success("Service booking link copied!");
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#1C283A] px-2.5 py-1 text-xs text-white hover:bg-[#162234]"
                      title="Copy Link"
                    >
                      <Copy className="size-3" />
                      <span>Link</span>
                    </button>

                    <button
                      onClick={() => setEditingService(s)}
                      className="grid size-8 place-items-center rounded-lg text-gray-400 hover:text-white hover:bg-[#162234]"
                      title="Edit"
                    >
                      <Pencil className="size-3.5" />
                    </button>

                    <button
                      onClick={() => setDeletingService(s)}
                      className="grid size-8 place-items-center rounded-lg text-gray-400 hover:text-red-400 hover:bg-[#162234]"
                      title="Deactivate"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
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

      {editingService && (
        <ServiceModal
          service={editingService}
          onClose={() => setEditingService(null)}
          onSuccess={() => {
            setEditingService(null);
            void qc.invalidateQueries({ queryKey: ["services-admin"] });
          }}
        />
      )}

      {/* Deactivate Service Confirmation Modal */}
      <ConfirmModal
        open={Boolean(deletingService)}
        title="Deactivate Event Type"
        description={
          <>
            Are you sure you want to deactivate{" "}
            <span className="font-bold text-gray-900 dark:text-white">
              {deletingService?.name}
            </span>
            ? Clients will no longer be able to book this event type on your public booking page.
          </>
        }
        confirmText="Deactivate"
        isPending={deleteService.isPending}
        onConfirm={() => {
          if (deletingService?.id) {
            deleteService.mutate(deletingService.id, {
              onSuccess: () => setDeletingService(null),
            });
          }
        }}
        onClose={() => setDeletingService(null)}
      />
    </div>
  );
}

/* -------------------------------------------------------------
 * STAFF PAGE ("Contacts & Team")
 * ------------------------------------------------------------- */
export function StaffPage() {
  const qc = useQueryClient();
  const staff = useStaff();
  const bookings = useBookings();
  const tenantSettings = useTenantSettings();
  const tenantSlug = tenantSettings.data?.slug || "northstar-health";
  const [subTab, setSubTab] = useState<"staff" | "clients">("staff");
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [deletingStaff, setDeletingStaff] = useState<StaffMember | null>(null);

  // Deactivate staff
  const deleteStaff = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.DELETE("/api/v1/staff/{id}", {
        params: { path: { id } },
      });
      if (!res.response.ok) throw new Error("Could not deactivate staff member.");
    },
    onSuccess: () => {
      toast.success("Staff profile deactivated");
      void qc.invalidateQueries({ queryKey: ["staff-admin"] });
    },
    onError: (e) => toast.error(apiMessage(e)),
  });

  // Aggregate unique client contacts from bookings
  const clientContacts = useMemo(() => {
    if (!bookings.data) return [];
    const map = new Map<string, { id: string; name: string; email: string; phone?: string; totalBookings: number; lastBooking: string }>();
    for (const b of bookings.data) {
      const email = b.customerEmail || b.customerId || "unknown";
      const existing = map.get(email);
      if (existing) {
        existing.totalBookings += 1;
        if (new Date(b.startsAt!) > new Date(existing.lastBooking)) {
          existing.lastBooking = b.startsAt!;
        }
      } else {
        map.set(email, {
          id: b.customerId || b.id || "",
          name: b.customerName || "Client",
          email: b.customerEmail || "",
          phone: b.customerPhone || "",
          totalBookings: 1,
          lastBooking: b.startsAt || new Date().toISOString(),
        });
      }
    }
    return Array.from(map.values());
  }, [bookings.data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <SidebarToggleButton />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Contacts & Team</h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <ThemeToggle className="size-9 rounded-lg border-[#1C283A] bg-[#111A28] text-gray-400 hover:text-white hover:bg-[#162234]" />
          <button
            onClick={() => toast.info("Slotly Help Center is available 24/7.")}
            className="grid size-9 place-items-center rounded-lg border border-[#1C283A] text-gray-400 hover:text-white hover:bg-[#111A28]"
            title="Help"
          >
            <HelpCircle className="size-4" />
          </button>
          <Button
            onClick={() => setInviteModalOpen(true)}
            className="rounded-xl text-white shadow-md hover:opacity-90 transition-opacity text-xs font-bold"
            style={{ backgroundColor: "var(--brand-primary, #0069FF)" }}
          >
            <Plus className="size-3.5 mr-1.5" />
            Invite Team Member
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-[#1C283A] text-xs font-bold">
        <button
          onClick={() => setSubTab("staff")}
          className={cn(
            "pb-3 relative transition-colors",
            subTab === "staff" ? "text-white" : "text-gray-400 hover:text-white"
          )}
        >
          Practitioners & Staff ({staff.data?.length ?? 0})
          {subTab === "staff" && <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ backgroundColor: "var(--brand-primary, #0069FF)" }} />}
        </button>

        <button
          onClick={() => setSubTab("clients")}
          className={cn(
            "pb-3 relative transition-colors",
            subTab === "clients" ? "text-white" : "text-gray-400 hover:text-white"
          )}
        >
          Client Contacts ({clientContacts.length})
          {subTab === "clients" && <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ backgroundColor: "var(--brand-primary, #0069FF)" }} />}
        </button>
      </div>

      {subTab === "staff" ? (
        <div className="rounded-2xl border border-[#1C283A] bg-[#111A28] p-6">
          <div className="divide-y divide-[#1C283A]">
            {staff.data?.map((p) => (
              <div
                key={p.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="grid size-10 place-items-center rounded-full font-bold text-sm"
                    style={{
                      backgroundColor: "color-mix(in srgb, var(--brand-primary, #0069FF) 20%, transparent)",
                      color: "var(--brand-primary, #0069FF)",
                    }}
                  >
                    {p.displayName?.slice(0, 1)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white">{p.displayName}</p>
                      <Badge variant={p.isActive ? "success" : "neutral"} className="text-[10px]">
                        {p.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#8B9CB0]">{p.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to="/admin/schedule"
                    className="inline-flex items-center gap-1 rounded-lg border border-[#1C283A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#162234]"
                  >
                    <Clock className="size-3" />
                    <span>Schedule</span>
                  </Link>

                  <button
                    onClick={() => setDeletingStaff(p)}
                    className="grid size-8 place-items-center rounded-lg text-gray-400 hover:text-red-400 hover:bg-[#162234]"
                    title="Deactivate staff"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#1C283A] bg-[#111A28] p-6">
          {clientContacts.length ? (
            <div className="divide-y divide-[#1C283A]">
              {clientContacts.map((c, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5">
                  <div className="flex items-center gap-3.5">
                    <div className="grid size-9 place-items-center rounded-full bg-purple-500/20 text-purple-300 font-bold text-xs">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-white text-xs">{c.name}</p>
                      <p className="text-[11px] text-[#8B9CB0]">
                        {c.email} {c.phone && `• ${c.phone}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right text-xs text-[#8B9CB0] mr-2 hidden sm:block">
                      <p>{c.totalBookings} appointment(s)</p>
                      <p className="text-[10px] tabular-nums">Last: {new Date(c.lastBooking).toLocaleDateString()}</p>
                    </div>
                    {c.email && (
                      <button
                        onClick={() => {
                          void navigator.clipboard.writeText(c.email);
                          toast.success("Client email copied!");
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#1C283A] px-2.5 py-1 text-xs text-white hover:bg-[#162234]"
                        title="Copy email"
                      >
                        <Copy className="size-3" />
                        <span>Email</span>
                      </button>
                    )}
                    <Link
                      to={`/book/${tenantSlug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 rounded-lg border border-[#1C283A] px-2.5 py-1 text-xs text-white hover:bg-[#162234]"
                      title="Book an appointment for this client"
                    >
                      <Calendar className="size-3" />
                      <span>Book</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title="No client contacts recorded yet"
              description="Clients who book appointments will automatically show up in this directory."
            />
          )}
        </div>
      )}

      {inviteModalOpen && (
        <InviteStaffModal
          onClose={() => setInviteModalOpen(false)}
          onSuccess={() => {
            setInviteModalOpen(false);
            void qc.invalidateQueries({ queryKey: ["staff-admin"] });
          }}
        />
      )}

      {/* Deactivate Staff Confirmation Modal */}
      <ConfirmModal
        open={Boolean(deletingStaff)}
        title="Deactivate Staff Member"
        description={
          <>
            Are you sure you want to deactivate{" "}
            <span className="font-bold text-gray-900 dark:text-white">
              {deletingStaff?.displayName}
            </span>
            ? They will no longer be available for appointments or client bookings.
          </>
        }
        confirmText="Deactivate"
        isPending={deleteStaff.isPending}
        onConfirm={() => {
          if (deletingStaff?.id) {
            deleteStaff.mutate(deletingStaff.id, {
              onSuccess: () => setDeletingStaff(null),
            });
          }
        }}
        onClose={() => setDeletingStaff(null)}
      />
    </div>
  );
}

function InviteStaffModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const schema = z.object({
    displayName: z.string().min(2, "Full name required."),
    email: z.email("Valid email required."),
    password: z.string().min(8, "Temporary password must be at least 8 characters."),
  });
  type Form = z.infer<typeof schema>;

  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { displayName: "", email: "", password: "Password123!" },
  });

  const invite = useMutation({
    mutationFn: async (v: Form) => {
      const res = await api.POST("/api/v1/auth/invite-staff", { body: v });
      if (!res.response.ok) throw new Error("Could not invite staff member.");
      return res.data;
    },
    onSuccess: () => {
      toast.success("Team member invited successfully");
      onSuccess();
    },
    onError: (e) => toast.error(apiMessage(e)),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[#1C283A] bg-[#111A28] p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#1C283A] pb-3">
          <h3 className="font-bold text-white text-base">Invite Practitioner / Team Member</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="size-4" />
          </button>
        </div>

        <form className="space-y-3.5" onSubmit={form.handleSubmit((v) => invite.mutate(v))}>
          <div className="space-y-1.5">
            <Label htmlFor="displayName" className="text-xs text-[#8B9CB0]">Full Name</Label>
            <Input id="displayName" placeholder="Dr. Sarah Johnson" className="bg-[#0B111A] border-[#1C283A] text-white" {...form.register("displayName")} />
            <FieldError error={form.formState.errors.displayName} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="staffEmail" className="text-xs text-[#8B9CB0]">Work Email</Label>
            <Input id="staffEmail" type="email" placeholder="sarah@example.com" className="bg-[#0B111A] border-[#1C283A] text-white" {...form.register("email")} />
            <FieldError error={form.formState.errors.email} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tempPassword" className="text-xs text-[#8B9CB0]">Initial Temporary Password</Label>
            <Input id="tempPassword" type="password" className="bg-[#0B111A] border-[#1C283A] text-white" {...form.register("password")} />
            <FieldError error={form.formState.errors.password} />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#1C283A]">
            <Button type="button" variant="outline" onClick={onClose} className="border-[#1C283A] text-white">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={invite.isPending}
              className="text-white shadow-md hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "var(--brand-primary, #0069FF)" }}
            >
              {invite.isPending ? "Inviting…" : "Send Invitation"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------
 * SCHEDULE & AVAILABILITY PAGE
 * ------------------------------------------------------------- */
export function SchedulePage() {
  const qc = useQueryClient();
  const staff = useStaff();
  const [selectedStaffId, setStaffId] = useState<string>("");
  const [scheduleTab, setScheduleTab] = useState<"hours" | "timeoff" | "automations">("hours");

  const [reminders, setReminders] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem("slotly_automated_reminders");
      return stored
        ? JSON.parse(stored)
        : { reminder24h: true, instantConfirm: true, statusAlerts: true };
    } catch {
      return { reminder24h: true, instantConfirm: true, statusAlerts: true };
    }
  });

  const toggleReminder = (key: string, name: string) => {
    setReminders((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem("slotly_automated_reminders", JSON.stringify(updated));
      } catch {}
      toast.success(`${name} ${updated[key] ? "enabled" : "paused"} and saved!`);
      return updated;
    });
  };

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
      toast.success("Working hours added");
      void qc.invalidateQueries({ queryKey: ["hours", selectedStaffId] });
    },
    onError: (e) => toast.error(apiMessage(e)),
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
    onError: (e) => toast.error(apiMessage(e)),
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
          variables.kind === "hours" ? "hours" : "time-off",
          selectedStaffId,
        ],
      });
    },
    onError: (e) => toast.error(apiMessage(e)),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <SidebarToggleButton />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Availability & Working Hours</h1>
          </div>
        </div>

        {/* Actions & Staff Selector */}
        <div className="flex items-center gap-2.5">
          <ThemeToggle className="size-9 rounded-lg border-[#1C283A] bg-[#111A28] text-gray-400 hover:text-white hover:bg-[#162234]" />
          <button
            onClick={() => toast.info("Slotly Help Center is available 24/7.")}
            className="grid size-9 place-items-center rounded-lg border border-[#1C283A] text-gray-400 hover:text-white hover:bg-[#111A28]"
            title="Help"
          >
            <HelpCircle className="size-4" />
          </button>
          <Label className="text-xs text-[#8B9CB0]">Practitioner:</Label>
          <select
            value={selectedStaffId}
            onChange={(e) => setStaffId(e.target.value)}
            className="h-10 rounded-xl border border-[#1C283A] bg-[#111A28] px-3.5 text-xs text-white"
          >
            {staff.data?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.displayName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-[#1C283A] text-xs font-bold">
        <button
          onClick={() => setScheduleTab("hours")}
          className={cn(
            "pb-3 relative transition-colors",
            scheduleTab === "hours" ? "text-white" : "text-gray-400 hover:text-white"
          )}
        >
          Weekly Working Hours
          {scheduleTab === "hours" && <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ backgroundColor: "var(--brand-primary, #0069FF)" }} />}
        </button>

        <button
          onClick={() => setScheduleTab("timeoff")}
          className={cn(
            "pb-3 relative transition-colors",
            scheduleTab === "timeoff" ? "text-white" : "text-gray-400 hover:text-white"
          )}
        >
          Time Off & Blackouts ({timeOff.data?.length ?? 0})
          {scheduleTab === "timeoff" && <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ backgroundColor: "var(--brand-primary, #0069FF)" }} />}
        </button>

        <button
          onClick={() => setScheduleTab("automations")}
          className={cn(
            "pb-3 relative transition-colors",
            scheduleTab === "automations" ? "text-white" : "text-gray-400 hover:text-white"
          )}
        >
          Automated Reminders
          {scheduleTab === "automations" && <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ backgroundColor: "var(--brand-primary, #0069FF)" }} />}
        </button>
      </div>

      {scheduleTab === "hours" && (
        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="rounded-2xl border border-[#1C283A] bg-[#111A28] p-6">
            <h3 className="text-sm font-bold text-white mb-4">Configured Weekly Hours</h3>
            {hours.data?.length ? (
              <div className="divide-y divide-[#1C283A]">
                {hours.data.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between py-3.5"
                  >
                    <div>
                      <span className="font-semibold text-white text-xs">{dayNames[h.dayOfWeek ?? 1]}</span>
                      <p className="text-xs text-[#8B9CB0] tabular-nums mt-0.5">
                        {h.startsAt?.slice(0, 5)} - {h.endsAt?.slice(0, 5)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-gray-400 hover:text-red-400"
                      onClick={() => remove.mutate({ kind: "hours", id: h.id! })}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#8B9CB0]">No working hours defined for this practitioner.</p>
            )}
          </div>

          <div className="rounded-2xl border border-[#1C283A] bg-[#111A28] p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Add Working Hours</h3>
            <form
              className="space-y-3.5"
              onSubmit={hoursForm.handleSubmit((v) => addHours.mutate(v))}
            >
              <div className="space-y-1.5">
                <Label className="text-xs text-[#8B9CB0]">Day of Week</Label>
                <select
                  className="h-10 w-full rounded-xl border border-[#1C283A] bg-[#0B111A] px-3 text-xs text-white"
                  {...hoursForm.register("dayOfWeek", { valueAsNumber: true })}
                >
                  {dayNames.map((day, idx) => (
                    <option key={day} value={idx}>{day}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#8B9CB0]">Starts At</Label>
                  <Input
                    type="time"
                    className="bg-[#0B111A] border-[#1C283A] text-white"
                    {...hoursForm.register("startsAt")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#8B9CB0]">Ends At</Label>
                  <Input
                    type="time"
                    className="bg-[#0B111A] border-[#1C283A] text-white"
                    {...hoursForm.register("endsAt")}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={addHours.isPending}
                className="w-full rounded-xl text-white shadow-md hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "var(--brand-primary, #0069FF)" }}
              >
                {addHours.isPending ? "Adding…" : "Add Working Hours"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {scheduleTab === "timeoff" && (
        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="rounded-2xl border border-[#1C283A] bg-[#111A28] p-6">
            <h3 className="text-sm font-bold text-white mb-4">Registered Blackouts & Time Off</h3>
            {timeOff.data?.length ? (
              <div className="divide-y divide-[#1C283A]">
                {timeOff.data.map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-3.5">
                    <div>
                      <p className="font-semibold text-white text-xs">{t.reason || "Time Off"}</p>
                      <p className="text-xs text-[#8B9CB0] tabular-nums mt-0.5">
                        {new Date(t.startsAt!).toLocaleDateString()} - {new Date(t.endsAt!).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-gray-400 hover:text-red-400"
                      onClick={() => remove.mutate({ kind: "timeOff", id: t.id! })}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#8B9CB0]">No upcoming time off periods scheduled.</p>
            )}
          </div>

          <div className="rounded-2xl border border-[#1C283A] bg-[#111A28] p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Register Time Off</h3>
            <form
              className="space-y-3.5"
              onSubmit={timeOffForm.handleSubmit((v) => addTimeOff.mutate(v))}
            >
              <div className="space-y-1.5">
                <Label className="text-xs text-[#8B9CB0]">Starts At</Label>
                <Input
                  type="date"
                  className="bg-[#0B111A] border-[#1C283A] text-white"
                  {...timeOffForm.register("startsAt")}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-[#8B9CB0]">Ends At</Label>
                <Input
                  type="date"
                  className="bg-[#0B111A] border-[#1C283A] text-white"
                  {...timeOffForm.register("endsAt")}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-[#8B9CB0]">Reason / Note</Label>
                <Input
                  placeholder="e.g. Annual Vacation"
                  className="bg-[#0B111A] border-[#1C283A] text-white"
                  {...timeOffForm.register("reason")}
                />
              </div>

              <Button
                type="submit"
                disabled={addTimeOff.isPending}
                className="w-full rounded-xl text-white shadow-md hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "var(--brand-primary, #0069FF)" }}
              >
                {addTimeOff.isPending ? "Adding…" : "Register Time Off"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {scheduleTab === "automations" && (
        <div className="rounded-2xl border border-[#1C283A] bg-[#111A28] p-6 space-y-6">
          <h3 className="text-base font-bold text-white">Automated Booking Reminders</h3>
          <p className="text-xs text-[#8B9CB0]">
            Slotly dispatches transactional emails via your Mailpit SMTP container for all booking events.
          </p>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-[#1C283A] bg-[#0B111A] p-4">
              <div>
                <p className="font-bold text-xs text-white">24h Email Reminder</p>
                <p className="text-[11px] text-[#8B9CB0]">Send email notification 24 hours prior to appointment start</p>
              </div>
              <button
                type="button"
                onClick={() => toggleReminder("reminder24h", "24h Email Reminder")}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-bold transition-colors cursor-pointer",
                  reminders.reminder24h
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : "bg-gray-800 text-gray-400 hover:text-white"
                )}
              >
                {reminders.reminder24h ? "Enabled" : "Paused"}
              </button>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-[#1C283A] bg-[#0B111A] p-4">
              <div>
                <p className="font-bold text-xs text-white">Instant Confirmation Email</p>
                <p className="text-[11px] text-[#8B9CB0]">Send instant calendar invitation upon booking creation</p>
              </div>
              <button
                type="button"
                onClick={() => toggleReminder("instantConfirm", "Instant Confirmation Email")}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-bold transition-colors cursor-pointer",
                  reminders.instantConfirm
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : "bg-gray-800 text-gray-400 hover:text-white"
                )}
              >
                {reminders.instantConfirm ? "Enabled" : "Paused"}
              </button>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-[#1C283A] bg-[#0B111A] p-4">
              <div>
                <p className="font-bold text-xs text-white">Cancellation & Reschedule Alerts</p>
                <p className="text-[11px] text-[#8B9CB0]">Notify both staff and client instantly if a booking changes</p>
              </div>
              <button
                type="button"
                onClick={() => toggleReminder("statusAlerts", "Status Alerts")}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-bold transition-colors cursor-pointer",
                  reminders.statusAlerts
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : "bg-gray-800 text-gray-400 hover:text-white"
                )}
              >
                {reminders.statusAlerts ? "Enabled" : "Paused"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------
 * SETTINGS MODAL & PAGE
 * ------------------------------------------------------------- */
export function SettingsModal({
  onClose,
  initialNav = "profile",
}: {
  onClose: () => void;
  initialNav?: "profile" | "scheduling" | "branding" | "mylink" | "workspace";
}) {
  const qc = useQueryClient();
  const { session } = useAuth();
  const userName = session?.user.displayName || "Admin User";

  const [activeSettingsNav, setActiveSettingsNav] = useState<
    "profile" | "scheduling" | "branding" | "mylink" | "workspace"
  >(initialNav);
  const [profileTab, setProfileTab] = useState<"general" | "security">("general");

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

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Lock background body scroll while modal is active
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const settings = useTenantSettings();
  const tenantSlug = settings.data?.slug || "northstar-health";
  const [selectedColor, setSelectedColor] = useState<string>(
    settings.data?.primaryColor || "#0069FF"
  );

  const schema = z.object({
    name: z.string().min(2, "Workspace name must be at least 2 characters."),
    timeZoneId: z.string().min(1, "Time zone is required."),
    cancellationWindowHours: z.number().min(0).max(2160),
    primaryColor: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid 6-character hex color (e.g. #0069FF)"),
    logoUrl: z
      .string()
      .url("Must be a valid URL")
      .optional()
      .or(z.literal(""))
      .nullable(),
  });
  type Form = z.infer<typeof schema>;

  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: settings.data?.name || userName,
      timeZoneId: settings.data?.timeZoneId || "Africa/Casablanca",
      cancellationWindowHours: settings.data?.cancellationWindowHours ?? 24,
      primaryColor: settings.data?.primaryColor || "#0069FF",
      logoUrl: settings.data?.logoUrl || "",
    },
  });

  useEffect(() => {
    if (settings.data) {
      form.reset({
        name: settings.data.name || userName,
        timeZoneId: settings.data.timeZoneId || "Africa/Casablanca",
        cancellationWindowHours: settings.data.cancellationWindowHours ?? 24,
        primaryColor: settings.data.primaryColor || "#0069FF",
        logoUrl: settings.data.logoUrl || "",
      });
      setSelectedColor(settings.data.primaryColor || "#0069FF");
    }
  }, [settings.data, userName, form]);

  const handleColorChange = (hex: string) => {
    const upper = hex.toUpperCase();
    setSelectedColor(upper);
    form.setValue("primaryColor", upper, {
      shouldDirty: true,
      shouldValidate: true,
    });
    // Immediately apply preview to document root
    document.documentElement.style.setProperty("--primary", upper);
    document.documentElement.style.setProperty("--brand-primary", upper);
  };

  const watchedPrimaryColor = selectedColor || form.watch("primaryColor") || "#0069FF";

  const save = useMutation({
    mutationFn: async (v: Form) => {
      const hex = (selectedColor || v.primaryColor || "#0069FF").toUpperCase();
      const { data, error } = await api.PUT("/api/v1/settings", {
        body: {
          name: v.name.trim(),
          timeZoneId: v.timeZoneId,
          cancellationWindowHours: Number(v.cancellationWindowHours),
          primaryColor: hex,
          logoUrl: v.logoUrl && v.logoUrl.trim() ? v.logoUrl.trim() : null,
        },
      });
      if (!data) throw error;
      return data;
    },
    onSuccess(data) {
      toast.success("Settings saved successfully!");
      if (data.primaryColor) {
        document.documentElement.style.setProperty("--primary", data.primaryColor);
        document.documentElement.style.setProperty("--brand-primary", data.primaryColor);
      }
      qc.setQueryData(["tenant-settings"], data);
      void qc.invalidateQueries({ queryKey: ["tenant-settings"] });
      setTimeout(() => onClose(), 600);
    },
    onError: (e) => toast.error(apiMessage(e, "Could not save settings.")),
  });

  const onSaveSubmit = form.handleSubmit(
    (v) => save.mutate(v),
    (errors) => {
      console.error("Settings validation failed:", errors);
      const firstErr = Object.values(errors)[0];
      const msg =
        typeof firstErr?.message === "string"
          ? firstErr.message
          : "Please check your settings inputs.";
      toast.error(msg);
    }
  );

  // Change password form
  const passSchema = z.object({
    currentPassword: z.string().min(8, "Current password must be at least 8 characters."),
    newPassword: z.string().min(8, "New password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm your new password."),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  });
  type PassForm = z.infer<typeof passSchema>;

  const passForm = useForm<PassForm>({
    resolver: zodResolver(passSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const changePassword = useMutation({
    mutationFn: async (v: PassForm) => {
      const res = await api.POST("/api/v1/auth/change-password", {
        body: {
          currentPassword: v.currentPassword,
          newPassword: v.newPassword,
        },
      });
      if (!res.response.ok) throw new Error("Could not change password.");
      return res.data;
    },
    onSuccess: () => {
      toast.success("Password changed successfully!");
      passForm.reset();
    },
    onError: (e) => toast.error(apiMessage(e)),
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-5xl rounded-3xl border border-gray-200 dark:border-[#1C283A] bg-white dark:bg-[#111A28] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[660px] max-h-[90vh] my-auto">
        {/* Left Sidebar inside Settings Modal */}
        <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-gray-200 dark:border-[#1C283A] bg-gray-50 dark:bg-[#090E17] p-5 flex flex-col justify-between shrink-0 h-full">
          <div className="space-y-6">
            <div className="space-y-1">
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Workspace Settings
              </p>
              {[
                ["profile", "Profile", User],
                ["scheduling", "Scheduling Policy", Calendar],
                ["branding", "Branding & Appearance", Palette],
                ["mylink", "Booking Link", LinkIcon],
                ["workspace", "Workspace Info", Hourglass],
              ].map(([key, label, Icon]: any) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveSettingsNav(key)}
                  className={cn(
                    "flex h-9 w-full items-center gap-3 rounded-xl px-3 text-xs font-semibold transition-colors",
                    activeSettingsNav === key
                      ? "bg-[#152B46] text-[#4D9BFF]"
                      : "text-gray-600 dark:text-[#8B9CB0] hover:bg-gray-100 dark:hover:bg-[#111A28] hover:text-gray-900 dark:hover:text-white"
                  )}
                >
                  <Icon className="size-3.5 shrink-0" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Settings Panel */}
        <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto h-full">
          <div>
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-[#1C283A] pb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white capitalize">{activeSettingsNav} Settings</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-900 dark:hover:text-white p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#111A28] transition-colors"
                  title="Close settings"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            <form id="settingsForm" onSubmit={onSaveSubmit}>
              {/* Profile Tab */}
              {activeSettingsNav === "profile" && (
                <>
                  {/* Subtabs: General & Security */}
                  <div className="flex gap-6 border-b border-[#1C283A] pt-4 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setProfileTab("general")}
                      className={cn(
                        "pb-3 relative transition-colors",
                        profileTab === "general" ? "text-white" : "text-gray-400 hover:text-white"
                      )}
                    >
                      General
                      {profileTab === "general" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ backgroundColor: watchedPrimaryColor }} />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfileTab("security")}
                      className={cn(
                        "pb-3 relative transition-colors",
                        profileTab === "security" ? "text-white" : "text-gray-400 hover:text-white"
                      )}
                    >
                      Login & Security
                      {profileTab === "security" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ backgroundColor: watchedPrimaryColor }} />
                      )}
                    </button>
                  </div>

                  {profileTab === "general" ? (
                    <div className="mt-6 space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-xs text-white font-semibold">Workspace Name</Label>
                        <Input id="name" className="bg-[#0B111A] border-[#1C283A] text-white h-10 rounded-xl" {...form.register("name")} />
                        <FieldError error={form.formState.errors.name} />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="timeZoneId" className="text-xs text-white font-semibold">Time zone</Label>
                          <span className="text-[11px] text-gray-400">Current Time: {currentTime}</span>
                        </div>
                        <select
                          id="timeZoneId"
                          className="h-10 w-full rounded-xl border border-[#1C283A] bg-[#0B111A] px-3 text-xs text-white"
                          {...form.register("timeZoneId")}
                        >
                          <option value="Africa/Casablanca">Africa/Casablanca (Morocco)</option>
                          <option value="Europe/Paris">Europe/Paris (France, Spain, Germany)</option>
                          <option value="Europe/London">Europe/London (GMT/BST)</option>
                          <option value="America/New_York">America/New_York (Eastern)</option>
                          <option value="UTC">UTC (Universal Time)</option>
                        </select>
                        <FieldError error={form.formState.errors.timeZoneId} />
                      </div>
                    </div>
                  ) : null}
                </>
              )}

              {/* Scheduling Policy */}
              {activeSettingsNav === "scheduling" && (
                <div className="mt-6 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="cancellationWindowHours" className="text-xs text-white font-semibold">
                      Cancellation Window (Hours in advance)
                    </Label>
                    <Input
                      id="cancellationWindowHours"
                      type="number"
                      className="bg-[#0B111A] border-[#1C283A] text-white h-10 rounded-xl max-w-xs"
                      {...form.register("cancellationWindowHours", { valueAsNumber: true })}
                    />
                    <FieldError error={form.formState.errors.cancellationWindowHours} />
                    <p className="text-[11px] text-[#8B9CB0]">
                      Clients will not be allowed to cancel within this window prior to appointment time.
                    </p>
                  </div>
                </div>
              )}

              {/* Branding Tab */}
              {activeSettingsNav === "branding" && (
                <div className="mt-6 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs text-white font-semibold">Brand Primary Color</Label>
                    <div className="flex flex-wrap items-center gap-3">
                      <input type="hidden" {...form.register("primaryColor")} />
                      <input
                        type="color"
                        value={watchedPrimaryColor}
                        onChange={(e) => handleColorChange(e.target.value)}
                        className="size-10 rounded-lg border-0 bg-transparent cursor-pointer"
                      />
                      <Input
                        value={watchedPrimaryColor}
                        onChange={(e) => handleColorChange(e.target.value)}
                        placeholder="#0069FF"
                        className="bg-[#0B111A] border-[#1C283A] text-white h-10 rounded-xl w-36 uppercase font-mono text-xs"
                      />
                      <div className="flex items-center gap-2">
                        {["#0069FF", "#10B981", "#8B5CF6", "#F59E0B", "#EC4899", "#3B82F6"].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => handleColorChange(c)}
                            className={cn(
                              "size-7 rounded-full border border-white/20 transition-all hover:scale-110 cursor-pointer",
                              watchedPrimaryColor.toUpperCase() === c.toUpperCase() &&
                                "ring-2 ring-white ring-offset-2 ring-offset-[#111A28] scale-110"
                            )}
                            style={{ backgroundColor: c }}
                            title={c}
                          />
                        ))}
                      </div>
                    </div>
                    <FieldError error={form.formState.errors.primaryColor} />
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <Label htmlFor="logoUrl" className="text-xs text-white font-semibold">Brand Logo URL</Label>
                    <Input
                      id="logoUrl"
                      placeholder="https://example.com/logo.png"
                      className="bg-[#0B111A] border-[#1C283A] text-white h-10 rounded-xl"
                      {...form.register("logoUrl")}
                    />
                    <FieldError error={form.formState.errors.logoUrl} />
                    <p className="text-[11px] text-[#8B9CB0]">
                      Provide an absolute HTTP/HTTPS URL to an image file (PNG, SVG, JPG).
                    </p>
                  </div>

                  {/* Live Preview Card */}
                  <div className="mt-6 rounded-2xl border border-[#1C283A] bg-[#0B111A] p-5">
                    <p className="text-xs font-semibold text-gray-400 mb-3">Live Preview with your Brand Color:</p>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-white/10 p-4 bg-[#111A28]">
                      <div className="flex items-center gap-3">
                        {form.watch("logoUrl") ? (
                          <img
                            src={form.watch("logoUrl")!}
                            alt="Logo"
                            className="size-8 rounded-full object-cover border border-white/20"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div
                            className="size-8 rounded-full grid place-items-center font-bold text-xs text-white shadow-sm transition-colors"
                            style={{ backgroundColor: watchedPrimaryColor }}
                          >
                            {(form.watch("name") || "S").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-sm text-white">
                            {form.watch("name") || "Northstar Health"}
                          </span>
                          <p className="text-[11px] text-gray-400">Public Booking Badge</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="rounded-full px-4 py-1.5 text-xs font-bold text-white shadow-md transition-colors"
                        style={{ backgroundColor: watchedPrimaryColor }}
                      >
                        Book Appointment
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </form>

            {/* Separate Security Form */}
            {activeSettingsNav === "profile" && profileTab === "security" && (
              <form
                className="mt-6 space-y-4"
                onSubmit={passForm.handleSubmit((v) => changePassword.mutate(v))}
              >
                <div className="space-y-1.5">
                  <Label className="text-xs text-white font-semibold">Current Password</Label>
                  <Input
                    type="password"
                    className="bg-[#0B111A] border-[#1C283A] text-white h-10 rounded-xl"
                    {...passForm.register("currentPassword")}
                  />
                  <FieldError error={passForm.formState.errors.currentPassword} />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-white font-semibold">New Password</Label>
                  <Input
                    type="password"
                    className="bg-[#0B111A] border-[#1C283A] text-white h-10 rounded-xl"
                    {...passForm.register("newPassword")}
                  />
                  <FieldError error={passForm.formState.errors.newPassword} />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-white font-semibold">Confirm New Password</Label>
                  <Input
                    type="password"
                    className="bg-[#0B111A] border-[#1C283A] text-white h-10 rounded-xl"
                    {...passForm.register("confirmPassword")}
                  />
                  <FieldError error={passForm.formState.errors.confirmPassword} />
                </div>

                <Button
                  type="submit"
                  disabled={changePassword.isPending}
                  className="rounded-full bg-white text-[#0B1A2C] hover:bg-neutral-100 font-bold text-xs"
                >
                  {changePassword.isPending ? "Updating password…" : "Update Password"}
                </Button>
              </form>
            )}

            {/* My Link Tab */}
            {activeSettingsNav === "mylink" && (
              <div className="mt-6 space-y-4">
                <p className="text-xs text-[#8B9CB0]">
                  Your public booking page URL:
                </p>
                <div className="flex items-center gap-2 rounded-xl border border-[#1C283A] bg-[#0B111A] p-3">
                  <span className="font-mono text-xs text-[#4D9BFF] flex-1">
                    {`${window.location.origin}/book/${tenantSlug}`}
                  </span>
                  <button
                    onClick={() => {
                      void navigator.clipboard.writeText(`${window.location.origin}/book/${tenantSlug}`);
                      toast.success("Link copied!");
                    }}
                    className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
                  >
                    Copy
                  </button>
                </div>

                <a
                  href={`/book/${tenantSlug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-xs font-bold text-white hover:bg-white/5"
                >
                  <span>Open Live Booking Page</span>
                  <ExternalLink className="size-3.5" />
                </a>
              </div>
            )}

            {/* Workspace Tab */}
            {activeSettingsNav === "workspace" && (
              <div className="mt-6 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-[#1C283A] bg-[#0B111A] p-3.5">
                    <p className="text-[11px] text-gray-400">Workspace Slug</p>
                    <p className="font-mono text-xs font-bold text-white mt-0.5">{tenantSlug}</p>
                  </div>

                  <div className="rounded-xl border border-[#1C283A] bg-[#0B111A] p-3.5">
                    <p className="text-[11px] text-gray-400">Time Zone</p>
                    <p className="text-xs font-bold text-white mt-0.5">{settings.data?.timeZoneId || "Africa/Casablanca"}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer actions for tabs with form */}
          {activeSettingsNav !== "workspace" && activeSettingsNav !== "mylink" && profileTab !== "security" && (
            <div className="mt-8 flex items-center justify-end gap-3 border-t border-[#1C283A] pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/20 px-5 py-2 text-xs font-bold text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onSaveSubmit()}
                disabled={save.isPending}
                className="rounded-full px-6 py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:opacity-90 cursor-pointer"
                style={{ backgroundColor: selectedColor }}
              >
                {save.isPending ? "Saving changes…" : "Save changes"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function SettingsPage() {
  const navigate = useNavigate();
  return <SettingsModal onClose={() => navigate("/admin")} />;
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
          <Button
            className="w-full rounded-full text-white shadow-md hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "var(--brand-primary, #0069FF)" }}
            disabled={pending}
          >
            <Plus className="size-4" />
            {pending ? "Saving…" : "Add"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
