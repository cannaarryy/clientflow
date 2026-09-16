import { Link } from "react-router-dom";
import { Logo, StatusBadge } from "../components/ui.js";
import { ProductPreview } from "../components/ProductPreview.js";
import { useAuth } from "../hooks/AuthContext.js";

export function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F5]">
      <Navbar loggedIn={!!user} />
      <main>
        <Hero loggedIn={!!user} />
        <PreviewSection />
        <ProblemSolution />
        <Features />
        <HowItWorks />
        <UseCases />
        <Technology />
        <Roadmap />
        <FinalCTA loggedIn={!!user} />
      </main>
      <Footer />
    </div>
  );
}

/* ── Navbar ─────────────────────────────────────────── */
function Navbar({ loggedIn }: { loggedIn: boolean }) {
  return (
    <header className="sticky top-0 z-50 border-b border-[#141414] bg-[#050505]/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Logo />
        <nav className="ml-6 hidden items-center gap-5 text-sm text-[#A1A1A1] md:flex">
          <a href="#product" className="transition hover:text-white">Product</a>
          <a href="#features" className="transition hover:text-white">Features</a>
          <a href="#how" className="transition hover:text-white">How it works</a>
          <a href="#roadmap" className="transition hover:text-white">Roadmap</a>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {loggedIn ? (
            <Link to="/app" className="btn-primary !py-2">Open app →</Link>
          ) : (
            <>
              <Link to="/login" className="hidden rounded-lg px-4 py-2 text-sm text-[#A1A1A1] transition hover:text-white sm:block">Log in</Link>
              <Link to="/register" className="btn-primary !py-2">Get started</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

/* ── Hero ───────────────────────────────────────────── */
function Hero({ loggedIn }: { loggedIn: boolean }) {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute left-1/2 top-[-320px] h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[#7C6CFF]/[0.07] blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(#ffffff06_1px,transparent_1px),linear-gradient(90deg,#ffffff06_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
      </div>
      <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-20 text-center sm:px-6 sm:pt-28">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#262626] bg-[#0D0D0D] px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-[#A1A1A1]">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          BUILT FOR MODERN WORK
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl">
          Manage clients.<br />Move work forward.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[#A1A1A1] sm:text-lg">
          ClientFlow is the minimal workspace for freelancers and small teams.
          Clients, projects, tasks, notes and activity — in one calm, fast place.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to={loggedIn ? "/app" : "/register"} className="btn-primary w-full !px-7 !py-3 !text-[15px] sm:w-auto">
            {loggedIn ? "Open your workspace →" : "Get started"}
          </Link>
          <Link to={loggedIn ? "/app" : "/login"} className="btn-ghost w-full !px-7 !py-3 !text-[15px] sm:w-auto">
            View demo
          </Link>
        </div>
        <p className="mt-4 font-mono text-[11px] text-[#555]">v0.1 MVP · Free for early users · No credit card</p>
      </div>
    </section>
  );
}

/* ── Product preview ────────────────────────────────── */
function PreviewSection() {
  return (
    <section id="product" className="mx-auto max-w-6xl scroll-mt-20 px-4 sm:px-6">
      <ProductPreview />
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] text-[#555]">
        <span className="rounded-full border border-[#222] bg-[#0D0D0D] px-3 py-1">Dashboard</span>
        <span className="rounded-full border border-[#222] bg-[#0D0D0D] px-3 py-1">Clients</span>
        <span className="rounded-full border border-[#222] bg-[#0D0D0D] px-3 py-1">Projects</span>
        <span className="rounded-full border border-[#222] bg-[#0D0D0D] px-3 py-1">Tasks</span>
        <span className="rounded-full border border-[#222] bg-[#0D0D0D] px-3 py-1">Activity</span>
        <span className="text-[#737373]">— one visual language, marketing to app.</span>
      </div>
    </section>
  );
}

/* ── Problem / Solution ─────────────────────────────── */
function ProblemSolution() {
  return (
    <section className="mx-auto grid max-w-6xl gap-4 px-4 py-20 sm:px-6 lg:grid-cols-2">
      <div className="card p-6 sm:p-8">
        <p className="text-[11px] font-bold tracking-[0.18em] text-[#737373]">THE PROBLEM</p>
        <h2 className="mt-3 text-xl font-bold text-white sm:text-2xl">Client work scatters everywhere.</h2>
        <ul className="mt-5 space-y-3 text-sm leading-relaxed text-[#A1A1A1]">
          <li className="flex gap-3"><span className="text-red-400/70">✕</span>Contacts in email, tasks in another app, notes nowhere.</li>
          <li className="flex gap-3"><span className="text-red-400/70">✕</span>Enterprise CRMs are heavy, expensive and built for sales teams.</li>
          <li className="flex gap-3"><span className="text-red-400/70">✕</span>Spreadsheets break the moment work gets real.</li>
          <li className="flex gap-3"><span className="text-red-400/70">✕</span>You lose context every time you switch tools.</li>
        </ul>
      </div>
      <div className="card border-[#7C6CFF]/25 p-6 sm:p-8">
        <p className="text-[11px] font-bold tracking-[0.18em] text-[#B9B0FF]">THE SOLUTION</p>
        <h2 className="mt-3 text-xl font-bold text-white sm:text-2xl">One flow: Clients → Projects → Tasks.</h2>
        <ul className="mt-5 space-y-3 text-sm leading-relaxed text-[#A1A1A1]">
          <li className="flex gap-3"><span className="text-emerald-400">✓</span>Every client has projects, tasks, notes and history in one view.</li>
          <li className="flex gap-3"><span className="text-emerald-400">✓</span>Designed for people who do the work — not for admins.</li>
          <li className="flex gap-3"><span className="text-emerald-400">✓</span>Fast, keyboard-friendly, calm by default.</li>
          <li className="flex gap-3"><span className="text-emerald-400">✓</span>Your data is isolated, private and always yours.</li>
        </ul>
      </div>
    </section>
  );
}

/* ── Features ───────────────────────────────────────── */
const FEATURES = [
  { title: "Clients", body: "Every relationship in one place — contact details, status, projects, tasks, notes and full history.", tag: "CRM without the bloat" },
  { title: "Projects", body: "Attach projects to clients with status, priority and dates. See progress at a glance.", tag: "Planning → Active → Done" },
  { title: "Tasks", body: "List and kanban views, priorities and due dates. Advance work with one click.", tag: "List + Kanban" },
  { title: "Notes", body: "Decisions, context and follow-ups linked to the right client or project.", tag: "Never lose context" },
  { title: "Activity", body: "An automatic timeline of everything: created, completed, updated.", tag: "Full trail" },
  { title: "Global search", body: "Find any client, project or task in milliseconds with ⌘K.", tag: "⌘K / Ctrl K" },
];

function Features() {
  return (
    <section id="features" className="scroll-mt-20 border-t border-[#141414] bg-[#080808]">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <p className="text-[11px] font-bold tracking-[0.18em] text-[#737373]">FEATURES</p>
        <h2 className="mt-3 max-w-xl text-2xl font-bold tracking-tight text-white sm:text-4xl">Everything you need. Nothing you don't.</h2>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card group p-6 transition hover:border-[#333]">
              <span className="inline-block rounded-full bg-[#7C6CFF]/10 px-2.5 py-1 font-mono text-[10px] text-[#B9B0FF] ring-1 ring-[#7C6CFF]/25">{f.tag}</span>
              <h3 className="mt-4 text-lg font-semibold text-white">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[#A1A1A1]">{f.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-2">
          <StatusBadge value="ACTIVE" /><StatusBadge value="LEAD" /><StatusBadge value="PLANNING" /><StatusBadge value="IN_PROGRESS" /><StatusBadge value="DONE" /><StatusBadge value="HIGH" />
          <span className="ml-1 self-center text-xs text-[#555]">— one consistent status language everywhere</span>
        </div>
      </div>
    </section>
  );
}

/* ── How it works ───────────────────────────────────── */
const STEPS = [
  { n: "01", title: "Add a client", body: "Name, company, contact. Thirty seconds. They become the home for everything." },
  { n: "02", title: "Create a project", body: "Attach it to the client, set status, priority and dates. Scope is now visible." },
  { n: "03", title: "Break it into tasks", body: "List or kanban. Assign due dates. Move cards from to-do to done." },
  { n: "04", title: "Work the flow", body: "Notes, activity and search keep context one keystroke away. Repeat." },
];

function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
      <p className="text-[11px] font-bold tracking-[0.18em] text-[#737373]">HOW IT WORKS</p>
      <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-4xl">Client → Project → Task → Done.</h2>
      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s) => (
          <div key={s.n} className="card p-6">
            <p className="font-mono text-xs text-[#7C6CFF]">{s.n}</p>
            <h3 className="mt-2 font-semibold text-white">{s.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-[#A1A1A1]">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Use cases ──────────────────────────────────────── */
const CASES = [
  { who: "Freelancers", body: "Juggle 5–10 clients without dropping balls. Every follow-up has a home." },
  { who: "Small studios", body: "Share one calm source of truth for projects, deadlines and client context." },
  { who: "Consultants", body: "Proposals, discovery notes and delivery — traceable per client." },
];

function UseCases() {
  return (
    <section className="border-t border-[#141414] bg-[#080808]">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <p className="text-[11px] font-bold tracking-[0.18em] text-[#737373]">USE CASES</p>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-4xl">Built for people who do the work.</h2>
        <div className="mt-10 grid gap-3 md:grid-cols-3">
          {CASES.map((c) => (
            <div key={c.who} className="card p-6">
              <h3 className="font-semibold text-white">{c.who}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[#A1A1A1]">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Technology ─────────────────────────────────────── */
const STACK = [
  ["React + TypeScript", "Type-safe UI"],
  ["Tailwind CSS", "Design system"],
  ["Node.js + Express", "REST API"],
  ["PostgreSQL + Prisma", "Relational data"],
  ["JWT cookies", "Secure sessions"],
  ["Zod", "Validation everywhere"],
];

function Technology() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-[11px] font-bold tracking-[0.18em] text-[#737373]">TECHNOLOGY</p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-4xl">Boring tech, done right.</h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-[#A1A1A1]">
            A modern, maintainable stack with strict separation of concerns.
            Relational data modeled properly, validated on both ends, multi-user
            isolation from day one — and an architecture ready for webhooks,
            automation and AI assistance when they earn their place.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {STACK.map(([name, desc]) => (
            <div key={name} className="card p-4">
              <p className="font-mono text-[13px] text-white">{name}</p>
              <p className="mt-0.5 text-xs text-[#737373]">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Roadmap ────────────────────────────────────────── */
const ROADMAP: Array<{ v: string; items: string[]; state: "done" | "now" | "later" }> = [
  { v: "v0.1 — MVP", items: ["Auth", "Clients", "Projects", "Tasks", "Notes", "Dashboard", "Activity"], state: "now" },
  { v: "v0.2", items: ["Advanced search", "Analytics", "Notifications"], state: "later" },
  { v: "v0.3", items: ["Automation", "Integrations", "Team collaboration"], state: "later" },
  { v: "v1.0", items: ["Stable production release"], state: "later" },
];

function Roadmap() {
  return (
    <section id="roadmap" className="scroll-mt-20 border-t border-[#141414] bg-[#080808]">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <p className="text-[11px] font-bold tracking-[0.18em] text-[#737373]">ROADMAP</p>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-4xl">Starting small, thinking long-term.</h2>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ROADMAP.map((r) => (
            <div key={r.v} className={`card p-5 ${r.state === "now" ? "!border-[#7C6CFF]/40" : ""}`}>
              <div className="flex items-center justify-between">
                <p className="font-mono text-[13px] font-semibold text-white">{r.v}</p>
                {r.state === "now" ? (
                  <span className="rounded-full bg-[#7C6CFF]/15 px-2 py-0.5 text-[10px] font-bold text-[#B9B0FF]">NOW</span>
                ) : (
                  <span className="rounded-full bg-[#181818] px-2 py-0.5 text-[10px] font-bold text-[#737373]">PLANNED</span>
                )}
              </div>
              <ul className="mt-3 space-y-1.5 text-sm text-[#A1A1A1]">
                {r.items.map((i) => <li key={i} className="flex gap-2"><span className="text-[#555]">—</span>{i}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs text-[#555]">Future integrations (email, calendar, webhooks, Stripe, Slack) are architecture-ready — not MVP promises.</p>
      </div>
    </section>
  );
}

/* ── Final CTA + Footer ─────────────────────────────── */
function FinalCTA({ loggedIn }: { loggedIn: boolean }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
      <h2 className="mx-auto max-w-xl text-3xl font-bold tracking-tight text-white sm:text-5xl">Stop juggling.<br />Start flowing.</h2>
      <p className="mx-auto mt-4 max-w-md text-[#A1A1A1]">Create your workspace in under a minute. Your future self will thank you.</p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link to={loggedIn ? "/app" : "/register"} className="btn-primary !px-8 !py-3 !text-[15px]">{loggedIn ? "Open your workspace →" : "Get started"}</Link>
        {!loggedIn && <Link to="/login" className="btn-ghost !px-8 !py-3 !text-[15px]">Log in</Link>}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[#141414]">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <Logo />
        <p className="font-mono text-[11px] text-[#555]">CLIENTFLOW v0.1 — Manage clients. Move work forward.</p>
        <div className="flex gap-4 text-xs text-[#737373]">
          <Link to="/login" className="hover:text-white">Log in</Link>
          <Link to="/register" className="hover:text-white">Get started</Link>
          <Link to="/app" className="hover:text-white">App</Link>
        </div>
      </div>
    </footer>
  );
}
