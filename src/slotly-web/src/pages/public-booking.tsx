import { zodResolver } from "@hookform/resolvers/zod";
import { HubConnectionBuilder } from "@microsoft/signalr";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  Clock3,
  CreditCard,
  MapPin,
  UserRound,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import {
  api,
  apiBaseUrl,
  apiMessage,
  tenantHeaders,
  type ApiSchemas,
} from "../api/client";
import { SlotlyLogo } from "../components/slotly-logo";
import { ThemeToggle } from "../components/theme-toggle";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { FieldError, Label } from "../components/ui/label";
import { Skeleton } from "../components/ui/skeleton";
import { cn } from "../lib/cn";

type Service = ApiSchemas["ServiceDto"];
type Slot = ApiSchemas["AvailabilityDto"];
type Booking = ApiSchemas["BookingDto"];

const detailsSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name."),
  email: z.email("Enter a valid email address."),
  phone: z.string().trim().min(7, "Enter a valid phone number.").max(32),
});
type Details = z.infer<typeof detailsSchema>;

function isoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function money(value?: number, currency?: string | null) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "USD",
  }).format(value || 0);
}

export function PublicBookingPage() {
  const { tenantSlug = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [service, setService] = useState<Service | null>(null);
  const [staffId, setStaffId] = useState<string>("any");
  const [date, setDate] = useState(() =>
    isoDate(new Date(Date.now() + 86_400_000)),
  );
  const [minimumDate] = useState(() => isoDate(new Date()));
  const [slot, setSlot] = useState<Slot | null>(null);
  const [confirmation, setConfirmation] = useState<Booking | null>(null);
  const headers = useMemo(() => tenantHeaders(tenantSlug), [tenantSlug]);

  const tenant = useQuery({
    queryKey: ["tenant", tenantSlug],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/public/tenant", {
        headers,
      });
      if (!data) throw error;
      return data;
    },
  });

  const services = useQuery({
    queryKey: ["services", tenantSlug],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/services", {
        headers,
        params: { query: { page: 1, pageSize: 100 } },
      });
      if (!data) throw error;
      return data.items ?? [];
    },
  });

  const staff = useQuery({
    queryKey: ["staff", tenantSlug],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/staff", {
        headers,
        params: { query: { page: 1, pageSize: 100 } },
      });
      if (!data) throw error;
      return data.items ?? [];
    },
  });

  const availability = useQuery({
    queryKey: ["availability", tenantSlug, service?.id, staffId, date],
    enabled: Boolean(service?.id && date),
    queryFn: async () => {
      const next = new Date(`${date}T12:00:00`);
      next.setDate(next.getDate() + 1);
      const query = {
        serviceId: service!.id!,
        startsOn: date,
        endsOn: isoDate(next),
        ...(staffId === "any" ? {} : { staffId }),
      };
      const { data, error } = await api.GET("/api/v1/availability", {
        headers,
        params: { query },
      });
      if (!data) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!service?.id) return;
    const connection = new HubConnectionBuilder()
      .withUrl(
        `${apiBaseUrl}/hubs/availability?tenant=${encodeURIComponent(tenantSlug)}`,
      )
      .withAutomaticReconnect()
      .build();
    connection.on(
      "SlotChanged",
      () =>
        void queryClient.invalidateQueries({
          queryKey: ["availability", tenantSlug, service.id],
        }),
    );
    void connection
      .start()
      .then(() => connection.invoke("Subscribe", service.id, date))
      .catch(() => undefined);
    return () => {
      void connection.stop();
    };
  }, [date, queryClient, service?.id, tenantSlug]);

  const form = useForm<Details>({
    resolver: zodResolver(detailsSchema),
    defaultValues: { name: "", email: "", phone: "" },
  });

  const createBooking = useMutation({
    mutationFn: async (values: Details) => {
      if (!service?.id || !slot?.staffId || !slot.startsAt)
        throw new Error("Choose an available time first.");
      const { data, error } = await api.POST("/api/v1/bookings", {
        headers,
        body: {
          serviceId: service.id,
          staffId: slot.staffId,
          startsAt: slot.startsAt,
          customerName: values.name,
          customerEmail: values.email,
          customerPhone: values.phone,
        },
      });
      if (!data) throw error;
      return data;
    },
    onSuccess(data) {
      if (data.checkoutUrl) window.location.assign(data.checkoutUrl);
      else {
        setConfirmation(data);
        toast.success("Your appointment is confirmed.");
      }
    },
    onError(error) {
      toast.error(apiMessage(error, "That slot is no longer available."));
    },
  });

  const branding = tenant.data;
  const currentStep = confirmation ? 4 : !service ? 1 : !slot ? 2 : 3;

  if (tenant.isError) return <PublicError onBack={() => navigate("/")} />;

  return (
    <div
      className="min-h-dvh bg-background"
      style={
        { "--primary": branding?.primaryColor || "#2563EB" } as CSSProperties
      }
    >
      {/* Public Header (No blur, crisp 1px border) */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            {branding?.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt={branding?.name || "Logo"}
                className="size-8 rounded-xl object-contain border border-border"
              />
            ) : (
              <SlotlyLogo variant="icon" className="size-8" />
            )}
            <div>
              <span className="font-bold text-base tracking-tight text-foreground">
                {branding?.name || "Slotly"}
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs text-muted-foreground font-medium">
                · Online Booking
              </span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Booking Flow */}
      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_340px] lg:py-12">
        <section>
          {/* Stepper (Clean circular badges with connecting track) */}
          <div className="mb-8 flex items-center justify-between gap-2 text-xs font-semibold text-muted-foreground">
            {[1, 2, 3].map((value) => (
              <div key={value} className="flex flex-1 items-center gap-2">
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full border border-border text-xs font-bold transition-colors",
                    currentStep >= value
                      ? "border-primary bg-primary text-white"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {currentStep > value ? <Check className="size-3.5" /> : value}
                </span>
                <span className="text-xs font-medium text-foreground">
                  {["Service", "Time", "Details"][value - 1]}
                </span>
                {value < 3 && <span className="h-px flex-1 bg-border" />}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {!service ? (
              <motion.div
                key="services"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <Title
                  eyebrow="Step 1 of 3"
                  title="Choose a service"
                  description="Select the appointment you would like to book to view available times."
                />
                <div className="grid gap-3">
                  {services.isLoading
                    ? [1, 2, 3].map((x) => (
                        <Skeleton key={x} className="h-24 rounded-2xl" />
                      ))
                    : services.data?.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setService(item)}
                          className="group flex min-h-24 items-center justify-between rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:border-primary hover:bg-muted/30"
                        >
                          <div className="space-y-1">
                            <h2 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                              {item.name}
                            </h2>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 font-medium tabular-nums">
                                <Clock className="size-3" />
                                {item.durationMinutes} min
                              </span>
                              <span>·</span>
                              <span className="font-semibold text-foreground tabular-nums">
                                {money(item.priceAmount, item.currency)}
                              </span>
                            </div>
                          </div>
                          <span className="grid size-9 shrink-0 place-items-center rounded-full border border-border bg-card text-muted-foreground group-hover:border-primary group-hover:bg-primary group-hover:text-white transition-colors">
                            <ChevronRight className="size-4" />
                          </span>
                        </button>
                      ))}
                </div>
              </motion.div>
            ) : !slot ? (
              <motion.div
                key="slots"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <button
                  onClick={() => setService(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="size-3.5" /> Back to services
                </button>
                <Title
                  eyebrow={service.name || ""}
                  title="Select an available time"
                  description={`Times shown in ${branding?.timeZoneId || "local workspace time zone"}.`}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="staff">Practitioner / Team member</Label>
                    <select
                      id="staff"
                      value={staffId}
                      onChange={(e) => setStaffId(e.target.value)}
                      className="min-h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm text-foreground"
                    >
                      <option value="any">Any available practitioner</option>
                      {staff.data?.map((person) => (
                        <option key={person.id} value={person.id}>
                          {person.displayName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      min={minimumDate}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="cursor-pointer"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Available slots on {new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {availability.isLoading ? (
                      [1, 2, 3, 4, 5, 6].map((x) => (
                        <Skeleton key={x} className="h-11 rounded-xl" />
                      ))
                    ) : availability.data?.length ? (
                      availability.data.map((item) => (
                        <Button
                          key={`${item.staffId}-${item.startsAt}`}
                          variant="outline"
                          onClick={() => setSlot(item)}
                          className="tabular-nums rounded-xl hover:border-primary hover:bg-accent font-semibold"
                        >
                          {new Date(
                            item.localStartsAt || item.startsAt!,
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Button>
                      ))
                    ) : (
                      <div className="col-span-full rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                        <Clock className="mx-auto size-6 text-muted-foreground mb-2" />
                        <p className="font-semibold text-foreground">No open slots on this date</p>
                        <p className="text-xs text-muted-foreground mt-1">Please select another date or choose any available practitioner.</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : !confirmation ? (
              <motion.div
                key="details"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <button
                  onClick={() => setSlot(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="size-3.5" /> Choose another time
                </button>
                <Title
                  eyebrow="Step 3 of 3"
                  title="Your contact details"
                  description="We will send your booking confirmation and schedule reminders here."
                />
                <form
                  onSubmit={form.handleSubmit((values) =>
                    createBooking.mutate(values),
                  )}
                  className="space-y-4"
                >
                  {(["name", "email", "phone"] as const).map((field) => (
                    <div key={field} className="space-y-1.5">
                      <Label htmlFor={field}>
                        {field === "name"
                          ? "Full name"
                          : field === "email"
                            ? "Email address"
                            : "Phone number"}
                      </Label>
                      <Input
                        id={field}
                        type={field === "email" ? "email" : "text"}
                        placeholder={
                          field === "name"
                            ? "e.g. Sarah Jenkins"
                            : field === "email"
                              ? "sarah@example.com"
                              : "+1 555 019 2834"
                        }
                        autoComplete={
                          field === "name"
                            ? "name"
                            : field === "email"
                              ? "email"
                              : "tel"
                        }
                        aria-invalid={Boolean(form.formState.errors[field])}
                        {...form.register(field)}
                      />
                      <FieldError>
                        {form.formState.errors[field]?.message}
                      </FieldError>
                    </div>
                  ))}
                  <Button
                    className="mt-2 w-full rounded-full"
                    size="lg"
                    disabled={createBooking.isPending}
                  >
                    {createBooking.isPending ? (
                      "Confirming reservation…"
                    ) : branding?.onlinePaymentsEnabled ? (
                      <>
                        <CreditCard className="size-4" />
                        Continue to payment
                      </>
                    ) : (
                      <>Confirm appointment</>
                    )}
                  </Button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border border-border bg-card p-8 sm:p-12 text-center"
              >
                <div className="mx-auto grid size-14 place-items-center rounded-full bg-success/15 text-success">
                  <Check className="size-7" />
                </div>
                <Badge variant="success" className="mt-4">
                  Confirmed
                </Badge>
                <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  You're all set.
                </h1>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                  Your appointment has been registered and a confirmation email has been dispatched.
                </p>
                <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4 text-xs font-mono text-muted-foreground">
                  Booking Reference: #{confirmation.id?.slice(0, 8)}
                </div>
                <Button
                  className="mt-6 rounded-full"
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  Book another appointment
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Aside: Clean Floating Appointment Summary */}
        <aside className="lg:pt-14">
          <Card className="sticky top-6 p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Appointment Summary
            </p>
            <div className="mt-5 space-y-4 text-sm">
              {service ? (
                <Summary
                  icon={CalendarDays}
                  label={service.name || ""}
                  detail={`${service.durationMinutes} minutes duration`}
                />
              ) : (
                <p className="text-xs text-muted-foreground">
                  Your chosen service will appear here.
                </p>
              )}
              {slot && (
                <Summary
                  icon={Clock3}
                  label={new Date(
                    slot.localStartsAt || slot.startsAt!,
                  ).toLocaleString([], {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  detail={branding?.timeZoneId || "Local workspace time"}
                />
              )}
              {staffId !== "any" && (
                <Summary
                  icon={UserRound}
                  label={
                    staff.data?.find((x) => x.id === staffId)?.displayName ||
                    "Assigned Practitioner"
                  }
                  detail="Practitioner"
                />
              )}
              <Summary
                icon={MapPin}
                label={branding?.name || "Clinic location"}
                detail="Consultation & Clinic Workspace"
              />
            </div>
            {service && (
              <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-sm font-semibold">
                <span className="text-foreground">Total Fee</span>
                <span className="text-base text-foreground tabular-nums">
                  {money(service.priceAmount, service.currency)}
                </span>
              </div>
            )}
          </Card>
        </aside>
      </main>
    </div>
  );
}

function Title({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">
        {eyebrow}
      </p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {title}
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function Summary({
  icon: Icon,
  label,
  detail,
}: {
  icon: typeof Clock3;
  label: string;
  detail: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 grid size-7 place-items-center rounded-lg border border-border bg-muted/40 text-primary shrink-0">
        <Icon className="size-3.5" />
      </div>
      <div>
        <p className="font-semibold text-xs text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function PublicError({ onBack }: { onBack: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center p-6 text-center">
      <div className="rounded-2xl border border-border bg-card p-8 max-w-sm">
        <h1 className="text-xl font-bold text-foreground">Booking page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The requested workspace booking URL does not exist or has expired.
        </p>
        <Button className="mt-6 rounded-full w-full" onClick={onBack}>
          Return to home
        </Button>
      </div>
    </main>
  );
}
