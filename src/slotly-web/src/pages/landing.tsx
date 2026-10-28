import {
  ArrowRight,
  CalendarCheck,
  Check,
  ChevronDown,
  Clock3,
  Menu,
  RefreshCw,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { SlotlyLogo } from "../components/slotly-logo";
import { cn } from "../lib/cn";

const nav = [
  ["Product", "#product"],
  ["Solutions", "#solutions"],
  ["Resources", "#resources"],
  ["Pricing", "#pricing"],
] as const;

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="marketing-page min-h-dvh bg-white text-foreground">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between px-5 lg:px-8">
          <Link to="/" aria-label="Slotly home">
            <SlotlyLogo variant="full" mode="original" className="h-8 w-auto" />
          </Link>
          <nav className="hidden items-center gap-8 lg:flex" aria-label="Main navigation">
            {nav.map(([label, href], index) => (
              <a key={label} href={href} className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary">
                {label}{index < 3 && <ChevronDown className="size-3.5" />}
              </a>
            ))}
          </nav>
          <div className="hidden items-center gap-5 lg:flex">
            <Link to="/login" className="text-sm font-semibold text-foreground hover:text-primary">Log in</Link>
            <Link to="/book/northstar-health" className="inline-flex min-h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover">
              Book a time
            </Link>
          </div>
          <button className="grid size-11 place-items-center rounded-lg border border-border lg:hidden" onClick={() => setMenuOpen((v) => !v)} aria-expanded={menuOpen} aria-label="Toggle navigation">
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
        {menuOpen && (
          <nav className="border-t border-border px-5 py-4 lg:hidden" aria-label="Mobile navigation">
            {nav.map(([label, href]) => <a key={label} href={href} onClick={() => setMenuOpen(false)} className="block border-b border-border py-3 text-sm font-semibold">{label}</a>)}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link to="/login" className="grid min-h-11 place-items-center rounded-lg border border-border text-sm font-semibold">Log in</Link>
              <Link to="/book/northstar-health" className="grid min-h-11 place-items-center rounded-lg bg-primary text-sm font-semibold text-white">Book a time</Link>
            </div>
          </nav>
        )}
      </header>

      <main>
        <section className="overflow-hidden px-5 py-16 sm:py-24 lg:px-8 lg:py-28">
          <div className="mx-auto grid max-w-[1200px] items-center gap-14 lg:grid-cols-[1.02fr_.98fr] lg:gap-16">
            <div>
              <p className="mb-5 text-sm font-bold uppercase tracking-[.14em] text-primary">Scheduling that works around you</p>
              <h1 className="max-w-[700px] text-[44px] font-bold leading-[1.04] tracking-[-.045em] text-foreground sm:text-[58px] lg:text-[68px]">
                Make time for the work that <span className="text-primary">matters.</span>
              </h1>
              <p className="mt-7 max-w-[610px] text-lg leading-8 text-muted-foreground sm:text-xl">
                Share one clear booking page, protect your team's availability, and keep every appointment moving without the email back-and-forth.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link to="/book/northstar-health" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-base font-semibold text-white hover:bg-primary-hover">
                  See the booking experience <ArrowRight className="size-4" />
                </Link>
                <Link to="/login" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-border px-6 text-base font-semibold text-foreground hover:border-primary hover:text-primary">
                  Open your workspace
                </Link>
              </div>
              <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground"><Check className="size-4 text-success" /> Built for independent teams and growing practices</p>
            </div>
            <BookingPreview />
          </div>
        </section>

        <section className="border-y border-border bg-muted/55 px-5 py-10 lg:px-8">
          <div className="mx-auto max-w-[1200px] text-center">
            <p className="text-sm font-semibold text-muted-foreground">One scheduling workspace for every customer-facing team</p>
            <div className="mt-7 grid grid-cols-2 gap-y-6 text-base font-bold text-foreground/75 sm:grid-cols-4">
              <span>Health practices</span><span>Consulting teams</span><span>Personal services</span><span>Customer success</span>
            </div>
          </div>
        </section>

        <section id="product" className="px-5 py-20 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-[1200px]">
            <SectionIntro eyebrow="A simpler scheduling system" title="Everything between availability and arrival, connected." description="Slotly gives your team one place to publish services, organize schedules, and follow every booking from request to completion." />
            <div className="mt-16 grid gap-5 md:grid-cols-3">
              <Feature icon={CalendarCheck} title="Booking pages that feel effortless" copy="Customers choose a service, date, and time in a focused flow that works on every screen." />
              <Feature icon={Clock3} title="Availability you control" copy="Set weekly hours and time off per team member while Slotly protects against conflicts." />
              <Feature icon={RefreshCw} title="A live operational view" copy="Bookings, calendars, status changes, and team schedules stay current in one workspace." />
            </div>
          </div>
        </section>

        <section id="solutions" className="border-y border-border bg-background px-5 py-20 sm:py-28 lg:px-8">
          <div className="mx-auto grid max-w-[1200px] items-center gap-14 lg:grid-cols-2 lg:gap-20">
            <ProductPanel />
            <div>
              <p className="text-sm font-bold uppercase tracking-[.14em] text-[#0056c7]">Built for real schedules</p>
              <h2 className="mt-4 text-4xl font-bold leading-tight tracking-[-.035em] sm:text-5xl">Give the whole team a clear day.</h2>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">See upcoming appointments, service demand, and availability at a glance. Every screen is designed for quick decisions, not dashboard decoration.</p>
              <ul className="mt-8 space-y-4">
                {[
                  "Keep customer and booking details together",
                  "Manage services, staff, hours, and time off",
                  "Use live availability to prevent double-booking",
                ].map((item) => <li key={item} className="flex gap-3 text-base font-medium"><span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Check className="size-3.5" /></span>{item}</li>)}
              </ul>
              <Link to="/login" className="mt-9 inline-flex items-center gap-2 text-base font-bold text-[#0056c7] hover:text-primary-hover">Explore the workspace <ArrowRight className="size-4" /></Link>
            </div>
          </div>
        </section>

        <section id="resources" className="bg-navy px-5 py-20 text-white sm:py-24 lg:px-8">
          <div className="mx-auto max-w-[1200px]">
            <div className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-[.14em] text-[#8fc3ff]">From link to confirmed</p><h2 className="mt-4 text-4xl font-bold tracking-[-.035em] sm:text-5xl">A booking flow people understand immediately.</h2></div>
            <div className="mt-14 grid gap-0 md:grid-cols-3">
              {[["01","Choose","Present only the services and people relevant to the customer."],["02","Schedule","Show available days and times in the customer's local context."],["03","Confirm","Collect the details your team needs and send a clear confirmation."]].map(([n,t,c], i) => (
                <div key={n} className={cn("py-7 md:px-8 md:py-2", i > 0 && "border-t border-white/20 md:border-l md:border-t-0")}><span className="text-sm font-bold text-[#8fc3ff]">{n}</span><h3 className="mt-4 text-xl font-bold">{t}</h3><p className="mt-3 leading-7 text-white/70">{c}</p></div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="px-5 py-20 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-[1200px]">
            <SectionIntro eyebrow="Designed to grow with you" title="Start with the workflow you need today." description="Slotly's product areas work together, so your team can add services, staff, and booking volume without rebuilding the process." />
            <div className="mt-14 grid gap-5 md:grid-cols-3">
              <Plan title="Solo" copy="A focused booking setup for one professional." items={["Public booking page","Services and availability","Booking management"]} />
              <Plan title="Team" copy="Shared scheduling for a growing customer-facing team." items={["Multiple staff calendars","Working hours and time off","Live availability updates"]} featured />
              <Plan title="Operations" copy="A complete view for teams managing more volume." items={["Admin dashboard","Booking status workflows","Workspace branding"]} />
            </div>
          </div>
        </section>

        <section className="px-5 pb-20 lg:px-8 lg:pb-28">
          <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-8 rounded-2xl bg-navy px-7 py-12 text-white sm:px-12 lg:flex-row lg:items-center lg:px-16 lg:py-16">
            <div><h2 className="max-w-2xl text-3xl font-bold tracking-[-.03em] sm:text-4xl">Make the next appointment easier for everyone.</h2><p className="mt-3 text-lg text-white/70">See Slotly's complete customer booking flow.</p></div>
            <Link to="/book/northstar-health" className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-lg bg-primary px-6 font-bold text-white hover:bg-[#2380ff]">Book a time <ArrowRight className="size-4" /></Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-white px-5 py-14 lg:px-8">
        <div className="mx-auto grid max-w-[1200px] gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div><SlotlyLogo variant="full" mode="original" className="h-8" /><p className="mt-5 max-w-xs text-sm leading-6 text-muted-foreground">Reliable scheduling for teams that value their time and their customers' experience.</p></div>
          <FooterGroup title="Product" links={[["Booking","/book/northstar-health"],["Workspace","/login"],["Availability","/login"]]} />
          <FooterGroup title="Explore" links={[["Features","#product"],["Solutions","#solutions"],["Plans","#pricing"]]} />
          <FooterGroup title="Trust" links={[["Privacy","#"],["Accessibility","#"],["Status","#"]]} />
        </div>
        <div className="mx-auto mt-12 flex max-w-[1200px] flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:justify-between"><span>© 2026 Slotly. All rights reserved.</span><span>Built for clear, dependable scheduling.</span></div>
      </footer>
    </div>
  );
}

function BookingPreview() {
  const days = [27,28,29,30,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31];
  return <div className="relative rounded-2xl border border-border bg-white p-5 sm:p-7" aria-label="Slotly booking preview">
    <div className="flex items-center gap-3 border-b border-border pb-5"><span className="grid size-10 place-items-center rounded-full bg-primary text-sm font-bold text-white">S</span><div><p className="text-xs font-semibold text-muted-foreground">Northstar Health</p><p className="font-bold">General consultation</p></div></div>
    <div className="mt-6 grid gap-6 sm:grid-cols-[1fr_150px]">
      <div><div className="flex items-center justify-between"><b className="text-sm">October 2026</b><div className="flex gap-1"><button className="size-8 rounded-lg border border-border" aria-label="Previous month">‹</button><button className="size-8 rounded-lg border border-border" aria-label="Next month">›</button></div></div><div className="mt-4 grid grid-cols-7 gap-y-2 text-center text-[11px]"><>{["M","T","W","T","F","S","S"].map((d,i)=><span key={`${d}-${i}`} className="font-bold text-muted-foreground">{d}</span>)}</>{days.map((d,i)=><span key={`${d}-${i}`} className={cn("mx-auto grid size-8 place-items-center rounded-full tabular-nums", d===14&&i>10?"bg-primary font-bold text-white":i<4?"text-muted-foreground":"text-foreground")}>{d}</span>)}</div></div>
      <div className="border-t border-border pt-5 sm:border-l sm:border-t-0 sm:pl-5"><p className="text-sm font-bold">Wednesday 14</p><div className="mt-3 space-y-2">{["9:00 am","10:30 am","1:00 pm","2:30 pm"].map((t,i)=><button key={t} className={cn("min-h-10 w-full rounded-lg border text-xs font-semibold tabular-nums",i===1?"border-primary bg-primary text-white":"border-primary text-primary")}>{t}</button>)}</div></div>
    </div>
    <div className="mt-5 flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground"><Clock3 className="size-3.5" /> 30 min <span>·</span> Africa/Casablanca</div>
  </div>;
}

function SectionIntro({eyebrow,title,description}:{eyebrow:string;title:string;description:string}) { return <div className="mx-auto max-w-3xl text-center"><p className="text-sm font-bold uppercase tracking-[.14em] text-primary">{eyebrow}</p><h2 className="mt-4 text-4xl font-bold leading-tight tracking-[-.035em] sm:text-5xl">{title}</h2><p className="mt-5 text-lg leading-8 text-muted-foreground">{description}</p></div>; }
function Feature({icon:Icon,title,copy}:{icon:typeof CalendarCheck;title:string;copy:string}) { return <article className="rounded-xl border border-border p-7"><Icon className="size-7 text-primary" /><h3 className="mt-6 text-xl font-bold">{title}</h3><p className="mt-3 leading-7 text-muted-foreground">{copy}</p></article>; }
function ProductPanel() { return <div className="rounded-2xl border border-border bg-white p-5"><div className="flex items-center justify-between border-b border-border pb-4"><div><p className="text-xs font-semibold text-muted-foreground">Today's schedule</p><p className="mt-1 text-lg font-bold">8 bookings</p></div><span className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white">New booking</span></div><div className="mt-2 divide-y divide-border">{[["09:00","Samira Khan","General consultation"],["10:30","Noah Martin","Follow-up visit"],["13:00","Leila Cohen","Wellness session"],["15:30","Omar Idrissi","Initial assessment"]].map(([time,name,type],i)=><div key={time} className="grid grid-cols-[62px_1fr_auto] items-center gap-3 py-4"><b className="text-sm tabular-nums">{time}</b><div><p className="text-sm font-semibold">{name}</p><p className="text-xs text-muted-foreground">{type}</p></div><span className={cn("size-2 rounded-full",i===3?"bg-warning":"bg-success")} /></div>)}</div><div className="mt-3 grid grid-cols-3 gap-3 border-t border-border pt-5 text-center">{[[Users,"4","Team"],[CalendarCheck,"8","Booked"],[ShieldCheck,"100%","Protected"]].map(([Icon,value,label])=><div key={label as string}><Icon className="mx-auto size-4 text-primary" /><p className="mt-2 text-lg font-bold">{value as string}</p><p className="text-[11px] text-muted-foreground">{label as string}</p></div>)}</div></div>; }
function Plan({title,copy,items,featured=false}:{title:string;copy:string;items:string[];featured?:boolean}) { return <article className={cn("rounded-xl border p-7",featured?"border-primary":"border-border")}><h3 className="text-xl font-bold">{title}</h3><p className="mt-3 min-h-12 text-sm leading-6 text-muted-foreground">{copy}</p><Link to="/book/northstar-health" className={cn("mt-7 grid min-h-11 place-items-center rounded-lg border text-sm font-bold",featured?"border-primary bg-primary text-white":"border-border text-foreground hover:border-primary hover:text-primary")}>View booking flow</Link><ul className="mt-7 space-y-3 border-t border-border pt-6">{items.map(i=><li key={i} className="flex gap-2.5 text-sm"><Check className="mt-0.5 size-4 shrink-0 text-primary" />{i}</li>)}</ul></article>; }
function FooterGroup({title,links}:{title:string;links:readonly (readonly [string,string])[]}) { return <div><h3 className="text-sm font-bold">{title}</h3><ul className="mt-4 space-y-3">{links.map(([label,href])=><li key={label}><a href={href} className="text-sm text-muted-foreground hover:text-primary">{label}</a></li>)}</ul></div>; }
