import {
  ArrowRight,
  Calendar,
  Check,
  CreditCard,
  Leaf,
  LogIn,
  Menu,
  Mic,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AiChatWidget } from "../components/ai-chat-widget";
import { SlotlyLogo } from "../components/slotly-logo";
import { cn } from "../lib/cn";

const showcaseTabs = ["ai", "payments", "sync", "notes"] as const;
const lifecycleStages = [0, 1, 2, 3] as const;
const billingFeatures = [
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
];
const showcaseGradients = [
  "linear-gradient(135deg, #d9eafe 0%, #ede9fe 52%, #d1fae5 100%)",
  "linear-gradient(135deg, #d7f5ee 0%, #d9eafe 48%, #c7f3e6 100%)",
  "linear-gradient(135deg, #fef3c7 0%, #d9eafe 48%, #dcfce7 100%)",
  "linear-gradient(135deg, #ddd6fe 0%, #c4b5fd 48%, #d1fae5 100%)",
];

export function LandingPage() {
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeShowcaseTab, setActiveShowcaseTab] = useState<"ai" | "payments" | "sync" | "notes">("ai");
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(0);
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);
  const showcaseSectionRef = useRef<HTMLElement>(null);
  const lifecycleSectionRef = useRef<HTMLElement>(null);
  const billingSectionRef = useRef<HTMLElement>(null);

  const scrollToShowcaseStep = (step: number) => {
    setActiveShowcaseTab(showcaseTabs[step]);

    const section = showcaseSectionRef.current;
    if (!section) return;

    const scrollableHeight = section.offsetHeight - window.innerHeight;
    if (scrollableHeight <= 0) return;

    const stickyEl = section.firstElementChild as HTMLElement | null;
    const stickyHeight = stickyEl ? stickyEl.offsetHeight : 620;
    const startOffset = Math.max(window.innerHeight - stickyHeight, 180);

    const targetProgress = (step + 0.1) / showcaseTabs.length;
    const targetTop = window.scrollY + section.getBoundingClientRect().top - startOffset + targetProgress * scrollableHeight;
    window.scrollTo({ top: targetTop, behavior: "smooth" });
  };

  useEffect(() => {
    const updateShowcaseStep = () => {
      const section = showcaseSectionRef.current;
      if (!section) return;

      const scrollableHeight = section.offsetHeight - window.innerHeight;
      if (scrollableHeight <= 0) return;

      const stickyEl = section.firstElementChild as HTMLElement | null;
      const stickyHeight = stickyEl ? stickyEl.offsetHeight : 620;
      // Start card scrolling as soon as the section is fully in view, well before reaching the header
      const startOffset = Math.max(window.innerHeight - stickyHeight, 180);

      const scrollProgress = (startOffset - section.getBoundingClientRect().top) / scrollableHeight;
      const progress = Math.min(Math.max(scrollProgress, 0), 0.9999);
      setActiveShowcaseTab(showcaseTabs[Math.floor(progress * showcaseTabs.length)]);
    };

    window.addEventListener("scroll", updateShowcaseStep, { passive: true });
    window.addEventListener("resize", updateShowcaseStep);
    updateShowcaseStep();

    return () => {
      window.removeEventListener("scroll", updateShowcaseStep);
      window.removeEventListener("resize", updateShowcaseStep);
    };
  }, []);

  const scrollToLifecycleStep = (step: number) => {
    setActiveWorkflowStep(step);

    const section = lifecycleSectionRef.current;
    if (!section) return;

    const scrollableHeight = section.offsetHeight - window.innerHeight;
    if (scrollableHeight <= 0) return;

    const targetTop = window.scrollY + section.getBoundingClientRect().top + (scrollableHeight * step) / lifecycleStages.length;
    window.scrollTo({ top: targetTop, behavior: "smooth" });
  };

  useEffect(() => {
    const updateLifecycleStep = () => {
      const section = lifecycleSectionRef.current;
      if (!section) return;

      const scrollableHeight = section.offsetHeight - window.innerHeight;
      if (scrollableHeight <= 0) return;

      const progress = Math.min(Math.max(-section.getBoundingClientRect().top / scrollableHeight, 0), 0.9999);
      setActiveWorkflowStep(lifecycleStages[Math.floor(progress * lifecycleStages.length)]);
    };

    window.addEventListener("scroll", updateLifecycleStep, { passive: true });
    window.addEventListener("resize", updateLifecycleStep);
    updateLifecycleStep();

    return () => {
      window.removeEventListener("scroll", updateLifecycleStep);
      window.removeEventListener("resize", updateLifecycleStep);
    };
  }, []);

  useEffect(() => {
    const updateBillingFeature = () => {
      const section = billingSectionRef.current;
      if (!section) return;

      const scrollableHeight = section.offsetHeight - window.innerHeight;
      if (scrollableHeight <= 0) return;

      const progress = Math.min(Math.max(-section.getBoundingClientRect().top / scrollableHeight, 0), 0.9999);
      setActiveFeatureIndex(Math.floor(progress * billingFeatures.length));
    };

    window.addEventListener("scroll", updateBillingFeature, { passive: true });
    window.addEventListener("resize", updateBillingFeature);
    updateBillingFeature();

    return () => {
      window.removeEventListener("scroll", updateBillingFeature);
      window.removeEventListener("resize", updateBillingFeature);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#fbfaf7] bg-[radial-gradient(circle_at_12%_82%,rgba(186,230,253,.64),transparent_25%),radial-gradient(circle_at_42%_88%,rgba(254,240,138,.52),transparent_22%),radial-gradient(circle_at_74%_84%,rgba(221,214,254,.6),transparent_26%),radial-gradient(circle_at_96%_78%,rgba(167,243,208,.62),transparent_26%)] bg-fixed text-[#0B1A2C] selection:bg-[#0069FF] selection:text-white font-sans">
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
        <div className="mx-auto max-w-7xl rounded-[32px] border border-white/70 px-6 py-16 sm:py-24 text-center">
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

      {/* 4. Interactive Product Showcase */}
      <section ref={showcaseSectionRef} className="relative px-3 py-8 sm:px-6 lg:min-h-[400vh]">
        <div className="lg:sticky lg:top-20 sm:lg:top-24">
          <div className="relative isolate mx-auto max-w-7xl overflow-hidden rounded-[32px] p-6 shadow-sm sm:p-12">
            {showcaseGradients.map((gradient, index) => (
              <div
                key={gradient}
                aria-hidden="true"
                className="absolute inset-0 -z-10 transition-opacity duration-700 ease-out"
                style={{ background: gradient, opacity: activeShowcaseTab === showcaseTabs[index] ? 1 : 0 }}
              />
            ))}
            <div className="relative">
          {/* Top Floating Tab Switcher Icons */}
          <div className="mb-8 flex items-center justify-center">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/80 p-1.5 shadow-md backdrop-blur-md">
              <button
                onClick={() => scrollToShowcaseStep(0)}
                className={cn(
                  "flex size-11 items-center justify-center rounded-full transition-all",
                  activeShowcaseTab === "ai"
                    ? "bg-[#0069FF] text-white shadow-sm scale-105"
                    : "text-[#0B1A2C]/60 hover:text-[#0B1A2C] hover:bg-black/5"
                )}
                title="AI Scheduling Assistant"
              >
                <Calendar className="size-5" />
              </button>
              <button
                onClick={() => scrollToShowcaseStep(1)}
                className={cn(
                  "flex size-11 items-center justify-center rounded-full transition-all",
                  activeShowcaseTab === "payments"
                    ? "bg-[#0069FF] text-white shadow-sm scale-105"
                    : "text-[#0B1A2C]/60 hover:text-[#0B1A2C] hover:bg-black/5"
                )}
                title="Payments & Invoicing"
              >
                <CreditCard className="size-5" />
              </button>
              <button
                onClick={() => scrollToShowcaseStep(2)}
                className={cn(
                  "flex size-11 items-center justify-center rounded-full transition-all",
                  activeShowcaseTab === "sync"
                    ? "bg-[#0069FF] text-white shadow-sm scale-105"
                    : "text-[#0B1A2C]/60 hover:text-[#0B1A2C] hover:bg-black/5"
                )}
                title="Smart Availability Sync"
              >
                <Leaf className="size-5" />
              </button>
              <button
                onClick={() => scrollToShowcaseStep(3)}
                className={cn(
                  "flex size-11 items-center justify-center rounded-full transition-all",
                  activeShowcaseTab === "notes"
                    ? "bg-[#0069FF] text-white shadow-sm scale-105"
                    : "text-[#0B1A2C]/60 hover:text-[#0B1A2C] hover:bg-black/5"
                )}
                title="Notetaker AI"
              >
                <Sparkles className="size-5" />
              </button>
            </div>
          </div>

          {/* Inner Card Presentation */}
          <div className="mx-auto max-w-5xl rounded-3xl bg-white p-6 sm:p-10 shadow-xl border border-white/60">
            <AnimatePresence mode="wait">
              {activeShowcaseTab === "ai" && (
                <motion.div
                  key="tab-ai"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                  className="grid gap-8 lg:grid-cols-2 lg:items-center"
                >
                  <div className="space-y-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F3FF] px-3 py-1 text-xs font-bold text-[#0069FF]">
                      <Sparkles className="size-3.5" /> Slotly AI · Beta
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0B1A2C]">
                      Introducing your 24/7 AI scheduling assistant
                    </h2>
                    <p className="text-base text-[#4A5568] leading-relaxed">
                      Add Slotly AI to any email thread to coordinate scheduling on your behalf without switching tools or sacrificing control.
                    </p>
                    <Link
                      to="/book/northstar-health"
                      className="inline-flex items-center gap-2 text-sm font-bold text-[#0069FF] hover:underline"
                    >
                      Learn more <ArrowRight className="size-4" />
                    </Link>
                  </div>

                  {/* Generated Showcase Illustration */}
                  <div className="relative overflow-hidden rounded-2xl border border-[#D5EFE0] bg-gradient-to-tr from-[#EBF7EE] via-white to-[#E8F3FF] p-2 shadow-inner">
                    <img
                      src="/landing/showcase-ai.jpg"
                      alt="Introducing your 24/7 AI scheduling assistant"
                      className="h-auto w-full rounded-xl object-contain shadow-md"
                    />
                  </div>
                </motion.div>
              )}

              {activeShowcaseTab === "payments" && (
                <motion.div
                  key="tab-payments"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                  className="grid gap-8 lg:grid-cols-2 lg:items-center"
                >
                  <div className="space-y-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E6F4EA] px-3 py-1 text-xs font-bold text-[#137333]">
                      <CreditCard className="size-3.5" /> Payments · New
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0B1A2C]">
                      Flexible, built-in payment tools
                    </h2>
                    <p className="text-base text-[#4A5568] leading-relaxed">
                      Charge upfront for meetings, sell multi-session packages, and send invoices with payment features that make it easy to get paid.
                    </p>
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 text-sm font-bold text-[#0069FF] hover:underline"
                    >
                      Learn more <ArrowRight className="size-4" />
                    </Link>
                  </div>

                  {/* Generated Showcase Illustration */}
                  <div className="relative overflow-hidden rounded-2xl border border-[#CCE7FC] bg-gradient-to-tr from-[#EAF5FE] via-white to-[#ECFDF5] p-2 shadow-inner">
                    <img
                      src="/landing/showcase-payments.jpg"
                      alt="Flexible, built-in payment tools"
                      className="h-auto w-full rounded-xl object-contain shadow-md"
                    />
                  </div>
                </motion.div>
              )}

              {activeShowcaseTab === "sync" && (
                <motion.div
                  key="tab-sync"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                  className="grid gap-8 lg:grid-cols-2 lg:items-center"
                >
                  <div className="space-y-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF0E6] px-3 py-1 text-xs font-bold text-[#C2410C]">
                      <Leaf className="size-3.5" /> Conflict Protection
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0B1A2C]">
                      Multi-calendar real-time sync
                    </h2>
                    <p className="text-base text-[#4A5568] leading-relaxed">
                      Connect your Google, Outlook, and Apple calendars. When a personal appointment pops up, Slotly automatically closes those slots instantly.
                    </p>
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 text-sm font-bold text-[#0069FF] hover:underline"
                    >
                      See how sync works <ArrowRight className="size-4" />
                    </Link>
                  </div>

                  {/* Generated Showcase Illustration */}
                  <div className="relative overflow-hidden rounded-2xl border border-[#FEE6C6] bg-gradient-to-tr from-[#FFF8EB] via-white to-[#E8F3FF] p-2 shadow-inner">
                    <img
                      src="/landing/showcase-sync.jpg"
                      alt="Multi-calendar real-time sync"
                      className="h-auto w-full rounded-xl object-contain shadow-md"
                    />
                  </div>
                </motion.div>
              )}

              {activeShowcaseTab === "notes" && (
                <motion.div
                  key="tab-notes"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                  className="grid gap-8 lg:grid-cols-2 lg:items-center"
                >
                  <div className="space-y-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F3E8FF] px-3 py-1 text-xs font-bold text-[#7E22CE]">
                      <Mic className="size-3.5" /> Meeting Notetaker
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0B1A2C]">
                      Never lose track of meeting decisions
                    </h2>
                    <p className="text-base text-[#4A5568] leading-relaxed">
                      AI Notetaker records, transcribes, and summarizes key takeaways, automatically emailing attendees follow-ups within minutes of wrapping up.
                    </p>
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 text-sm font-bold text-[#0069FF] hover:underline"
                    >
                      Explore Notetaker <ArrowRight className="size-4" />
                    </Link>
                  </div>

                  {/* Generated Showcase Illustration */}
                  <div className="relative overflow-hidden rounded-2xl border border-[#DDD6FE] bg-gradient-to-tr from-[#F5F3FF] via-white to-[#EBF7EE] p-2 shadow-inner">
                    <img
                      src="/landing/showcase-notes.jpg"
                      alt="Never lose track of meeting decisions"
                      className="h-auto w-full rounded-xl object-contain shadow-md"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* 5. Scroll-driven End-to-End Meeting Lifecycle */}
      <section ref={lifecycleSectionRef} className="relative overflow-clip px-3 py-16 sm:px-6 sm:py-24 lg:min-h-[400vh]">
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 flex justify-center overflow-hidden text-[18rem] font-bold leading-none tracking-[-0.12em] text-white sm:text-[30rem]">
          MEET
        </div>
        <div className="relative mx-auto max-w-7xl lg:sticky lg:top-8">
          <div className="mb-10 max-w-xl sm:mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0069FF]">End-to-End Meeting Lifecycle</span>
            <h2 className="mt-3 font-serif text-4xl font-normal text-[#0B1A2C] sm:text-5xl">
              From booking to follow-up, completely streamlined.
            </h2>
          </div>

          <div
            className={cn(
              "grid gap-3 md:transition-[grid-template-columns] md:duration-700 md:ease-out lg:gap-4",
              activeWorkflowStep === 0 && "md:grid-cols-[1.55fr_1fr_1fr_1fr]",
              activeWorkflowStep === 1 && "md:grid-cols-[1fr_1.55fr_1fr_1fr]",
              activeWorkflowStep === 2 && "md:grid-cols-[1fr_1fr_1.55fr_1fr]",
              activeWorkflowStep === 3 && "md:grid-cols-[1fr_1fr_1fr_1.55fr]"
            )}
          >
            <WorkflowStageCard
              number="01"
              title="Book"
              desc="Book the meeting and get paid with zero back-and-forth."
              items={["Client replies with times to meet", "Client picks Tuesday at 2 p.m.", "Client pays deposit upfront"]}
              visual="book"
              isActive={activeWorkflowStep === 0}
              onClick={() => scrollToLifecycleStep(0)}
            />
            <WorkflowStageCard
              number="02"
              title="Prep"
              desc="Never walk into a meeting cold."
              items={["Contact details automatically updated", "Your client&apos;s information is in one place", "Callie helps you prepare"]}
              visual="prep"
              isActive={activeWorkflowStep === 1}
              onClick={() => scrollToLifecycleStep(1)}
            />
            <WorkflowStageCard
              number="03"
              title="Capture"
              desc="While you run the meeting, Slotly captures the conversation, the recap and action items."
              items={["Notetaker joins and takes notes", "You get a ready-to-share recap", "Recap is stored in contact profile"]}
              visual="capture"
              isActive={activeWorkflowStep === 2}
              onClick={() => scrollToLifecycleStep(2)}
            />
            <WorkflowStageCard
              number="04"
              title="Follow up"
              desc="Work moves forward after the meeting ends."
              items={["Notetaker drafts a follow-up email", "Callie finds time for the next call", "Client pays an invoice"]}
              visual="follow-up"
              isActive={activeWorkflowStep === 3}
              onClick={() => scrollToLifecycleStep(3)}
            />
          </div>
        </div>
      </section>

      {/* 6. Sticky Split Interactive Feature Showcase ("that fit your business" - Frame 7, 8, 10, 12) */}
      <section ref={billingSectionRef} className="min-h-[400vh] border-y border-white/60 px-3 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 lg:sticky lg:top-8 lg:grid-cols-2 lg:items-center">
          {/* Left: Dynamic UI Graphic based on activeFeatureIndex */}
          <div className="relative rounded-3xl bg-gradient-to-tr from-[#EBF5FE] via-[#F3E8FF] to-[#ECFDF5] p-6 sm:p-10 border border-[#E2E8F0]">
            <AnimatePresence mode="wait">
              {activeFeatureIndex === 0 && (
                <motion.div
                  key="feat-0"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden rounded-2xl border border-gray-100/80 bg-white shadow-xl"
                >
                  <img
                    src="/landing/billing-upfront.svg"
                    alt="Upfront meeting payments"
                    className="h-auto w-full object-cover"
                  />
                </motion.div>
              )}

              {activeFeatureIndex === 1 && (
                <motion.div
                  key="feat-1"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden rounded-2xl border border-gray-100/80 bg-white shadow-xl"
                >
                  <img
                    src="/landing/billing-packages.svg"
                    alt="Meeting packages"
                    className="h-auto w-full object-cover"
                  />
                </motion.div>
              )}

              {activeFeatureIndex === 2 && (
                <motion.div
                  key="feat-2"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden rounded-2xl border border-gray-100/80 bg-white shadow-xl"
                >
                  <img
                    src="/landing/billing-invoices.svg"
                    alt="Professional invoices"
                    className="h-auto w-full object-cover"
                  />
                </motion.div>
              )}

              {activeFeatureIndex === 3 && (
                <motion.div
                  key="feat-3"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden rounded-2xl border border-gray-100/80 bg-white shadow-xl"
                >
                  <img
                    src="/landing/billing-links.svg"
                    alt="Instant payment links"
                    className="h-auto w-full object-cover"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Scroll-driven billing message */}
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#0069FF]">Monetization & Billing</span>
              <h2 className="mt-2 font-serif text-4xl sm:text-5xl font-normal text-[#0B1A2C]">
                Payments that fit your business.
              </h2>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={billingFeatures[activeFeatureIndex].title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl border border-[#E8E8E8] bg-[#FAF8F5] p-5 shadow-xs"
              >
                <h3 className="text-base font-bold text-[#0069FF]">
                  {billingFeatures[activeFeatureIndex].title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-[#4A5568] sm:text-sm">
                  {billingFeatures[activeFeatureIndex].desc}
                </p>
                <motion.div className="mt-3 h-0.5 w-full rounded-full bg-[#0069FF]" />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* 7. Connected Tool Ecosystem Ribbon */}
      <section className="px-3 sm:px-6 py-20">
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
      <section className="px-3 sm:px-6 py-20">
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
      <section id="pricing" className="px-3 sm:px-6 py-24">
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


function WorkflowStageCard({
  number,
  title,
  desc,
  items,
  visual,
  isActive,
  onClick,
}: {
  number: string;
  title: string;
  desc: string;
  items: string[];
  visual: "book" | "prep" | "capture" | "follow-up";
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex min-h-[26rem] flex-col items-start overflow-hidden rounded-[22px] border p-5 pt-6 text-left transition-[transform,box-shadow,background-color,border-color] duration-500",
        isActive
          ? "border-white bg-white shadow-[0_20px_50px_rgba(41,68,94,.16)]"
          : "border-white/80 bg-white/80 hover:bg-white hover:shadow-lg"
      )}
    >
      <span className="text-[11px] font-bold text-[#0069FF]">{number}</span>
      <h3 className="mt-1 text-lg font-bold tracking-tight text-[#0B1A2C]">{title}</h3>
      <p className="mt-2 text-xs leading-relaxed text-[#58708a]">{desc}</p>

      <div className="mt-4 space-y-2">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-2 text-[11px] leading-snug text-[#24415f]">
            <span className="mt-0.5 size-2 shrink-0 rounded-full bg-[#78d7ac] ring-4 ring-[#e8f8f0]" />
            <span>{item}</span>
          </div>
        ))}
      </div>

      <AnimatePresence initial={false}>
        {isActive && <WorkflowVisual visual={visual} />}
      </AnimatePresence>
    </button>
  );
}

function WorkflowVisual({ visual }: { visual: "book" | "prep" | "capture" | "follow-up" }) {
  const meta = {
    book: { src: "/landing/lifecycle-book.jpg", alt: "Book appointment stage" },
    prep: { src: "/landing/lifecycle-prep.jpg", alt: "Prep meeting stage" },
    capture: { src: "/landing/lifecycle-capture.svg", alt: "Capture live notes stage" },
    "follow-up": { src: "/landing/lifecycle-follow-up.svg", alt: "Automated follow-up stage" },
  }[visual];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 14, scale: 0.96 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="absolute inset-x-3 bottom-3 overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-md"
    >
      <img
        src={meta.src}
        alt={meta.alt}
        className="h-44 w-full object-cover object-top"
      />
    </motion.div>
  );
}
