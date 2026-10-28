import { zodResolver } from "@hookform/resolvers/zod";
import { HubConnectionBuilder } from "@microsoft/signalr";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Globe,
  Video,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
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
import { Button } from "../components/ui/button";
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
  notes: z.string().optional(),
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
  const [selectedSlotForConfirm, setSelectedSlotForConfirm] = useState<Slot | null>(null);
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

  // Automatically select the first service if none selected and only 1 exists
  useEffect(() => {
    if (!service && services.data?.length === 1) {
      setService(services.data[0]);
    }
  }, [services.data, service]);

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

  const uniqueAvailability = useMemo(() => {
    const slots = new Map<string, Slot>();
    for (const item of availability.data ?? []) {
      const key = new Date(item.localStartsAt || item.startsAt!).toLocaleTimeString(
        [],
        { hour: "2-digit", minute: "2-digit" },
      );
      if (!slots.has(key)) slots.set(key, item);
    }
    return [...slots.values()];
  }, [availability.data]);

  useEffect(() => {
    if (!service?.id) return;
    const connection = new HubConnectionBuilder()
      .withUrl(
        `${apiBaseUrl}/hubs/availability?tenant=${encodeURIComponent(tenantSlug)}`,
      )
      .withAutomaticReconnect()
      .build();
    connection.on("SlotChanged", () =>
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
    defaultValues: { name: "", email: "", phone: "", notes: "" },
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

  if (tenant.isError) return <PublicError onBack={() => navigate("/")} />;

  return (
    <div
      className="min-h-screen bg-[#F8F9FA] dark:bg-[#0B111A] text-[#0B1A2C] dark:text-white flex flex-col justify-between py-6 px-3 sm:px-6 selection:bg-[#0069FF] selection:text-white"
      style={
        { "--primary": branding?.primaryColor || "#0069FF" } as CSSProperties
      }
    >
      {/* Top Brand Bar */}
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between pb-6">
        <Link to="/" className="flex items-center gap-2">
          {branding?.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt={branding?.name || "Logo"}
              className="h-8 w-auto object-contain rounded-lg"
            />
          ) : (
            <SlotlyLogo variant="icon" className="size-8 text-[#0069FF]" />
          )}
          <span className="font-bold text-base tracking-tight text-[#0B1A2C] dark:text-white">
            {branding?.name || "Slotly"}
          </span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Calendly Split Booking Card Container */}
      <main className="mx-auto w-full max-w-5xl rounded-3xl bg-white dark:bg-[#111A28] border border-gray-200 dark:border-[#1C283A] shadow-2xl overflow-hidden my-auto">
        <div className="grid md:grid-cols-[320px_1fr] divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-[#1C283A]">
          {/* Left Summary Pane (Calendly Signature Host Panel) */}
          <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {/* Back navigation */}
              {(slot || (service && (services.data?.length ?? 0) > 1)) && (
                <button
                  onClick={() => {
                    if (slot) {
                      setSlot(null);
                      setSelectedSlotForConfirm(null);
                    } else if (service) {
                      setService(null);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#0069FF] transition-colors"
                >
                  <ArrowLeft className="size-3.5" />
                  <span>{slot ? "Change date & time" : "Choose other event"}</span>
                </button>
              )}

              {/* Host Avatar / Logo */}
              <div className="flex items-center gap-3">
                <div className="grid size-12 place-items-center rounded-full bg-[#0069FF] font-bold text-sm text-white shadow-sm">
                  {branding?.name ? branding.name.charAt(0) : "S"}
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
                    {branding?.name || "Slotly Workspace"}
                  </p>
                  <p className="text-sm font-extrabold text-[#0B1A2C] dark:text-white">
                    {staffId !== "any"
                      ? staff.data?.find((x) => x.id === staffId)?.displayName || "Practitioner"
                      : "Host Team"}
                  </p>
                </div>
              </div>

              {/* Service / Event Type Title */}
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#0B1A2C] dark:text-white">
                  {service?.name || "Select an appointment"}
                </h1>
              </div>

              {/* Meta details (Duration, Location, Price, Selected Slot) */}
              <div className="space-y-2.5 pt-2 text-xs font-semibold text-gray-600 dark:text-[#8B9CB0]">
                {service && (
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-[#0069FF]" />
                    <span>{service.durationMinutes} mins</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Video className="size-4 text-[#0069FF]" />
                  <span>Web conferencing details provided upon confirmation</span>
                </div>

                {service && (service.priceAmount ?? 0) > 0 && (
                  <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
                    <CreditCard className="size-4" />
                    <span>{money(service.priceAmount, service.currency)}</span>
                  </div>
                )}

                {slot && (
                  <div className="flex items-start gap-2 pt-2 border-t border-gray-100 dark:border-[#1C283A] text-[#0069FF]">
                    <CalendarDays className="size-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">
                        {new Date(slot.localStartsAt || slot.startsAt!).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })} -{" "}
                        {new Date(
                          new Date(slot.localStartsAt || slot.startsAt!).getTime() +
                            (service?.durationMinutes ?? 30) * 60000,
                        ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {new Date(slot.localStartsAt || slot.startsAt!).toLocaleDateString(undefined, {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="pt-2 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Welcome to our scheduling page. Please choose a convenient time that works best for your schedule.
              </div>
            </div>

            {/* Timezone Indicator */}
            <div className="pt-4 border-t border-gray-100 dark:border-[#1C283A] flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Globe className="size-4 text-[#0069FF]" />
              <span className="font-medium">
                {branding?.timeZoneId || "Africa/Casablanca"} ({new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})
              </span>
            </div>
          </div>

          {/* Right Interactive Selection / Booking Pane */}
          <div className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {confirmation ? (
                /* Step 4: Confirmed Success */
                <motion.div
                  key="confirmation"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-6 text-center space-y-4"
                >
                  <div className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                    <Check className="size-8 stroke-[3]" />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#0B1A2C] dark:text-white">
                    You are scheduled
                  </h2>
                  <p className="mx-auto max-w-md text-xs sm:text-sm text-gray-600 dark:text-[#8B9CB0]">
                    A calendar invitation and confirmation receipt have been sent to your email address.
                  </p>

                  <div className="mx-auto max-w-sm rounded-2xl bg-neutral-50 dark:bg-[#0B111A] border border-gray-200 dark:border-[#1C283A] p-4 text-left space-y-2 text-xs">
                    <div className="flex justify-between font-bold text-[#0B1A2C] dark:text-white">
                      <span>{service?.name}</span>
                      <span>{service?.durationMinutes} min</span>
                    </div>
                    <p className="text-gray-500 font-mono text-[11px]">
                      Booking Reference: #{confirmation.id?.slice(0, 8)}
                    </p>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={() => window.location.reload()}
                      className="rounded-full bg-[#0069FF] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#0056D6] transition-colors"
                    >
                      Schedule another meeting
                    </button>
                  </div>
                </motion.div>
              ) : !service ? (
                /* Step 1: Select a Service / Event Type */
                <motion.div
                  key="services"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <h2 className="text-lg font-bold text-[#0B1A2C] dark:text-white">
                    Select an appointment type
                  </h2>

                  <div className="grid gap-3">
                    {services.isLoading ? (
                      [1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)
                    ) : (
                      services.data?.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setService(s)}
                          className="group flex items-center justify-between rounded-2xl border border-gray-200 dark:border-[#1C283A] bg-white dark:bg-[#111A28] p-5 text-left transition-all hover:border-[#0069FF] hover:shadow-md cursor-pointer"
                        >
                          <div className="space-y-1">
                            <h3 className="text-sm font-bold text-[#0B1A2C] dark:text-white group-hover:text-[#0069FF] transition-colors">
                              {s.name}
                            </h3>
                            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-[#8B9CB0]">
                              <span className="flex items-center gap-1">
                                <Clock className="size-3.5" /> {s.durationMinutes} min
                              </span>
                              {(s.priceAmount ?? 0) > 0 && (
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                  {money(s.priceAmount, s.currency)}
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="size-4 text-gray-400 group-hover:text-[#0069FF] group-hover:translate-x-0.5 transition-all" />
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              ) : !slot ? (
                /* Step 2: Calendly Calendar & Time Picker */
                <motion.div
                  key="calendar"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h2 className="text-lg font-bold text-[#0B1A2C] dark:text-white">
                      Select a Date & Time
                    </h2>

                    {/* Practitioner Selector */}
                    {staff.data && staff.data.length > 1 && (
                      <select
                        value={staffId}
                        onChange={(e) => setStaffId(e.target.value)}
                        className="h-9 rounded-xl border border-gray-200 dark:border-[#1C283A] bg-white dark:bg-[#0B111A] px-3 text-xs font-semibold text-[#0B1A2C] dark:text-white"
                      >
                        <option value="any">Any available team member</option>
                        {staff.data.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.displayName}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* 2-Column Calendar & Slots Split View */}
                  <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                    {/* Left: Monthly Date Picker */}
                    <CalendlyDatePicker
                      value={date}
                      minimumDate={minimumDate}
                      onChange={(newDate) => {
                        setDate(newDate);
                        setSelectedSlotForConfirm(null);
                      }}
                    />

                    {/* Right: Time Slots for Selected Date */}
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
                        {new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>

                      <div className="max-h-[340px] overflow-y-auto space-y-2 pr-1">
                        {availability.isLoading ? (
                          [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 rounded-xl" />)
                        ) : uniqueAvailability.length ? (
                          uniqueAvailability.map((item) => {
                            const timeStr = new Date(
                              item.localStartsAt || item.startsAt!,
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            });
                            const isSelected = selectedSlotForConfirm === item;

                            return (
                              <div key={`${item.staffId}-${item.startsAt}`} className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedSlotForConfirm(item)}
                                  className={cn(
                                    "flex-1 h-11 rounded-xl border font-bold text-xs transition-all",
                                    isSelected
                                      ? "border-[#0069FF] bg-[#0069FF] text-white"
                                      : "border-gray-200 dark:border-[#1C283A] bg-white dark:bg-[#111A28] text-[#0069FF] hover:border-[#0069FF] hover:bg-blue-50 dark:hover:bg-[#152B46]"
                                  )}
                                >
                                  {timeStr}
                                </button>

                                {isSelected && (
                                  <button
                                    type="button"
                                    onClick={() => setSlot(item)}
                                    className="h-11 rounded-xl bg-[#0B1A2C] dark:bg-white px-4 text-xs font-bold text-white dark:text-[#0B1A2C] shadow-md hover:bg-[#0069FF] dark:hover:bg-neutral-100 transition-all animate-in fade-in"
                                  >
                                    Next
                                  </button>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="rounded-xl border border-dashed border-gray-200 dark:border-[#1C283A] p-6 text-center text-xs text-gray-500">
                            No open times available for this date.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* Step 3: Enter Details Form */
                <motion.div
                  key="details"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-5"
                >
                  <h2 className="text-lg font-bold text-[#0B1A2C] dark:text-white">
                    Enter Details
                  </h2>

                  <form
                    onSubmit={form.handleSubmit((values) =>
                      createBooking.mutate(values),
                    )}
                    className="space-y-4"
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-xs font-semibold">Your Name *</Label>
                      <Input
                        id="name"
                        placeholder="e.g. Sarah Jenkins"
                        className="h-11 rounded-xl"
                        {...form.register("name")}
                      />
                      <FieldError>{form.formState.errors.name?.message}</FieldError>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs font-semibold">Email address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@domain.com"
                        className="h-11 rounded-xl"
                        {...form.register("email")}
                      />
                      <FieldError>{form.formState.errors.email?.message}</FieldError>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-xs font-semibold">Phone number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 555 019 2834"
                        className="h-11 rounded-xl"
                        {...form.register("phone")}
                      />
                      <FieldError>{form.formState.errors.phone?.message}</FieldError>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="notes" className="text-xs font-semibold">
                        Please share anything that will help prepare for our meeting
                      </Label>
                      <textarea
                        id="notes"
                        rows={3}
                        placeholder="Goals, topics, questions..."
                        className="w-full rounded-xl border border-gray-200 dark:border-[#1C283A] bg-white dark:bg-[#0B111A] p-3 text-xs text-[#0B1A2C] dark:text-white placeholder:text-gray-400 focus:border-[#0069FF] focus:outline-none"
                        {...form.register("notes")}
                      />
                    </div>

                    <p className="text-[11px] text-gray-500 leading-relaxed pt-1">
                      By proceeding, you confirm that you agree to the meeting terms and policy.
                    </p>

                    <Button
                      className="mt-2 w-full sm:w-auto rounded-full bg-[#0069FF] hover:bg-[#0056D6] text-white font-bold px-8 py-3 text-sm shadow-md"
                      disabled={createBooking.isPending}
                    >
                      {createBooking.isPending
                        ? "Scheduling Event…"
                        : branding?.onlinePaymentsEnabled
                          ? "Proceed to Payment"
                          : "Schedule Event"}
                    </Button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer Powered By Slotly */}
      <footer className="mx-auto pt-6 text-center text-xs text-gray-500">
        <span>Powered by </span>
        <Link to="/" className="font-bold text-[#0069FF] hover:underline">
          Slotly
        </Link>
      </footer>
    </div>
  );
}

/* -------------------------------------------------------------
 * CALENDLY DATE PICKER COMPONENT
 * ------------------------------------------------------------- */
function CalendlyDatePicker({
  value,
  minimumDate,
  onChange,
}: {
  value: string;
  minimumDate: string;
  onChange: (value: string) => void;
}) {
  const selected = new Date(`${value}T12:00:00`);
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(selected.getFullYear(), selected.getMonth(), 1),
  );
  const firstWeekday = (visibleMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth() + 1,
    0,
  ).getDate();
  const cells = Array.from({ length: firstWeekday + daysInMonth }, (_, index) =>
    index < firstWeekday ? null : index - firstWeekday + 1,
  );

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-[#1C283A] bg-white dark:bg-[#0B111A] p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-[#0B1A2C] dark:text-white">
          {visibleMonth.toLocaleDateString(undefined, {
            month: "long",
            year: "numeric",
          })}
        </p>
        <div className="flex gap-1">
          <button
            type="button"
            className="grid size-8 place-items-center rounded-full hover:bg-neutral-100 dark:hover:bg-[#162234] text-gray-600 dark:text-gray-300 transition-colors"
            aria-label="Previous month"
            onClick={() =>
              setVisibleMonth(
                new Date(
                  visibleMonth.getFullYear(),
                  visibleMonth.getMonth() - 1,
                  1,
                ),
              )
            }
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            className="grid size-8 place-items-center rounded-full hover:bg-neutral-100 dark:hover:bg-[#162234] text-gray-600 dark:text-gray-300 transition-colors"
            aria-label="Next month"
            onClick={() =>
              setVisibleMonth(
                new Date(
                  visibleMonth.getFullYear(),
                  visibleMonth.getMonth() + 1,
                  1,
                ),
              )
            }
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 text-center text-[10px] font-bold uppercase tracking-wider text-gray-400">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <span key={day} className="py-1">
            {day}
          </span>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-y-1.5 text-center text-xs">
        {cells.map((day, index) => {
          if (!day) return <span key={`empty-${index}`} className="size-9" />;
          const dateValue = isoDate(
            new Date(
              visibleMonth.getFullYear(),
              visibleMonth.getMonth(),
              day,
              12,
            ),
          );
          const disabled = dateValue < minimumDate;
          const isSelected = dateValue === value;

          return (
            <button
              key={dateValue}
              type="button"
              aria-label={`Choose ${dateValue}`}
              disabled={disabled}
              onClick={() => onChange(dateValue)}
              className={cn(
                "mx-auto flex size-9 items-center justify-center rounded-full font-bold tabular-nums transition-all",
                isSelected
                  ? "bg-[#0069FF] text-white shadow-md scale-105"
                  : disabled
                    ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                    : "text-[#0B1A2C] dark:text-white hover:bg-blue-50 dark:hover:bg-[#152B46] hover:text-[#0069FF]"
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PublicError({ onBack }: { onBack: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center p-6 text-center bg-[#F8F9FA] dark:bg-[#0B111A]">
      <div className="rounded-3xl border border-gray-200 dark:border-[#1C283A] bg-white dark:bg-[#111A28] p-8 max-w-sm shadow-xl space-y-4">
        <h1 className="text-xl font-bold text-[#0B1A2C] dark:text-white">Booking page not found</h1>
        <p className="text-xs text-gray-500 leading-relaxed">
          The requested workspace booking URL does not exist or has expired.
        </p>
        <Button className="w-full rounded-full bg-[#0069FF] text-white hover:bg-[#0056D6]" onClick={onBack}>
          Return to home
        </Button>
      </div>
    </main>
  );
}
