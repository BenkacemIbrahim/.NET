import {
  ArrowRight,
  Check,
  ChevronDown,
  Clock,
  CreditCard,
  ExternalLink,
  Hourglass,
  Leaf,
  Menu,
  MessageCircle,
  Mic,
  Send,
  Sparkles,
  Video,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "../lib/cn";

export function LandingPage() {
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [activeNavDropdown, setActiveNavDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeShowcaseTab, setActiveShowcaseTab] = useState<"ai" | "payments" | "sync" | "notes">("ai");
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(0);
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);

  // Auto-advance showcase tab or feature tab subtly
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
              Introducing the new Slotly, built to handle all of the work around meetings.
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
          <Link to="/" className="flex items-center gap-2">
            <div className="grid size-9 place-items-center rounded-xl bg-[#0069FF] text-white shadow-sm">
              <Hourglass className="size-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[#0B1A2C]">Slotly</span>
          </Link>

          {/* Nav Dropdowns */}
          <nav className="hidden items-center gap-7 lg:flex">
            <div
              className="relative"
              onMouseEnter={() => setActiveNavDropdown("product")}
              onMouseLeave={() => setActiveNavDropdown(null)}
            >
              <button className="flex items-center gap-1 text-sm font-semibold text-[#0B1A2C] hover:text-[#0069FF]">
                Product <ChevronDown className="size-3.5" />
              </button>
              {activeNavDropdown === "product" && (
                <div className="absolute -left-6 top-full mt-3 w-80 rounded-2xl border border-[#E8E8E8] bg-white p-4 shadow-xl">
                  <div className="space-y-1">
                    <DropdownItem title="Scheduling Pages" desc="Share your link and let people book" to="/book/northstar-health" />
                    <DropdownItem title="Team Availability" desc="Round-robin and multi-host slots" to="/login" />
                    <DropdownItem title="Automated Workflows" desc="Reminders, SMS, and thank-yous" to="/login" />
                    <DropdownItem title="Slotly AI Assistant" desc="Coordinate times via email & chat" to="/login" />
                  </div>
                </div>
              )}
            </div>

            <div
              className="relative"
              onMouseEnter={() => setActiveNavDropdown("solutions")}
              onMouseLeave={() => setActiveNavDropdown(null)}
            >
              <button className="flex items-center gap-1 text-sm font-semibold text-[#0B1A2C] hover:text-[#0069FF]">
                Solutions <ChevronDown className="size-3.5" />
              </button>
              {activeNavDropdown === "solutions" && (
                <div className="absolute -left-6 top-full mt-3 w-80 rounded-2xl border border-[#E8E8E8] bg-white p-4 shadow-xl">
                  <div className="space-y-1">
                    <DropdownItem title="Sales & Revenue" desc="Qualify, route, and book faster" to="/login" />
                    <DropdownItem title="Customer Success" desc="Stay aligned with priority clients" to="/login" />
                    <DropdownItem title="Healthcare & Clinical" desc="HIPAA-aware scheduling made simple" to="/book/northstar-health" />
                    <DropdownItem title="Consultants & Teams" desc="Professional packages & payments" to="/login" />
                  </div>
                </div>
              )}
            </div>

            <div
              className="relative"
              onMouseEnter={() => setActiveNavDropdown("resources")}
              onMouseLeave={() => setActiveNavDropdown(null)}
            >
              <button className="flex items-center gap-1 text-sm font-semibold text-[#0B1A2C] hover:text-[#0069FF]">
                Resources <ChevronDown className="size-3.5" />
              </button>
              {activeNavDropdown === "resources" && (
                <div className="absolute -left-12 top-full mt-3 w-96 rounded-2xl border border-[#E8E8E8] bg-white p-5 shadow-xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Get Started</p>
                      <DropdownItem title="Learning hub" desc="Structured guides" to="/login" compact />
                      <DropdownItem title="Developer docs" desc="Slotly REST API" to="/login" compact />
                      <DropdownItem title="Product tour" desc="Interactive demo" to="/book/northstar-health" compact />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Discover</p>
                      <DropdownItem title="Customer stories" desc="Real success stories" to="/login" compact />
                      <DropdownItem title="What's new" desc="Latest product updates" to="/login" compact />
                      <DropdownItem title="Help center" desc="24/7 answers" to="/login" compact />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <a href="#pricing" className="text-sm font-semibold text-[#0B1A2C] hover:text-[#0069FF]">
              Pricing
            </a>
          </nav>

          {/* Right Actions */}
          <div className="hidden items-center gap-3 sm:flex">
            <Link
              to="/book/northstar-health"
              className="text-sm font-semibold text-[#0B1A2C] hover:text-[#0069FF] px-2"
            >
              Talk to sales
            </Link>
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

      {/* 3. Hero Section (Calendly Signature Cream Inset Box with Editorial Serif) */}
      <section className="px-3 sm:px-6 pt-4 pb-12">
        <div className="mx-auto max-w-7xl rounded-[32px] bg-[#FAF8F5] border border-[#EFECE6] px-6 py-16 sm:py-24 text-center">
          <div className="mx-auto max-w-4xl space-y-6">
            <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl font-normal leading-[1.08] tracking-tight text-[#0B1A2C]">
              All the work around <br className="hidden sm:inline" />
              meetings, <span className="italic font-serif">handled.</span>
            </h1>

            <p className="mx-auto max-w-2xl text-lg sm:text-xl text-[#4A5568] leading-relaxed">
              From AI-powered scheduling to automated meeting recaps and follow-ups, get the busywork done with fewer tools and less effort.
            </p>

            {/* Social / Email Signup Pills */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/book/northstar-health"
                className="w-full sm:w-auto inline-flex h-13 items-center justify-center gap-3 rounded-full border border-[#0B1A2C] bg-white px-7 text-sm font-semibold text-[#0B1A2C] shadow-sm transition-all hover:bg-neutral-50 hover:shadow"
              >
                <svg className="size-4.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Sign up with Google
              </Link>

              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex h-13 items-center justify-center gap-3 rounded-full bg-[#0B1A2C] px-7 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#0069FF]"
              >
                <div className="grid grid-cols-2 gap-0.5 size-4">
                  <span className="bg-[#F25022] size-1.5 rounded-xs" />
                  <span className="bg-[#7FBA00] size-1.5 rounded-xs" />
                  <span className="bg-[#00A4EF] size-1.5 rounded-xs" />
                  <span className="bg-[#FFB900] size-1.5 rounded-xs" />
                </div>
                Sign up with Microsoft
              </Link>
            </div>

            <p className="text-xs text-[#718096]">
              <Link to="/login" className="underline hover:text-[#0069FF]">Sign up with email</Link> · No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* 4. Interactive Product Showcase (Pastel Gradient Container with Top Icon Switcher) */}
      <section className="px-3 sm:px-6 py-8">
        <div className="mx-auto max-w-7xl rounded-[32px] bg-gradient-to-br from-[#D9EAFE] via-[#EDE9FE] to-[#D1FAE5] p-6 sm:p-12 shadow-sm">
          {/* Top Floating Tab Switcher Icons */}
          <div className="mb-8 flex items-center justify-center">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/80 p-1.5 shadow-md backdrop-blur-md">
              <button
                onClick={() => setActiveShowcaseTab("ai")}
                className={cn(
                  "flex size-11 items-center justify-center rounded-full transition-all",
                  activeShowcaseTab === "ai"
                    ? "bg-[#0069FF] text-white shadow-sm scale-105"
                    : "text-[#0B1A2C]/60 hover:text-[#0B1A2C] hover:bg-black/5"
                )}
                title="AI Scheduling Assistant"
              >
                <Hourglass className="size-5" />
              </button>
              <button
                onClick={() => setActiveShowcaseTab("payments")}
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
                onClick={() => setActiveShowcaseTab("sync")}
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
                onClick={() => setActiveShowcaseTab("notes")}
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

                  {/* Interactive Mockup */}
                  <div className="relative rounded-2xl bg-[#EBF7EE] p-6 sm:p-8 border border-[#D5EFE0] overflow-hidden">
                    <div className="rounded-xl bg-white p-5 shadow-lg border border-[#E2E8F0]">
                      <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                        <div className="size-8 rounded-full bg-[#0069FF]/10 text-[#0069FF] grid place-items-center font-bold text-xs">
                          DM
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#0B1A2C]">Dominic Mills</p>
                          <p className="text-[11px] text-gray-400">To: Slotly AI, Tori Mathers</p>
                        </div>
                      </div>
                      <div className="mt-4 space-y-3">
                        <div className="rounded-xl bg-[#F0F7FF] p-3 border border-[#D9EAFF]">
                          <p className="text-xs font-semibold text-[#0069FF] flex items-center gap-1">
                            <Sparkles className="size-3" /> Slotly AI replied
                          </p>
                          <p className="mt-1 text-xs text-[#0B1A2C]">
                            Happy to set up a call for you with Dominic. Here are a few times you're both available:
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <span className="rounded-lg bg-white px-3 py-1 text-xs font-bold text-[#0069FF] shadow-xs border border-blue-200">10:00 AM</span>
                            <span className="rounded-lg bg-white px-3 py-1 text-xs font-bold text-[#0069FF] shadow-xs border border-blue-200">2:30 PM</span>
                            <span className="rounded-lg bg-white px-3 py-1 text-xs font-bold text-[#0069FF] shadow-xs border border-blue-200">3:00 PM</span>
                          </div>
                        </div>
                      </div>
                    </div>
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

                  <div className="rounded-2xl bg-[#EAF5FE] p-6 sm:p-8 border border-[#CCE7FC]">
                    <div className="rounded-xl bg-white p-5 shadow-lg border border-[#E2E8F0] space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#0B1A2C]">Amount to collect</span>
                        <span className="text-xs font-semibold text-gray-500">USD</span>
                      </div>
                      <div className="flex items-center rounded-xl border border-gray-200 px-3 py-2">
                        <span className="text-sm font-bold text-gray-400 mr-2">$</span>
                        <span className="text-lg font-bold text-[#0B1A2C]">150.00</span>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100">
                        <span className="font-semibold text-gray-600">Payment processor</span>
                        <span className="font-bold text-[#0069FF] flex items-center gap-1">
                          Stripe <Check className="size-3 text-emerald-600" />
                        </span>
                      </div>
                    </div>
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

                  <div className="rounded-2xl bg-[#FFF8EB] p-6 sm:p-8 border border-[#FEE6C6]">
                    <div className="rounded-xl bg-white p-5 shadow-lg border border-[#E2E8F0] space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                        <span>Synced Calendars</span>
                        <span className="text-emerald-600">3 Connected</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between rounded-lg bg-gray-50 p-2 text-xs">
                          <span className="font-semibold text-gray-800">Google Calendar (Work)</span>
                          <Check className="size-3.5 text-emerald-600" />
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-gray-50 p-2 text-xs">
                          <span className="font-semibold text-gray-800">Outlook (Clinic)</span>
                          <Check className="size-3.5 text-emerald-600" />
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-gray-50 p-2 text-xs">
                          <span className="font-semibold text-gray-800">iCloud (Personal)</span>
                          <Check className="size-3.5 text-emerald-600" />
                        </div>
                      </div>
                    </div>
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

                  <div className="rounded-2xl bg-[#F5F3FF] p-6 sm:p-8 border border-[#DDD6FE]">
                    <div className="rounded-xl bg-white p-5 shadow-lg border border-[#E2E8F0] space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#7E22CE]">
                        <Mic className="size-3.5 animate-pulse text-red-500" />
                        <span>Transcription in progress · 32:15</span>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-700 space-y-1">
                        <p className="font-bold text-[#0B1A2C]">Key Takeaway:</p>
                        <p>Dr. Benkacem approved follow-up check on Friday 2:00 PM. Patient agreed to review lab results beforehand.</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

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

      {/* 7. Connected Tool Ecosystem Ribbon (Frame 16) */}
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

          {/* Connected Icon Track */}
          <div className="mt-12 overflow-hidden py-4">
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 max-w-4xl mx-auto">
              {[
                { name: "Google Calendar", color: "#4285F4", letter: "31" },
                { name: "Google Meet", color: "#00AC47", letter: "M" },
                { name: "Zoom", color: "#2D8CFF", letter: "Z" },
                { name: "Microsoft Teams", color: "#6264A7", letter: "T" },
                { name: "Outlook", color: "#0078D4", letter: "O" },
                { name: "Salesforce", color: "#00A1E0", letter: "SF" },
                { name: "Slack", color: "#4A154B", letter: "#" },
                { name: "Stripe", color: "#635BFF", letter: "S" },
                { name: "PayPal", color: "#003087", letter: "P" },
                { name: "HubSpot", color: "#FF7A59", letter: "H" },
                { name: "Zapier", color: "#FF4A00", letter: "*" },
                { name: "OpenAI", color: "#10A37F", letter: "AI" },
              ].map((tool, i) => (
                <div key={tool.name} className="flex items-center gap-2">
                  <div
                    className="flex size-14 items-center justify-center rounded-2xl bg-white shadow-md border border-[#E8E8E8] transition-all hover:-translate-y-1 hover:shadow-lg"
                    title={tool.name}
                  >
                    <span
                      className="text-base font-extrabold"
                      style={{ color: tool.color }}
                    >
                      {tool.letter}
                    </span>
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
                  "Slotly Notetaker organizes the chaos of dialogue into pure clarity."
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

      {/* 9. Bottom CTA Section */}
      <section className="px-3 sm:px-6 py-16 text-center">
        <div className="mx-auto max-w-4xl space-y-6">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0069FF]">Get Started Today</span>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-normal text-[#0B1A2C]">
            From the first meeting to the follow-up
          </h2>
          <p className="mx-auto max-w-2xl text-base sm:text-lg text-[#4A5568]">
            All of the work around meetings, handled in one place. Book time, capture every discussion, and keep next steps moving without the manual work.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/book/northstar-health"
              className="inline-flex h-12 items-center justify-center rounded-full bg-[#0069FF] px-8 text-sm font-semibold text-white shadow-md hover:bg-[#0056D6] transition-all"
            >
              Get started for free
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

      {/* 10. Calendly Navy Footer (Frame 19) */}
      <footer id="pricing" className="bg-[#0B1A2C] text-white pt-16 pb-12 px-5 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-5 border-b border-white/10 pb-12">
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center gap-2">
                <div className="grid size-8 place-items-center rounded-lg bg-[#0069FF] text-white">
                  <Hourglass className="size-4" />
                </div>
                <span className="text-xl font-bold tracking-tight">Slotly</span>
              </div>
              <p className="text-xs text-white/60 leading-relaxed">
                The modern platform that handles all of the work around meetings.
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

      {/* 11. Floating Support / Chat Bubble */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="grid size-14 place-items-center rounded-full bg-[#0B1A2C] text-white shadow-2xl transition-all hover:scale-105 hover:bg-[#0069FF]"
          aria-label="Open support chat"
        >
          {chatOpen ? <X className="size-6" /> : <MessageCircle className="size-6" />}
        </button>

        {chatOpen && (
          <div className="absolute bottom-16 right-0 w-80 rounded-2xl bg-white p-5 shadow-2xl border border-gray-200">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <div className="grid size-8 place-items-center rounded-full bg-[#0069FF] text-white">
                <Sparkles className="size-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#0B1A2C]">Ask Callie AI</p>
                <p className="text-[11px] text-emerald-600 font-semibold">Online · Ready to help</p>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-600 bg-blue-50 p-3 rounded-xl border border-blue-100">
              Hi! I'm Callie, your Slotly AI scheduling partner. Looking to book an appointment or explore the workspace?
            </div>
            <div className="mt-3 grid gap-2">
              <Link
                to="/book/northstar-health"
                className="rounded-lg bg-gray-50 p-2 text-xs font-semibold text-[#0B1A2C] hover:bg-[#0069FF] hover:text-white transition-colors text-center"
              >
                Book with Northstar Health
              </Link>
              <Link
                to="/login"
                className="rounded-lg bg-gray-50 p-2 text-xs font-semibold text-[#0B1A2C] hover:bg-[#0B1A2C] hover:text-white transition-colors text-center"
              >
                Open Admin Workspace
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DropdownItem({
  title,
  desc,
  to,
  compact = false,
}: {
  title: string;
  desc: string;
  to: string;
  compact?: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "block rounded-xl transition-colors hover:bg-neutral-50",
        compact ? "p-2" : "p-3"
      )}
    >
      <p className="text-xs font-bold text-[#0B1A2C]">{title}</p>
      <p className="text-[11px] text-muted-foreground">{desc}</p>
    </Link>
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
