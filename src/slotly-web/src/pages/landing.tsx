import {
  ArrowRight,
  Calendar,
  Check,
  Clock,
  CreditCard,
  ExternalLink,
  LogIn,
  Menu,
  Mic,
  Send,
  Sparkles,
  Video,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AiChatWidget } from "../components/ai-chat-widget";
import { SlotlyLogo } from "../components/slotly-logo";
import { cn } from "../lib/cn";

export function LandingPage() {
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(0);
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);

  // Auto-advance feature tab
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveFeatureIndex((prev) => (prev + 1) % 4);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#0B1A2C] selection:bg-[#0069FF] selection:text-white font-sans">
      {/* 1. Top Announcement Bar */}
      {!bannerDismissed && (
        <div className="relative bg-[#E8F3FF] border-b border-[#D4E8FC] px-4 py-2.5 text-center text-xs sm:text-sm font-medium text-[#0B3558] transition-all">
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-2">
            <span className="flex items-center gap-1.5 font-semibold">
              <Sparkles className="size-3.5 text-[#0069FF]" />
              Introducing the new Slotly, built for seamless appointment scheduling and booking.
            </span>
            <Link
              to="/book/northstar-health"
              className="inline-flex items-center gap-1 font-bold text-[#0069FF] hover:underline"
            >
              Learn more <ArrowRight className="size-3" />
            </Link>
          </div>
          <button
            onClick={() => setBannerDismissed(true)}
            aria-label="Dismiss banner"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#0B3558]/60 hover:text-[#0B3558]"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* 2. Floating Pill Navbar */}
      <header className="sticky top-0 z-50 px-3 sm:px-6 py-3">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between rounded-2xl border border-[#E8E8E8] bg-white/95 px-5 shadow-sm backdrop-blur-md transition-all">
          {/* Brand */}
          <Link to="/" className="inline-flex items-center" title="Slotly">
            <SlotlyLogo variant="full" mode="original" className="h-8 w-auto" />
          </Link>

          {/* Nav Links (flat, no dropdowns) */}
          <nav className="hidden items-center gap-7 lg:flex">
            <Link to="/book/northstar-health" className="text-sm font-semibold text-[#0B1A2C] hover:text-[#0069FF]">
              Product
            </Link>
            <Link to="/login" className="text-sm font-semibold text-[#0B1A2C] hover:text-[#0069FF]">
              Solutions
            </Link>
            <Link to="/login" className="text-sm font-semibold text-[#0B1A2C] hover:text-[#0069FF]">
              Resources
            </Link>
            <a href="#pricing" className="text-sm font-semibold text-[#0B1A2C] hover:text-[#0069FF]">
              Pricing
            </a>
          </nav>

          {/* Right Actions */}
          <div className="hidden items-center gap-3 sm:flex">
            <Link
              to="/login"
              className="inline-flex h-10 items-center justify-center rounded-full border border-[#0B1A2C]/20 px-5 text-sm font-semibold text-[#0B1A2C] transition-colors hover:border-[#0B1A2C] hover:bg-[#0B1A2C]/5"
            >
              Log In
            </Link>
            <Link
              to="/book/northstar-health"
              className="inline-flex h-10 items-center justify-center rounded-full bg-[#0B1A2C] px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#0069FF]"
            >
              Get started for free
            </Link>
          </div>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="grid size-10 place-items-center rounded-xl border border-[#E8E8E8] text-[#0B1A2C] lg:hidden"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="mt-2 rounded-2xl border border-[#E8E8E8] bg-white p-5 shadow-2xl lg:hidden">
            <div className="space-y-3">
              <Link to="/book/northstar-health" className="block text-base font-semibold py-1">Booking Experience</Link>
              <Link to="/login" className="block text-base font-semibold py-1">Admin Dashboard</Link>
              <a href="#pricing" className="block text-base font-semibold py-1">Pricing</a>
              <div className="pt-4 border-t border-[#E8E8E8] grid gap-2">
                <Link to="/login" className="flex h-11 items-center justify-center rounded-full border border-[#0B1A2C] font-semibold text-sm">Log in</Link>
                <Link to="/book/northstar-health" className="flex h-11 items-center justify-center rounded-full bg-[#0069FF] font-semibold text-sm text-white">Get started</Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* 3. Hero Section */}
      <section className="px-3 sm:px-6 pt-4 pb-12">
        <div className="mx-auto max-w-7xl rounded-[32px] bg-[#FAF8F5] border border-[#EFECE6] px-6 py-16 sm:py-24 text-center">
          <div className="mx-auto max-w-4xl space-y-6">
            <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl font-normal leading-[1.08] tracking-tight text-[#0B1A2C]">
              All your appointment <br className="hidden sm:inline" />
              scheduling, <span className="italic font-serif">handled.</span>
            </h1>

            <p className="mx-auto max-w-2xl text-lg sm:text-xl text-[#4A5568] leading-relaxed">
              From online self-service booking to real-time calendar sync and automated reminders, keep your business moving with zero double-booking.
            </p>

            {/* Action Buttons: Book & Login */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/book/northstar-health"
                className="w-full sm:w-auto inline-flex h-13 items-center justify-center gap-2.5 rounded-full bg-[#0069FF] px-8 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#0056D6] hover:shadow-lg hover:-translate-y-0.5"
              >
                <Calendar className="size-4.5" />
                Book an Appointment
              </Link>

              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex h-13 items-center justify-center gap-2.5 rounded-full border border-[#0B1A2C] bg-white px-8 text-sm font-semibold text-[#0B1A2C] shadow-sm transition-all hover:bg-neutral-50 hover:border-[#0069FF] hover:text-[#0069FF]"
              >
                <LogIn className="size-4.5" />
                Log In
              </Link>
            </div>

            <p className="text-xs text-[#718096]">
              Instant online booking · Zero double-booking · Real-time calendar sync
            </p>
          </div>
        </div>
      </section>

      {/* 4. Calendly-style Sticky Scroll Feature Showcase */}
      <StickyScrollShowcase />

      {/* 5. 4-Stage Connected Workflow Cards (Book, Prep, Capture, Follow up - Frame 5 & 6) */}
      <section className="px-3 sm:px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0069FF]">End-to-End Meeting Lifecycle</span>
            <h2 className="mt-3 font-serif text-4xl sm:text-5xl font-normal text-[#0B1A2C]">
              From booking to follow-up, completely streamlined.
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            <WorkflowStageCard
              number="01"
              title="Book"
              desc="A client emails asking to meet. Share a booking link or ask Slotly AI to find times that work for everyone."
              items={[
                "Slotly replies with times to meet",
                "Client picks Tuesday at 2 p.m.",
                "Client pays deposit upfront",
              ]}
              isActive={activeWorkflowStep === 0}
              onClick={() => setActiveWorkflowStep(0)}
            />

            <WorkflowStageCard
              number="02"
              title="Prep"
              desc="Never walk into an appointment cold. Slotly compiles client history and forms before you start."
              items={[
                "Intake form answers attached",
                "Past appointments referenced",
                "Meeting room link auto-generated",
              ]}
              isActive={activeWorkflowStep === 1}
              onClick={() => setActiveWorkflowStep(1)}
            />

            <WorkflowStageCard
              number="03"
              title="Capture"
              desc="Focus on the patient or client. Slotly handles notes, transcripts, and action timestamps automatically."
              items={[
                "AI Notetaker joins the room",
                "Real-time speaker recognition",
                "Key decisions captured live",
              ]}
              isActive={activeWorkflowStep === 2}
              onClick={() => setActiveWorkflowStep(2)}
            />

            <WorkflowStageCard
              number="04"
              title="Follow up"
              desc="Work moves forward after the call ends. Recap notes and next steps sent within 60 seconds."
              items={[
                "Structured recap emailed out",
                "Invoice & receipt delivered",
                "Next milestone booked automatically",
              ]}
              isActive={activeWorkflowStep === 3}
              onClick={() => setActiveWorkflowStep(3)}
            />
          </div>
        </div>
      </section>

      {/* 6. Sticky Split Interactive Feature Showcase ("that fit your business" - Frame 7, 8, 10, 12) */}
      <section className="px-3 sm:px-6 py-16 sm:py-24 bg-white border-y border-[#EFECE6]">
        <div className="mx-auto max-w-7xl grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Left: Dynamic UI Graphic based on activeFeatureIndex */}
          <div className="relative rounded-3xl bg-gradient-to-tr from-[#EBF5FE] via-[#F3E8FF] to-[#ECFDF5] p-6 sm:p-10 border border-[#E2E8F0]">
            <AnimatePresence mode="wait">
              {activeFeatureIndex === 0 && (
                <motion.div
                  key="feat-0"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="rounded-2xl bg-white p-6 shadow-xl border border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-12 rounded-full bg-blue-100 text-[#0069FF] font-bold grid place-items-center">
                      IB
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#0B1A2C]">Ibrahim Benkacem</p>
                      <p className="text-xs text-gray-500">Initial Consultation</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-xs font-semibold text-gray-600 border-y border-gray-100 py-3">
                    <span className="flex items-center gap-1"><Clock className="size-3.5 text-[#0069FF]" /> 45 min</span>
                    <span className="flex items-center gap-1"><Video className="size-3.5 text-[#0069FF]" /> Google Meet</span>
                    <span className="flex items-center gap-1 font-bold text-emerald-600">$100 USD</span>
                  </div>
                  <div className="mt-4 rounded-xl bg-gray-50 p-3 text-xs">
                    <p className="font-semibold text-gray-700">Payment Processor</p>
                    <div className="mt-2 flex gap-2">
                      <span className="rounded-lg bg-white px-3 py-1.5 font-bold shadow-xs border border-gray-200">Stripe ✓</span>
                      <span className="rounded-lg bg-white px-3 py-1.5 font-bold shadow-xs border border-gray-200">PayPal</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeFeatureIndex === 1 && (
                <motion.div
                  key="feat-1"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="rounded-2xl bg-white p-6 shadow-xl border border-gray-100"
                >
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <p className="text-sm font-bold text-[#0B1A2C]">5-Session Health Bundle</p>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">Save 15%</span>
                  </div>
                  <p className="mt-3 text-xs text-gray-500">Includes 5 full 60-minute therapy or consultation sessions with automated tracking.</p>
                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl font-bold text-[#0B1A2C]">$425.00</span>
                      <span className="text-xs text-gray-400 line-through ml-2">$500.00</span>
                    </div>
                    <span className="text-xs font-semibold text-[#0069FF]">5 Credits included</span>
                  </div>
                  <button className="mt-4 w-full rounded-xl bg-[#0069FF] py-2.5 text-xs font-bold text-white shadow-sm">
                    Purchase Package & Book
                  </button>
                </motion.div>
              )}

              {activeFeatureIndex === 2 && (
                <motion.div
                  key="feat-2"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="rounded-2xl bg-white p-6 shadow-xl border border-gray-100"
                >
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Invoice #INV-2026-084</p>
                    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-[#0069FF]">Ready to send</span>
                  </div>
                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-gray-50">
                      <span>Clinical Assessment & Follow-up</span>
                      <span className="font-bold">$250.00</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-50">
                      <span>Diagnostic Lab Review</span>
                      <span className="font-bold">$150.00</span>
                    </div>
                    <div className="flex justify-between pt-2 font-bold text-sm text-[#0B1A2C]">
                      <span>Amount Due:</span>
                      <span>$400.00</span>
                    </div>
                  </div>
                  <button className="mt-4 w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-sm flex items-center justify-center gap-2">
                    <Send className="size-3.5" /> Send Invoice
                  </button>
                </motion.div>
              )}

              {activeFeatureIndex === 3 && (
                <motion.div
                  key="feat-3"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="rounded-2xl bg-white p-6 shadow-xl border border-gray-100 text-center"
                >
                  <div className="mx-auto size-12 rounded-full bg-[#0069FF]/10 text-[#0069FF] grid place-items-center">
                    <Zap className="size-6" />
                  </div>
                  <p className="mt-3 text-sm font-bold text-[#0B1A2C]">Instant Payment Link</p>
                  <p className="mt-1 text-xs text-gray-500">slotly.com/pay/ibrahim/consultation</p>
                  <div className="mt-4 rounded-xl bg-gray-50 p-3 text-xs font-mono text-gray-600">
                    Supports Apple Pay, Google Pay & Card
                  </div>
                  <button className="mt-4 w-full rounded-xl bg-[#0B1A2C] py-2.5 text-xs font-bold text-white shadow-sm">
                    Copy One-Click Link
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Feature Accordion with Animated Progress Underline */}
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#0069FF]">Monetization & Billing</span>
              <h2 className="mt-2 font-serif text-4xl sm:text-5xl font-normal text-[#0B1A2C]">
                Payments that fit your business.
              </h2>
            </div>

            <div className="space-y-4">
              {[
                {
                  title: "Upfront meeting payments",
                  desc: "Collect payment when clients book with you, so you can get paid sooner and eliminate no-shows.",
                },
                {
                  title: "Meeting packages",
                  desc: "Sell multi-appointment bundles upfront and let clients schedule as they need with automated credit counters.",
                },
                {
                  title: "Invoices",
                  desc: "Send professional branded invoices for post-appointment billing, installments, or project-based work.",
                },
                {
                  title: "Payment links",
                  desc: "Share direct links via chat, SMS, or email for quick frictionless checkouts without friction.",
                },
              ].map((item, index) => {
                const isActive = activeFeatureIndex === index;
                return (
                  <div
                    key={item.title}
                    onClick={() => setActiveFeatureIndex(index)}
                    className={cn(
                      "cursor-pointer rounded-2xl p-5 transition-all border",
                      isActive
                        ? "bg-[#FAF8F5] border-[#E8E8E8] shadow-xs"
                        : "border-transparent hover:bg-neutral-50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className={cn("text-base font-bold", isActive ? "text-[#0069FF]" : "text-[#0B1A2C]")}>
                        {item.title}
                      </h3>
                      <ExternalLink className={cn("size-4 transition-transform", isActive ? "text-[#0069FF] translate-x-0.5" : "text-gray-400")} />
                    </div>
                    <p className="mt-2 text-xs sm:text-sm text-[#4A5568] leading-relaxed">
                      {item.desc}
                    </p>
                    {isActive && (
                      <motion.div
                        layoutId="activeFeatureBar"
                        className="mt-3 h-0.5 w-full bg-[#0069FF] rounded-full"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 7. Connected Tool Ecosystem Ribbon */}
      <section className="px-3 sm:px-6 py-20 bg-[#FAF8F5]">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="font-serif text-4xl sm:text-5xl font-normal text-[#0B1A2C]">
            Connect Slotly with your favorite tools
          </h2>
          <p className="mt-3 text-base text-[#4A5568]">
            Our extensive list of integrations makes Slotly flexible across every team workflow.
          </p>
          <Link
            to="/book/northstar-health"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#0069FF] hover:underline"
          >
            View all integrations <ArrowRight className="size-4" />
          </Link>

          {/* Connected Icon Track with Real Brand SVGs */}
          <div className="mt-12 overflow-hidden py-4">
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 max-w-4xl mx-auto">
              {[
                {
                  name: "Google Calendar",
                  icon: (
                    <svg viewBox="0 0 48 48" className="size-7" aria-hidden="true">
                      <path fill="#1a73e8" d="M38 44H10a6 6 0 0 1-6-6V10a6 6 0 0 1 6-6h28a6 6 0 0 1 6 6v28a6 6 0 0 1-6 6z" />
                      <path fill="#ea4335" d="M38 4H10A6 6 0 0 0 4 10v5h40v-5a6 6 0 0 0-6-6z" />
                      <rect width="32" height="23" x="8" y="17" fill="#fff" rx="2" />
                      <text x="24" y="34" fill="#1a73e8" fontSize="17" fontWeight="bold" textAnchor="middle" fontFamily="system-ui, sans-serif">31</text>
                      <circle cx="14" cy="9.5" r="2.2" fill="#fff" />
                      <circle cx="34" cy="9.5" r="2.2" fill="#fff" />
                    </svg>
                  ),
                },
                {
                  name: "Google Meet",
                  icon: (
                    <svg viewBox="0 0 24 24" className="size-7" aria-hidden="true">
                      <path fill="#00832d" d="M3 7.5A2.5 2.5 0 0 1 5.5 5h7A2.5 2.5 0 0 1 15 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 3 16.5v-9z" />
                      <path fill="#0066da" d="M15 10l6-4.5v13L15 14v-4z" />
                      <path fill="#e1382b" d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l-6 6V7.5z" />
                      <path fill="#fbbc04" d="M3 16.5A2.5 2.5 0 0 0 5.5 19H9l-6-6v3.5z" />
                      <path fill="#26a69a" d="M9 5h3.5A2.5 2.5 0 0 1 15 7.5V11L9 5z" />
                    </svg>
                  ),
                },
                {
                  name: "Zoom",
                  icon: (
                    <svg viewBox="0 0 24 24" className="size-7" aria-hidden="true">
                      <rect width="24" height="24" rx="5.5" fill="#2D8CFF" />
                      <path fill="#fff" d="M4.5 9a1.5 1.5 0 0 1 1.5-1.5h7a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5V9zm11 2.2 3.2-2.4a.6.6 0 0 1 .8.5v5.4a.6.6 0 0 1-.8.5L15.5 12.8v-1.6z" />
                    </svg>
                  ),
                },
                {
                  name: "Microsoft Teams",
                  icon: (
                    <svg viewBox="0 0 32 32" className="size-7" aria-hidden="true">
                      <ellipse cx="21.5" cy="8.5" rx="3.5" ry="3.5" fill="#505ac9" />
                      <path d="M26 14h-9a2 2 0 0 0-2 2v6.5a1.5 1.5 0 0 0 1.5 1.5H27a2 2 0 0 0 2-2V17a3 3 0 0 0-3-3z" fill="#505ac9" />
                      <ellipse cx="12" cy="9" rx="4.5" ry="4.5" fill="#7b83eb" />
                      <rect x="2" y="11" width="16" height="16" rx="3" fill="#464eb8" />
                      <path d="M7 16h6v2.2H10.1v6.8H7.9v-6.8H7V16z" fill="#fff" />
                    </svg>
                  ),
                },
                {
                  name: "Outlook",
                  icon: (
                    <svg viewBox="0 0 32 32" className="size-7" aria-hidden="true">
                      <path d="M18 6l11 4.5v11L18 26z" fill="#0072c6" />
                      <path d="M18 6l11 4.5-11 5-11-5z" fill="#0078d4" opacity="0.8" />
                      <path d="M7 10.5L18 16v10L7 21.5z" fill="#106ebe" />
                      <rect x="3" y="10" width="13" height="13" rx="2" fill="#0078d4" />
                      <circle cx="9.5" cy="16.5" r="3.2" fill="none" stroke="#fff" strokeWidth="1.8" />
                    </svg>
                  ),
                },
                {
                  name: "Salesforce",
                  icon: (
                    <svg viewBox="0 0 24 24" className="size-7" aria-hidden="true">
                      <path fill="#00A1E0" d="M10 4.5a5 5 0 0 1 4.7 3.3 4.2 4.2 0 0 1 3.8 2.2 4.5 4.5 0 0 1-.5 9H5.5a4.5 4.5 0 0 1-.8-8.9 5.5 5.5 0 0 1 5.3-5.6z" />
                      <path fill="#fff" d="M8.8 11.2c.2-.5.5-.8.9-1 .4-.2 1-.3 1.6-.3.6 0 1.1.1 1.5.3.4.2.7.5.8 1l-.8.4c-.1-.3-.3-.6-.6-.7-.3-.1-.6-.2-1-.2-.4 0-.8.1-1.1.3-.3.2-.4.5-.4.8 0 .3.1.5.3.7.2.2.6.3 1.2.5.7.2 1.2.4 1.5.7.3.3.5.7.5 1.2 0 .5-.2 1-.6 1.3-.4.3-1 .5-1.7.5-.7 0-1.3-.2-1.7-.5-.4-.3-.7-.8-.8-1.4l.9-.3c.1.4.3.7.6.9.3.2.7.3 1.1.3.5 0 .8-.1 1.1-.3.3-.2.4-.5.4-.8 0-.3-.1-.5-.4-.7-.2-.2-.6-.3-1.2-.5-.7-.2-1.2-.4-1.5-.7-.3-.3-.5-.7-.5-1.2 0-.5.2-.9.5-1.2z" />
                    </svg>
                  ),
                },
                {
                  name: "Slack",
                  icon: (
                    <svg viewBox="0 0 24 24" className="size-7" aria-hidden="true">
                      <path fill="#36C5F0" d="M6 15a2.5 2.5 0 1 1-2.5-2.5H6v2.5zm1.2 0a2.5 2.5 0 1 1 5 0v6a2.5 2.5 0 1 1-5 0v-6z" />
                      <path fill="#2EB67D" d="M9 6a2.5 2.5 0 1 1 2.5-2.5V6H9zm0 1.2a2.5 2.5 0 1 1 0 5H3a2.5 2.5 0 1 1 0-5h6z" />
                      <path fill="#ECB22E" d="M18 9a2.5 2.5 0 1 1 2.5 2.5H18V9zm-1.2 0a2.5 2.5 0 1 1-5 0V3a2.5 2.5 0 1 1 5 0v6z" />
                      <path fill="#E01E5A" d="M15 18a2.5 2.5 0 1 1-2.5 2.5V18h2.5zm0-1.2a2.5 2.5 0 1 1 0-5h6a2.5 2.5 0 1 1 0 5h-6z" />
                    </svg>
                  ),
                },
                {
                  name: "Stripe",
                  icon: (
                    <svg viewBox="0 0 24 24" className="size-7" aria-hidden="true">
                      <rect width="24" height="24" rx="5" fill="#635BFF" />
                      <path fill="#fff" d="M13.8 9.6c0-.7-.6-1-1.5-1-.9 0-2.1.3-3 .8v-2.3c1-.4 2.1-.6 3.2-.6 2.6 0 4.2 1.3 4.2 3.6 0 3.5-4.8 3-4.8 4.5 0 .8.7 1.1 1.7 1.1 1.1 0 2.4-.4 3.4-1v2.3c-1.1.5-2.3.7-3.5.7-2.7 0-4.4-1.3-4.4-3.6 0-3.8 4.7-3.1 4.7-4.5z" />
                    </svg>
                  ),
                },
                {
                  name: "PayPal",
                  icon: (
                    <svg viewBox="0 0 24 24" className="size-7" aria-hidden="true">
                      <path fill="#003087" d="M7.5 21l2.8-17.5h5.5c3.2 0 5.2 1.6 4.7 4.7-.5 3.3-2.7 5.1-5.9 5.1h-2.4l-1.3 7.7H7.5z" />
                      <path fill="#0079C1" d="M10.8 13.3h2.3c3.2 0 5.4-1.8 5.9-5.1.2-1.3 0-2.4-.7-3.2-.5 2.7-2.6 4.6-5.5 4.6h-2.3l-1.6 9.4h2.2l1-5.7z" />
                      <path fill="#001C64" d="M10.8 13.3l-.7 4.2h2.2l.6-3.8c-.3 0-.6-.1-.8-.1l-1.3-.3z" opacity="0.3" />
                    </svg>
                  ),
                },
                {
                  name: "HubSpot",
                  icon: (
                    <svg viewBox="0 0 24 24" className="size-7" aria-hidden="true">
                      <circle cx="16.5" cy="6.5" r="2.5" fill="#FF7A59" />
                      <path fill="#FF7A59" d="M15.2 7.7l-4.4 3.1a3.5 3.5 0 0 0-1.8-.8V6.5a1.5 1.5 0 1 0-2 0V10a3.5 3.5 0 1 0 4.6 4.8l4.4 3.1a2.5 2.5 0 1 0 1.2-1.6l-4.4-3.1a3.5 3.5 0 0 0 0-2.4l4.4-3.1a2.5 2.5 0 0 0-2-0.1z" />
                    </svg>
                  ),
                },
                {
                  name: "Zapier",
                  icon: (
                    <svg viewBox="0 0 24 24" className="size-7" aria-hidden="true">
                      <rect width="24" height="24" rx="5" fill="#FF4F00" />
                      <path d="M12 4v16m-8-8h16m-2.8-5.6L6.8 17.6m0-11.2l10.4 10.4" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  ),
                },
                {
                  name: "OpenAI",
                  icon: (
                    <svg viewBox="0 0 24 24" className="size-7" aria-hidden="true">
                      <path fill="#10A37F" d="M22.28 9.77a5.98 5.98 0 0 0-.52-4.95 6.07 6.07 0 0 0-6.54-2.85A6.05 6.05 0 0 0 10.5 0a6.04 6.04 0 0 0-5.78 4.3 6.02 6.02 0 0 0-4 2.92 6.05 6.05 0 0 0 .74 6.94 6 6 0 0 0 .52 4.95 6.07 6.07 0 0 0 6.54 2.85A6.02 6.02 0 0 0 13.24 24a6.04 6.04 0 0 0 5.78-4.3 6.02 6.02 0 0 0 4-2.92 6.06 6.06 0 0 0-.74-7.01zM13.24 22.4a4.48 4.48 0 0 1-2.88-1.04l.15-.08 4.78-2.76a.8.8 0 0 0 .4-.68v-6.73l2.02 1.17a.07.07 0 0 1 .04.05v5.57a4.5 4.5 0 0 1-4.51 4.5zm-8.8-4.14a4.47 4.47 0 0 1-.54-3.02l.14.09 4.78 2.76a.78.78 0 0 0 .79 0l5.83-3.37v2.33a.08.08 0 0 1-.03.06l-4.83 2.79a4.5 4.5 0 0 1-6.14-1.64zM3.48 8.08a4.47 4.47 0 0 1 2.34-1.98v5.7a.8.8 0 0 0 .39.68l5.83 3.37-2.02 1.17a.08.08 0 0 1-.07 0l-4.83-2.79A4.5 4.5 0 0 1 3.48 8.08zm14.33 3.01L12 7.72l5.83-3.37a.8.8 0 0 0 .39-.68V.65a4.5 4.5 0 0 1 2.34 1.98 4.47 4.47 0 0 1 .54 3.02l-.14-.08-4.78-2.76zm2.71-4.57v2.33a.08.08 0 0 1-.03.06l-4.83 2.79a4.5 4.5 0 0 1-6.14-1.64 4.47 4.47 0 0 1-.54-3.02l.14.09 4.78 2.76a.78.78 0 0 0 .79 0l5.83-3.37zm-9.35 4.22l2.35 1.36-2.35 1.36-2.35-1.36 2.35-1.36z" />
                    </svg>
                  ),
                },
              ].map((tool, i) => (
                <div key={tool.name} className="flex items-center gap-2">
                  <div
                    className="flex size-14 items-center justify-center rounded-2xl bg-white shadow-md border border-[#E8E8E8] p-2.5 transition-all hover:-translate-y-1 hover:shadow-lg"
                    title={tool.name}
                  >
                    {tool.icon}
                  </div>
                  {i < 11 && <span className="hidden sm:inline-block h-0.5 w-3 bg-[#D4E8FC] rounded-full" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 8. Testimonial Carousel with Connected Pill Avatars (Frame 14) */}
      <section className="px-3 sm:px-6 py-20 bg-gradient-to-b from-[#FAF8F5] to-white">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[32px] bg-gradient-to-r from-blue-100/50 via-purple-100/40 to-emerald-100/50 p-6 sm:p-12 border border-[#E8E8E8]">
            <div className="mx-auto max-w-4xl flex flex-col md:flex-row items-center gap-8 rounded-3xl bg-white p-8 sm:p-12 shadow-xl border border-white">
              <div className="flex-1 space-y-4">
                <span className="text-3xl sm:text-4xl font-extrabold text-[#0069FF]">
                  3 to 5 hours saved per week
                </span>
                <p className="font-serif text-2xl sm:text-3xl text-[#0B1A2C] leading-snug italic">
                  "Slotly takes all the pain out of client appointment booking and calendar coordination."
                </p>
                <div>
                  <p className="text-sm font-bold text-[#0B1A2C]">Lizzie Lewis</p>
                  <p className="text-xs text-gray-500">Founder at Kitty of Angels</p>
                </div>
              </div>

              {/* Portrait Pill */}
              <div className="shrink-0">
                <div className="relative h-64 w-48 rounded-[36px] overflow-hidden bg-slate-100 shadow-md border-4 border-white flex items-center justify-center">
                  <img
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80"
                    alt="Lizzie Lewis"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute bottom-3 left-3 right-3 rounded-xl bg-black/60 backdrop-blur-xs px-2 py-1 text-center text-[10px] font-bold text-white">
                    Verified Customer
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Pricing Section */}
      <section id="pricing" className="px-3 sm:px-6 py-24 bg-[#FAF8F5]">
        <div className="mx-auto max-w-7xl">
          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#E8F3FF] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#0069FF]">
              <Sparkles className="size-3" /> Simple, transparent pricing
            </span>
            <h2 className="mt-4 font-serif text-4xl sm:text-5xl font-normal text-[#0B1A2C]">
              Pick the plan that fits your business
            </h2>
            <p className="mt-3 text-base text-[#4A5568] max-w-2xl mx-auto">
              Start free. Scale as you grow. No hidden fees, no long-term contracts — cancel anytime.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {/* Solo Plan */}
            <div className="relative rounded-3xl border border-[#E8E8E8] bg-white p-8 flex flex-col shadow-sm hover:shadow-lg transition-shadow">
              <div className="mb-6">
                <div className="size-10 rounded-2xl bg-[#F0F4FF] flex items-center justify-center mb-4">
                  <Calendar className="size-5 text-[#0069FF]" />
                </div>
                <h3 className="text-xl font-bold text-[#0B1A2C]">Solo</h3>
                <p className="mt-1 text-sm text-[#4A5568]">For individuals and freelancers</p>
              </div>
              <div className="mb-6">
                <span className="text-5xl font-extrabold text-[#0B1A2C]">Free</span>
                <span className="ml-2 text-sm text-[#718096]">/forever</span>
              </div>
              <ul className="space-y-3 flex-1 mb-8">
                {["1 booking page","Unlimited appointments","Google & Outlook sync","Automated email reminders","Basic analytics"].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-[#0B1A2C]">
                    <span className="shrink-0 size-4.5 rounded-full bg-emerald-50 flex items-center justify-center">
                      <Check className="size-2.5 text-emerald-600" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/book/northstar-health" className="mt-auto inline-flex h-11 items-center justify-center rounded-full border-2 border-[#0B1A2C] text-sm font-bold text-[#0B1A2C] hover:bg-[#0B1A2C] hover:text-white transition-all">
                Get started free
              </Link>
            </div>

            {/* Team Plan — Most Popular */}
            <div className="relative rounded-3xl bg-[#0B1A2C] p-8 flex flex-col shadow-2xl scale-[1.02] z-10">
              <div className="absolute top-5 right-5">
                <span className="rounded-full bg-[#0069FF] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  Most popular
                </span>
              </div>
              <div className="mb-6">
                <div className="size-10 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
                  <Zap className="size-5 text-[#60A5FA]" />
                </div>
                <h3 className="text-xl font-bold text-white">Team</h3>
                <p className="mt-1 text-sm text-white/60">For growing teams & clinics</p>
              </div>
              <div className="mb-6">
                <span className="text-5xl font-extrabold text-white">$29</span>
                <span className="ml-2 text-sm text-white/60">/month per seat</span>
              </div>
              <ul className="space-y-3 flex-1 mb-8">
                {["Unlimited booking pages","Round-robin & multi-host","Real-time calendar sync","SMS & WhatsApp reminders","Meeting packages & bundles","Stripe & PayPal payments","Advanced analytics","Priority support"].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-white">
                    <span className="shrink-0 size-4.5 rounded-full bg-[#0069FF]/20 flex items-center justify-center">
                      <Check className="size-2.5 text-[#60A5FA]" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/book/northstar-health" className="mt-auto inline-flex h-11 items-center justify-center rounded-full bg-[#0069FF] text-sm font-bold text-white hover:bg-[#0056D6] transition-all shadow-md">
                Start free 14-day trial
              </Link>
              <p className="mt-3 text-center text-[11px] text-white/40">No credit card required</p>
            </div>

            {/* Operations Plan */}
            <div className="relative rounded-3xl border border-[#E8E8E8] bg-white p-8 flex flex-col shadow-sm hover:shadow-lg transition-shadow">
              <div className="mb-6">
                <div className="size-10 rounded-2xl bg-[#F5F0FF] flex items-center justify-center mb-4">
                  <CreditCard className="size-5 text-[#7C3AED]" />
                </div>
                <h3 className="text-xl font-bold text-[#0B1A2C]">Operations</h3>
                <p className="mt-1 text-sm text-[#4A5568]">For large clinics & enterprises</p>
              </div>
              <div className="mb-6">
                <span className="text-5xl font-extrabold text-[#0B1A2C]">$79</span>
                <span className="ml-2 text-sm text-[#718096]">/month per seat</span>
              </div>
              <ul className="space-y-3 flex-1 mb-8">
                {["Everything in Team","Custom domain & branding","HIPAA-aware workflows","Intake forms & e-signatures","Bulk booking & waitlists","SLA-backed 99.9% uptime","Dedicated account manager","SSO & SAML integration"].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-[#0B1A2C]">
                    <span className="shrink-0 size-4.5 rounded-full bg-purple-50 flex items-center justify-center">
                      <Check className="size-2.5 text-[#7C3AED]" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/login" className="mt-auto inline-flex h-11 items-center justify-center rounded-full border-2 border-[#7C3AED] text-sm font-bold text-[#7C3AED] hover:bg-[#7C3AED] hover:text-white transition-all">
                Contact sales
              </Link>
            </div>
          </div>

          {/* Trust signals */}
          <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
            {["No contracts, cancel anytime","Free migration assistance","SOC 2 Type II certified","GDPR & HIPAA compliant"].map((t) => (
              <div key={t} className="flex items-center gap-2 text-sm text-[#4A5568]">
                <Check className="size-3.5 text-emerald-500 shrink-0" />
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. Bottom CTA Section */}
      <section className="px-3 sm:px-6 py-16 text-center">
        <div className="mx-auto max-w-4xl space-y-6">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0069FF]">Get Started Today</span>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-normal text-[#0B1A2C]">
            From the first appointment to the follow-up
          </h2>
          <p className="mx-auto max-w-2xl text-base sm:text-lg text-[#4A5568]">
            All your appointments and scheduling, handled in one place. Book time, sync team calendars in real time, and eliminate the back-and-forth.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/book/northstar-health"
              className="inline-flex h-12 items-center justify-center rounded-full bg-[#0069FF] px-8 text-sm font-semibold text-white shadow-md hover:bg-[#0056D6] transition-all"
            >
              Book an appointment
            </Link>
            <Link
              to="/login"
              className="inline-flex h-12 items-center justify-center rounded-full border border-[#0B1A2C] px-8 text-sm font-semibold text-[#0B1A2C] hover:bg-neutral-50 transition-all"
            >
              Sign in to workspace
            </Link>
          </div>
        </div>
      </section>

      {/* 10. Footer */}
      <footer className="bg-[#0B1A2C] text-white pt-16 pb-12 px-5 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-5 border-b border-white/10 pb-12">
            <div className="space-y-4 md:col-span-1">
              <Link to="/" className="inline-flex items-center" title="Slotly">
                <SlotlyLogo variant="full" mode="white" className="h-8 w-auto" />
              </Link>
              <p className="text-xs text-white/60 leading-relaxed">
                The modern multi-tenant platform for clinics, salons, and teams.
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">Features</p>
              <ul className="space-y-2 text-xs text-white/70">
                <li><Link to="/book/northstar-health" className="hover:text-white">Security</Link></li>
                <li><Link to="/login" className="hover:text-white">Customizable availability</Link></li>
                <li><Link to="/admin" className="hover:text-white">Event types</Link></li>
                <li><Link to="/admin" className="hover:text-white">Meeting polls</Link></li>
                <li><Link to="/admin" className="hover:text-white">Reminders & follow up</Link></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">Solutions</p>
              <ul className="space-y-2 text-xs text-white/70">
                <li><Link to="/book/northstar-health" className="hover:text-white">For individuals</Link></li>
                <li><Link to="/login" className="hover:text-white">For teams</Link></li>
                <li><Link to="/login" className="hover:text-white">For large enterprises</Link></li>
                <li><Link to="/book/northstar-health" className="hover:text-white">Clinical & healthcare</Link></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">Support</p>
              <ul className="space-y-2 text-xs text-white/70">
                <li><Link to="/login" className="hover:text-white">Help center</Link></li>
                <li><Link to="/login" className="hover:text-white">Learning hub</Link></li>
                <li><Link to="/book/northstar-health" className="hover:text-white">Contact support</Link></li>
                <li><Link to="/book/northstar-health" className="hover:text-white">Contact sales</Link></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">Company</p>
              <ul className="space-y-2 text-xs text-white/70">
                <li><Link to="/login" className="hover:text-white">About us</Link></li>
                <li><span className="inline-flex items-center gap-1 hover:text-white">Careers <span className="rounded-full bg-[#0069FF] px-1.5 py-0.2 text-[9px] text-white">We're hiring!</span></span></li>
                <li><Link to="/login" className="hover:text-white">Become a partner</Link></li>
                <li><Link to="/login" className="hover:text-white">Blog</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
            <p>© 2026 Slotly, Inc. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link to="/login" className="hover:text-white">Privacy Policy</Link>
              <Link to="/login" className="hover:text-white">Terms of Service</Link>
              <Link to="/login" className="hover:text-white">Security Notice</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* 11. Floating AI Assistant Chat Widget (Figma Design with Animated SVG) */}
      <AiChatWidget />
    </div>
  );
}


/* ─────────────────────────────────────────────────────────────────────────────
 * Calendly-style Sticky Scroll Feature Showcase
 * Left: pinned card that crossfades on scroll · Right: scrolling feature steps
 * Background gradient morphs smoothly to each card's accent palette
 * ───────────────────────────────────────────────────────────────────────────── */

const SHOWCASE_FEATURES = [
  {
    tag: "AI Scheduling",
    tagColor: "text-[#0069FF] bg-[#E8F3FF]",
    title: "Your 24/7 AI scheduling assistant",
    body: "Add Slotly AI to any email thread and it coordinates scheduling on your behalf — no tool switching, no loss of control.",
    cta: "Learn about Slotly AI",
    href: "/book/northstar-health",
    // gradient: from → via → to (Tailwind inline style values)
    gradFrom: "#EBF5FF",
    gradMid:  "#F0F7FF",
    gradTo:   "#E8F3EE",
    card: (
      <div className="rounded-2xl bg-white shadow-2xl border border-gray-100 p-6 space-y-4">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
          <div className="size-9 rounded-full bg-[#0069FF]/10 text-[#0069FF] grid place-items-center font-bold text-xs shrink-0">DM</div>
          <div>
            <p className="text-xs font-bold text-[#0B1A2C]">Dominic Mills</p>
            <p className="text-[11px] text-gray-400">To: Slotly AI, Tori Mathers</p>
          </div>
        </div>
        <div className="rounded-xl bg-[#F0F7FF] p-3.5 border border-[#D9EAFF]">
          <p className="text-xs font-semibold text-[#0069FF] flex items-center gap-1.5">
            <Sparkles className="size-3" /> Slotly AI replied
          </p>
          <p className="mt-1.5 text-xs text-[#0B1A2C] leading-relaxed">
            Happy to set up a call. Here are slots you're both free:
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {["Mon 10:00 AM", "Tue 2:30 PM", "Wed 3:00 PM"].map((t) => (
              <span key={t} className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-[#0069FF] shadow-sm border border-blue-200">{t}</span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="size-5 rounded-full bg-emerald-100 grid place-items-center">
            <Check className="size-3 text-emerald-600" />
          </div>
          Confirmed · Google Meet link sent
        </div>
      </div>
    ),
  },
  {
    tag: "Payments",
    tagColor: "text-emerald-700 bg-emerald-50",
    title: "Flexible, built-in payment tools",
    body: "Charge upfront for bookings, sell multi-session bundles, and send professional invoices — all without a separate billing tool.",
    cta: "Explore payment features",
    href: "/login",
    gradFrom: "#E6F4EA",
    gradMid:  "#F0FFF4",
    gradTo:   "#EBF5FF",
    card: (
      <div className="rounded-2xl bg-white shadow-2xl border border-gray-100 p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <p className="text-xs font-bold text-[#0B1A2C]">Initial Consultation</p>
            <p className="text-[11px] text-gray-400">Ibrahim Benkacem · 45 min</p>
          </div>
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">Paid</span>
        </div>
        <div className="flex items-center rounded-xl border border-gray-200 px-4 py-3 gap-2">
          <span className="text-sm font-bold text-gray-400">$</span>
          <span className="text-2xl font-extrabold text-[#0B1A2C]">150.00</span>
          <span className="ml-auto text-xs text-gray-400">USD</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500 font-medium">Processor</span>
          <span className="font-bold text-[#0069FF] flex items-center gap-1">Stripe <Check className="size-3 text-emerald-600" /></span>
        </div>
        <div className="flex items-center justify-between text-xs border-t border-gray-100 pt-3">
          <span className="text-gray-500">Apple Pay · Google Pay · Card</span>
          <span className="text-emerald-600 font-bold">✓ Ready</span>
        </div>
      </div>
    ),
  },
  {
    tag: "Calendar Sync",
    tagColor: "text-orange-700 bg-orange-50",
    title: "Multi-calendar real-time sync",
    body: "Connect Google, Outlook, and iCloud. The moment a personal event appears, Slotly closes that slot instantly — zero double-bookings.",
    cta: "See how sync works",
    href: "/login",
    gradFrom: "#FFF7ED",
    gradMid:  "#FFF3E0",
    gradTo:   "#FFFDE7",
    card: (
      <div className="rounded-2xl bg-white shadow-2xl border border-gray-100 p-6 space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-gray-500 pb-2 border-b border-gray-100">
          <span>Synced Calendars</span>
          <span className="text-emerald-600">3 Active</span>
        </div>
        {[
          { name: "Google Calendar (Work)", color: "#1a73e8" },
          { name: "Outlook (Clinic)",       color: "#0078d4" },
          { name: "iCloud (Personal)",      color: "#555" },
        ].map((cal) => (
          <div key={cal.name} className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5">
            <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: cal.color }} />
            <span className="flex-1 text-xs font-semibold text-gray-800">{cal.name}</span>
            <Check className="size-3.5 text-emerald-600 shrink-0" />
          </div>
        ))}
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs font-medium text-amber-800 flex items-center gap-2">
          <Clock className="size-3.5 shrink-0" />
          Conflict auto-blocked · Mon 2–4 PM
        </div>
      </div>
    ),
  },
  {
    tag: "AI Notetaker",
    tagColor: "text-purple-700 bg-purple-50",
    title: "Never lose a meeting decision",
    body: "Slotly's AI Notetaker records, transcribes, and extracts key actions — then emails every attendee a structured recap within 60 seconds.",
    cta: "Explore Notetaker",
    href: "/login",
    gradFrom: "#F5F3FF",
    gradMid:  "#FAF5FF",
    gradTo:   "#EDE9FE",
    card: (
      <div className="rounded-2xl bg-white shadow-2xl border border-gray-100 p-6 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-purple-700 border-b border-gray-100 pb-3">
          <Mic className="size-3.5 text-red-500 animate-pulse" />
          Recording · 32:15
        </div>
        <div className="rounded-xl bg-gray-50 p-3.5 space-y-2">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Key Takeaway</p>
          <p className="text-xs text-[#0B1A2C] leading-relaxed">
            Dr. Benkacem approved a follow-up on Friday at 2:00 PM. Patient will review lab results beforehand.
          </p>
        </div>
        <div className="space-y-1.5">
          {["Schedule follow-up: Fri 2:00 PM", "Send lab results reminder", "Email recap to patient"].map((a) => (
            <div key={a} className="flex items-center gap-2 text-xs text-[#0B1A2C]">
              <span className="size-4 rounded-full bg-purple-100 grid place-items-center shrink-0">
                <Check className="size-2.5 text-purple-700" />
              </span>
              {a}
            </div>
          ))}
        </div>
      </div>
    ),
  },
] as const;

function StickyScrollShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    SHOWCASE_FEATURES.forEach((_, i) => {
      const el = stepRefs.current[i];
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveIndex(i);
          }
        },
        { rootMargin: "-30% 0px -30% 0px", threshold: 0.1 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const active = SHOWCASE_FEATURES[activeIndex];

  const scrollToStep = (idx: number) => {
    setActiveIndex(idx);
    stepRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <section ref={sectionRef} className="relative overflow-hidden py-12 lg:py-20 transition-all">
      {/* Morphing smooth gradient backgrounds (layered opacity crossfade) */}
      {SHOWCASE_FEATURES.map((feat, i) => (
        <div
          key={i}
          className={cn(
            "absolute inset-0 transition-opacity duration-1000 ease-in-out pointer-events-none",
            i === activeIndex ? "opacity-100" : "opacity-0"
          )}
          style={{
            background: `radial-gradient(100% 120% at 20% 30%, ${feat.gradFrom} 0%, ${feat.gradMid} 50%, ${feat.gradTo} 100%)`,
          }}
        />
      ))}

      {/* Decorative ambient lighting */}
      <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-blue-400/15 to-indigo-300/10 rounded-full blur-3xl pointer-events-none" />

      {/* Section header */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-12 pb-8 text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-[#0069FF]">Why teams choose Slotly</span>
        <h2 className="mt-3 font-serif text-4xl sm:text-5xl font-normal text-[#0B1A2C] leading-tight">
          Everything your scheduling<br className="hidden sm:inline" /> workflow needs
        </h2>
        <p className="mt-4 text-base text-[#4A5568] max-w-xl mx-auto">
          Streamline bookings, eliminate email back-and-forth, collect upfront payments, and summarize every session automatically.
        </p>
      </div>

      {/* Two-column sticky layout */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 pb-24 lg:grid lg:grid-cols-2 lg:gap-16 xl:gap-24 lg:items-start">

        {/* LEFT — sticky card panel */}
        <div className="hidden lg:block sticky top-28 self-start pt-8">
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -24, scale: 0.96 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-md mx-auto"
              >
                {active.card}
              </motion.div>
            </AnimatePresence>

            {/* Dot progress indicator */}
            <div className="mt-8 flex items-center justify-center gap-2.5">
              {SHOWCASE_FEATURES.map((feat, i) => (
                <button
                  key={i}
                  onClick={() => scrollToStep(i)}
                  className={cn(
                    "rounded-full transition-all duration-300 cursor-pointer",
                    i === activeIndex
                      ? "w-8 h-2.5 bg-[#0069FF]"
                      : "w-2.5 h-2.5 bg-[#0069FF]/20 hover:bg-[#0069FF]/50"
                  )}
                  aria-label={`Go to ${feat.tag}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — scrolling text steps */}
        <div className="space-y-4 pt-4 lg:pt-8">
          {SHOWCASE_FEATURES.map((feat, i) => {
            const isCurrent = i === activeIndex;
            return (
              <div
                key={i}
                ref={(el) => { stepRefs.current[i] = el; }}
                onClick={() => scrollToStep(i)}
                className={cn(
                  "flex flex-col justify-center min-h-[55vh] py-12 lg:py-20 cursor-pointer transition-all duration-500 rounded-3xl lg:px-6",
                  isCurrent
                    ? "opacity-100 scale-100"
                    : "opacity-40 hover:opacity-75 scale-[0.98]"
                )}
              >
                {/* Mobile card (visible only on small screens) */}
                <div className="lg:hidden mb-8 max-w-md mx-auto w-full">{feat.card}</div>

                <div className="space-y-5 border-l-2 pl-6 transition-colors duration-500"
                  style={{
                    borderColor: isCurrent ? "#0069FF" : "transparent",
                  }}
                >
                  <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold", feat.tagColor)}>
                    {feat.tag}
                  </span>
                  <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0B1A2C] leading-tight">
                    {feat.title}
                  </h3>
                  <p className="text-base text-[#4A5568] leading-relaxed max-w-lg">
                    {feat.body}
                  </p>
                  <Link
                    to={feat.href}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-2 text-sm font-bold text-[#0069FF] hover:underline pt-2"
                  >
                    {feat.cta} <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}


function WorkflowStageCard({
  number,
  title,
  desc,
  items,
  isActive,
  onClick,
}: {
  number: string;
  title: string;
  desc: string;
  items: string[];
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-3xl p-6 transition-all border",
        isActive
          ? "bg-white border-[#0069FF] shadow-lg scale-102"
          : "bg-white/80 border-[#E8E8E8] hover:bg-white hover:shadow-md"
      )}
    >
      <span className="text-xs font-bold text-[#0069FF]">{number}</span>
      <h3 className="mt-2 text-xl font-bold text-[#0B1A2C]">{title}</h3>
      <p className="mt-2 text-xs text-[#4A5568] leading-relaxed min-h-12">{desc}</p>

      <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
        {items.map((it, idx) => (
          <div key={idx} className="flex items-start gap-2 text-xs text-[#0B1A2C]">
            <Check className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <span>{it}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
