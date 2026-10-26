import { zodResolver } from "@hookform/resolvers/zod";
import { HubConnectionBuilder } from "@microsoft/signalr";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock3,
  CreditCard,
  MapPin,
  Sparkles,
  UserRound,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { api, apiMessage, tenantHeaders, type ApiSchemas } from "../api/client";
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
      .withUrl(`/hubs/availability?tenant=${encodeURIComponent(tenantSlug)}`)
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
      className="min-h-dvh"
      style={
        { "--primary": branding?.primaryColor || "#5145CD" } as CSSProperties
      }
    >
      <header className="border-b bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            {branding?.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt=""
                className="size-9 rounded-md object-contain"
              />
            ) : (
              <div className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground">
                <CalendarDays className="size-5" />
              </div>
            )}
            <span className="font-semibold">{branding?.name || "Slotly"}</span>
          </div>
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-7 sm:px-6 lg:grid-cols-[1fr_320px] lg:py-12">
        <section>
          <div className="mb-8 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            {[1, 2, 3].map((value) => (
              <div key={value} className="flex flex-1 items-center gap-2">
                <span
                  className={cn(
                    "grid size-7 place-items-center rounded-full border",
                    currentStep >= value &&
                      "border-primary bg-primary text-primary-foreground",
                  )}
                >
                  {currentStep > value ? <Check className="size-3.5" /> : value}
                </span>
                <span className="hidden sm:inline">
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
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <Title
                  eyebrow="Book an appointment"
                  title="How can we help?"
                  description="Choose a service to see the best available times."
                />
                <div className="mt-6 grid gap-3">
                  {services.isLoading
                    ? [1, 2, 3].map((x) => (
                        <Skeleton key={x} className="h-24" />
                      ))
                    : services.data?.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setService(item)}
                          className="group flex min-h-24 items-center justify-between rounded-lg border bg-card p-5 text-left shadow-card transition hover:-translate-y-0.5 hover:border-primary/50"
                        >
                          <div>
                            <h2 className="font-semibold">{item.name}</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {item.durationMinutes} min ·{" "}
                              {money(item.priceAmount, item.currency)}
                            </p>
                          </div>
                          <span className="grid size-9 place-items-center rounded-full bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground">
                            →
                          </span>
                        </button>
                      ))}
                </div>
              </motion.div>
            ) : !slot ? (
              <motion.div
                key="slots"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <button
                  onClick={() => setService(null)}
                  className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="size-4" /> Change service
                </button>
                <Title
                  eyebrow={service.name || ""}
                  title="Choose a time"
                  description={`Times shown in ${branding?.timeZoneId || "the business time zone"}.`}
                />
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="staff">Team member</Label>
                    <select
                      id="staff"
                      value={staffId}
                      onChange={(e) => setStaffId(e.target.value)}
                      className="mt-2 min-h-11 w-full rounded-md border bg-card px-3 text-sm"
                    >
                      <option value="any">Anyone available</option>
                      {staff.data?.map((person) => (
                        <option key={person.id} value={person.id}>
                          {person.displayName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      className="mt-2"
                      type="date"
                      min={minimumDate}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {availability.isLoading ? (
                    [1, 2, 3, 4, 5, 6].map((x) => (
                      <Skeleton key={x} className="h-12" />
                    ))
                  ) : availability.data?.length ? (
                    availability.data.map((item) => (
                      <Button
                        key={`${item.staffId}-${item.startsAt}`}
                        variant="outline"
                        onClick={() => setSlot(item)}
                        className="tabular-nums"
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
                    <p className="col-span-full rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                      No times are open on this day. Try another date or team
                      member.
                    </p>
                  )}
                </div>
              </motion.div>
            ) : !confirmation ? (
              <motion.div
                key="details"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <button
                  onClick={() => setSlot(null)}
                  className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="size-4" /> Choose another time
                </button>
                <Title
                  eyebrow="Almost there"
                  title="Your details"
                  description="We'll send confirmation and reminder emails here."
                />
                <form
                  onSubmit={form.handleSubmit((values) =>
                    createBooking.mutate(values),
                  )}
                  className="mt-7 space-y-5"
                >
                  {(["name", "email", "phone"] as const).map((field) => (
                    <div key={field} className="space-y-2">
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
                    className="w-full"
                    size="lg"
                    disabled={createBooking.isPending}
                  >
                    {createBooking.isPending ? (
                      "Reserving your time…"
                    ) : branding?.onlinePaymentsEnabled ? (
                      <>
                        <CreditCard />
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
                className="py-10 text-center"
              >
                <div className="mx-auto grid size-16 place-items-center rounded-full bg-success/15 text-success">
                  <Check className="size-8" />
                </div>
                <Badge variant="success" className="mt-6">
                  Confirmed
                </Badge>
                <h1 className="mt-4 text-3xl font-bold tracking-tight">
                  You're all set.
                </h1>
                <p className="mx-auto mt-3 max-w-md text-muted-foreground">
                  A confirmation is on its way. We look forward to seeing you.
                </p>
                <Button
                  className="mt-8"
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  Book another appointment
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
        <aside className="lg:pt-12">
          <Card className="sticky top-6 overflow-hidden">
            <div className="h-1.5 bg-primary" />
            <div className="p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Appointment summary
              </p>
              <div className="mt-5 space-y-4 text-sm">
                {service ? (
                  <Summary
                    icon={Sparkles}
                    label={service.name || ""}
                    detail={`${service.durationMinutes} minutes`}
                  />
                ) : (
                  <p className="text-muted-foreground">
                    Your selection will appear here.
                  </p>
                )}
                {slot && (
                  <Summary
                    icon={Clock3}
                    label={new Date(
                      slot.localStartsAt || slot.startsAt!,
                    ).toLocaleString([], {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    detail={branding?.timeZoneId || ""}
                  />
                )}
                {staffId !== "any" && (
                  <Summary
                    icon={UserRound}
                    label={
                      staff.data?.find((x) => x.id === staffId)?.displayName ||
                      ""
                    }
                    detail="Team member"
                  />
                )}
                <Summary
                  icon={MapPin}
                  label={branding?.name || "Online booking"}
                  detail="Appointment location provided by the business"
                />
              </div>
              {service && (
                <div className="mt-6 flex items-center justify-between border-t pt-5 font-semibold">
                  <span>Total</span>
                  <span>{money(service.priceAmount, service.currency)}</span>
                </div>
              )}
            </div>
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
      <p className="text-sm font-semibold text-primary dark:text-violet-300">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 text-muted-foreground">{description}</p>
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
      <div className="mt-0.5 text-primary">
        <Icon className="size-4" />
      </div>
      <div>
        <p className="font-medium">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}
function PublicError({ onBack }: { onBack: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center p-6 text-center">
      <div>
        <h1 className="text-2xl font-bold">Booking page not found</h1>
        <p className="mt-2 text-muted-foreground">
          Check the booking link and try again.
        </p>
        <Button className="mt-6" onClick={onBack}>
          Go back
        </Button>
      </div>
    </main>
  );
}
