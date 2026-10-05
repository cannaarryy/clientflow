import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Logo, StatusBadge } from "../components/ui.js";
import { ProductPreview } from "../components/ProductPreview.js";
import { useAuth } from "../hooks/AuthContext.js";
import { useI18n, LangSwitcher } from "../i18n/LanguageProvider.js";
import { api } from "../services/api.js";

export function LandingPage() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sandboxLoading, setSandboxLoading] = useState(false);

  const launchSandbox = async () => {
    setSandboxLoading(true);
    try {
      const BASE = import.meta.env.VITE_API_URL ?? "";
      const res = await fetch(`${BASE}/api/demo/sandbox`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-visitor-id": "landing-demo",
        },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!res.ok || json?.success === false) throw new Error(json?.message ?? "Failed");
      localStorage.setItem("sandboxToken", json.data.token);
      localStorage.setItem("sandboxOrgId", json.data.organization.id);
      window.location.href = "/app";
    } catch (e) {
      console.error("Failed to launch sandbox:", e);
      alert("No se pudo crear la demo. Inténtalo de nuevo.");
    } finally {
      setSandboxLoading(false);
    }
  };

  useEffect(() => {
    // Subtle reveal-on-scroll (disabled for reduced-motion users)
    const targets = document.querySelectorAll("[data-reveal]");
    if (!targets.length) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    targets.forEach((el) => el.classList.add("reveal-init"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("reveal-in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F5]">
      <Navbar loggedIn={!!user} menuOpen={menuOpen} onToggleMenu={() => setMenuOpen((v) => !v)} />
      <main>
        <Hero loggedIn={!!user} onTryDemo={launchSandbox} sandboxLoading={sandboxLoading} />
        <PreviewSection />
        <ProblemSolution />
        <Features />
        <HowItWorks />
        <InteractiveDemo />
        <UseCases />
        <Technology />
        <Roadmap />
        <FinalCTA loggedIn={!!user} />
      </main>
      <Footer />
      {menuOpen && <MobileMenu loggedIn={!!user} onClose={() => setMenuOpen(false)} />}
    </div>
  );
}

function MobileMenu({ loggedIn, onClose }: { loggedIn: boolean; onClose: () => void }) {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 z-[60] lg:hidden">
      <button aria-label={t("nav.close")} className="absolute inset-0 bg-black/70" onClick={onClose} />
      <aside className="anim-modal absolute inset-y-0 right-0 w-72 border-l border-[#222] bg-[#080808] px-5 py-6">
        <div className="mb-6 flex items-center justify-between">
          <Logo />
          <button
            onClick={onClose}
            aria-label={t("nav.close")}
            className="grid h-8 w-8 place-items-center rounded-lg text-[#A1A1A1] hover:bg-[#181818] hover:text-white"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <nav className="flex flex-col gap-1">
          {[
            ["#product", t("nav.product")],
            ["#features", t("nav.features")],
            ["#demo", t("nav.demo")],
            ["#how", t("nav.how")],
            ["#roadmap", t("nav.roadmap")],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              onClick={onClose}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#A1A1A1] transition hover:bg-[#181818] hover:text-white"
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="mt-6 border-t border-[#1c1c1c] pt-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6b6b6b]">{t("lang.label")}</span>
            <LangSwitcher />
          </div>
          <div className="mt-4 flex flex-col gap-2">
            {loggedIn ? (
              <Link to="/app" onClick={onClose} className="btn-primary w-full">{t("nav.openApp")}</Link>
            ) : (
              <>
                <Link to="/login" onClick={onClose} className="btn-ghost w-full">{t("nav.login")}</Link>
                <Link to="/register" onClick={onClose} className="btn-primary w-full">{t("nav.getStarted")}</Link>
              </>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

/* ── Navbar ─────────────────────────────────────────── */
function Navbar({ loggedIn, menuOpen, onToggleMenu }: { loggedIn: boolean; menuOpen: boolean; onToggleMenu: () => void }) {
  const { t } = useI18n();
  return (
    <header className="sticky top-0 z-50 border-b border-[#141414] bg-[#050505]/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Logo />
        <nav className="ml-6 hidden items-center gap-5 text-sm text-[#A1A1A1] md:flex">
          <a href="#product" className="transition hover:text-white">{t("nav.product")}</a>
          <a href="#features" className="transition hover:text-white">{t("nav.features")}</a>
          <a href="#demo" className="transition hover:text-white">{t("nav.demo")}</a>
          <a href="#how" className="transition hover:text-white">{t("nav.how")}</a>
          <a href="#roadmap" className="transition hover:text-white">{t("nav.roadmap")}</a>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <LangSwitcher className="hidden md:inline-flex" />
          {loggedIn ? (
            <Link to="/app" className="btn-primary !py-2">{t("nav.openApp")}</Link>
          ) : (
            <>
              <Link to="/login" className="hidden rounded-lg px-4 py-2 text-sm text-[#A1A1A1] transition hover:text-white sm:block">{t("nav.login")}</Link>
              <Link to="/register" className="btn-primary !py-2">{t("nav.getStarted")}</Link>
            </>
          )}
          <button
            onClick={onToggleMenu}
            aria-label={t("nav.menu")}
            aria-expanded={menuOpen}
            className="grid h-9 w-9 place-items-center rounded-lg text-[#A1A1A1] hover:bg-[#181818] hover:text-white lg:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {menuOpen ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}

/* ── Hero ───────────────────────────────────────────── */
function Hero({ loggedIn, onTryDemo, sandboxLoading }: { loggedIn: boolean; onTryDemo: () => void; sandboxLoading: boolean }) {
  const { t } = useI18n();
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute left-1/2 top-[-320px] h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[#7C6CFF]/[0.07] blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(#ffffff06_1px,transparent_1px),linear-gradient(90deg,#ffffff06_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
      </div>
      <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-20 text-center sm:px-6 sm:pt-28">
        <span className="anim-fade-up inline-flex items-center gap-2 rounded-full border border-[#262626] bg-[#0D0D0D] px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-[#818181]" style={{ animationDelay: "0.02s" }}>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {t("hero.badge")}
        </span>
        {/* Version badge */}
        <span className="anim-fade-up inline-flex items-center gap-1.5 mt-2 rounded-full bg-[#7C6CFF]/15 px-2.5 py-1 text-[10px] font-mono font-semibold text-[#B9B0FF] ring-1 ring-[#7C6CFF]/30" style={{ animationDelay: "0.04s" }}>
          <span className="h-1.5 w-1.5 rounded-full bg-[#7C6CFF]" />
          v0.2 — Portal + Colaboración
        </span>
        <h1 className="anim-fade-up mx-auto mt-6 max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl" style={{ animationDelay: "0.08s" }}>
          {t("hero.title1")}<br />{t("hero.title2")}
        </h1>
        <p className="anim-fade-up mx-auto mt-5 max-w-xl text-base leading-relaxed text-[#A1A1A1] sm:text-lg" style={{ animationDelay: "0.16s" }}>
          {t("hero.subtitle")}
        </p>
        <div className="anim-fade-up mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row" style={{ animationDelay: "0.24s" }}>
          <Link to={loggedIn ? "/app" : "/register"} className="btn-primary w-full !px-7 !py-3 !text-[15px] sm:w-auto">
            {loggedIn ? t("hero.ctaOpen") : t("hero.ctaStart")}
          </Link>
          <button onClick={onTryDemo} disabled={sandboxLoading} className="btn-ghost w-full !px-7 !py-3 !text-[15px] sm:w-auto">
            {sandboxLoading ? "Creando demo..." : t("hero.ctaDemo")}
          </button>
        </div>
        <p className="anim-fade-up mt-4 font-mono text-[11px] text-[#6b6b6b]" style={{ animationDelay: "0.32s" }}>{t("hero.mono")}</p>
      </div>
    </section>
  );
}

/* ── Product preview ────────────────────────────────── */
function PreviewSection() {
  const { t } = useI18n();
  return (
    <section id="product" className="mx-auto max-w-6xl scroll-mt-20 px-4 sm:px-6">
      <ProductPreview />
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] text-[#6b6b6b]">
        <span className="rounded-full border border-[#222] bg-[#0D0D0D] px-3 py-1">{t("preview.before")}</span>
        <span className="rounded-full border border-[#222] bg-[#0D0D0D] px-3 py-1">{t("preview.clients")}</span>
        <span className="rounded-full border border-[#222] bg-[#0D0D0D] px-3 py-1">{t("preview.projects")}</span>
        <span className="rounded-full border border-[#222] bg-[#0D0D0D] px-3 py-1">{t("preview.tasks")}</span>
        <span className="rounded-full border border-[#222] bg-[#0D0D0D] px-3 py-1">{t("preview.activity")}</span>
        <span className="text-[#818181]">{t("preview.unify")}</span>
      </div>
    </section>
  );
}

/* ── Problem / Solution ─────────────────────────────── */
function ProblemSolution() {
  const { t } = useI18n();
  return (
    <section className="mx-auto grid max-w-6xl gap-4 px-4 py-20 sm:px-6 lg:grid-cols-2">
      <div className="card p-6 sm:p-8">
        <p className="text-[11px] font-bold tracking-[0.18em] text-[#818181]">{t("ps.problem")}</p>
        <h2 className="mt-3 text-xl font-bold text-white sm:text-2xl">{t("ps.problemTitle")}</h2>
        <ul className="mt-5 space-y-3 text-sm leading-relaxed text-[#A1A1A1]">
          <li className="flex gap-3"><span className="text-red-400/70">✕</span>{t("ps.p1")}</li>
          <li className="flex gap-3"><span className="text-red-400/70">✕</span>{t("ps.p2")}</li>
          <li className="flex gap-3"><span className="text-red-400/70">✕</span>{t("ps.p3")}</li>
          <li className="flex gap-3"><span className="text-red-400/70">✕</span>{t("ps.p4")}</li>
        </ul>
      </div>
      <div className="card border-[#7C6CFF]/25 p-6 sm:p-8">
        <p className="text-[11px] font-bold tracking-[0.18em] text-[#B9B0FF]">{t("ps.solution")}</p>
        <h2 className="mt-3 text-xl font-bold text-white sm:text-2xl">{t("ps.solutionTitle")}</h2>
        <ul className="mt-5 space-y-3 text-sm leading-relaxed text-[#A1A1A1]">
          <li className="flex gap-3"><span className="text-emerald-400">✓</span>{t("ps.s1")}</li>
          <li className="flex gap-3"><span className="text-emerald-400">✓</span>{t("ps.s2")}</li>
          <li className="flex gap-3"><span className="text-emerald-400">✓</span>{t("ps.s3")}</li>
          <li className="flex gap-3"><span className="text-emerald-400">✓</span>{t("ps.s4")}</li>
        </ul>
      </div>
    </section>
  );
}

/* ── Features ───────────────────────────────────────── */
const FEATURES: Array<{ title: string; body: string; tag: string }> = [
  { title: "fx.clients", body: "fx.clientsBody", tag: "fx.tagCrm" },
  { title: "fx.projects", body: "fx.projectsBody", tag: "fx.tagProjects" },
  { title: "fx.tasks", body: "fx.tasksBody", tag: "fx.tagTasks" },
  { title: "fx.portal", body: "fx.portalBody", tag: "fx.tagPortal" },
  { title: "fx.auto", body: "fx.autoBody", tag: "fx.tagAuto" },
  { title: "fx.i18n", body: "fx.i18nBody", tag: "fx.tagI18n" },
  { title: "fx.notes", body: "fx.notesBody", tag: "fx.tagNotes" },
  { title: "fx.activity", body: "fx.activityBody", tag: "fx.tagActivity" },
  { title: "fx.search", body: "fx.searchBody", tag: "fx.tagSearch" },
];

function Features() {
  const { t } = useI18n();
  return (
    <section id="features" className="scroll-mt-20 border-t border-[#141414] bg-[#080808]">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <p data-reveal className="text-[11px] font-bold tracking-[0.18em] text-[#818181]">{t("fx.kicker")}</p>
        <h2 data-reveal className="mt-3 max-w-xl text-2xl font-bold tracking-tight text-white sm:text-4xl">{t("fx.title")}</h2>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} data-reveal className="card group p-6 transition hover:border-[#333]">
              <span className="inline-block rounded-full bg-[#7C6CFF]/10 px-2.5 py-1 font-mono text-[10px] text-[#B9B0FF] ring-1 ring-[#7C6CFF]/25">{t(f.tag)}</span>
              <h3 className="mt-4 text-lg font-semibold text-white">{t(f.title)}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[#A1A1A1]">{t(f.body)}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-2">
          <StatusBadge value="ACTIVE" /><StatusBadge value="LEAD" /><StatusBadge value="PLANNING" /><StatusBadge value="IN_PROGRESS" /><StatusBadge value="DONE" /><StatusBadge value="HIGH" />
          <span className="ml-1 self-center text-xs text-[#6b6b6b]">{t("fx.statusLanguage")}</span>
        </div>
      </div>
    </section>
  );
}

/* ── How it works ───────────────────────────────────── */
const STEPS: Array<{ n: string; title: string; body: string }> = [
  { n: "01", title: "how.s1t", body: "how.s1b" },
  { n: "02", title: "how.s2t", body: "how.s2b" },
  { n: "03", title: "how.s3t", body: "how.s3b" },
  { n: "04", title: "how.s4t", body: "how.s4b" },
];

function HowItWorks() {
  const { t } = useI18n();
  return (
    <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
      <p data-reveal className="text-[11px] font-bold tracking-[0.18em] text-[#818181]">{t("how.kicker")}</p>
      <h2 data-reveal className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-4xl">{t("how.title")}</h2>
      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s) => (
          <div key={s.n} data-reveal className="card p-6">
            <p className="font-mono text-xs text-[#7C6CFF]">{s.n}</p>
            <h3 className="mt-2 font-semibold text-white">{t(s.title)}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-[#A1A1A1]">{t(s.body)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Interactive demo (sandboxed, local state only) ── */
const DEMO: Record<string, { project: string; tasks: string[] }> = {
  Nova: { project: "Website Redesign", tasks: ["Draft homepage wireframes", "Design UI kit (dark)", "Copy review with client"] },
  Lumen: { project: "Analytics Dashboard", tasks: ["API contract for metrics", "Build chart components", "CSV export feature"] },
};

function InteractiveDemo() {
  const { t } = useI18n();
  const clients = Object.keys(DEMO);
  const [client, setClient] = useState(clients[0]);
  const [done, setDone] = useState<Record<string, boolean>>({ "Draft homepage wireframes": true });
  const tasks = DEMO[client].tasks;
  const doneCount = tasks.filter((x) => done[x]).length;
  const progress = Math.round((doneCount / tasks.length) * 100);
  const step = doneCount === 0 ? 2 : doneCount < tasks.length ? 3 : 4;

  const toggle = (task: string) => setDone((d) => ({ ...d, [task]: !d[task] }));

  return (
    <section id="demo" className="scroll-mt-20 border-t border-[#141414] bg-[#080808]">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="text-center">
          <span data-reveal className="inline-flex items-center gap-2 rounded-full border border-[#262626] bg-[#0D0D0D] px-3.5 py-1.5 font-mono text-[10px] tracking-[0.14em] text-[#A1A1A1]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            {t("demo.badge")}
          </span>
          <h2 data-reveal className="mx-auto mt-4 max-w-xl text-2xl font-bold tracking-tight text-white sm:text-4xl">{t("demo.title")}</h2>
          <p data-reveal className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#A1A1A1]">{t("demo.sub")}</p>
        </div>

        <div data-reveal className="mx-auto mt-8 grid max-w-4xl gap-2.5 md:grid-cols-[1fr_1.4fr]">
          {/* Steps */}
          <ol className="card space-y-1 p-3">
            {[t("demo.step1"), t("demo.step2"), t("demo.step3"), t("demo.step4")].map((label, i) => {
              const n = i + 1;
              const active = step === n;
              const passed = step > n;
              return (
                <li key={n} className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition ${active ? "bg-[#7C6CFF]/10 text-white" : passed ? "text-[#737373]" : "text-[#555]"}`}>
                  <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full font-mono text-[10px] ${passed ? "bg-emerald-400 text-black" : active ? "bg-[#7C6CFF] text-white" : "bg-[#1c1c1c] text-[#555]"}`}>
                    {passed ? "✓" : n}
                  </span>
                  {label}
                </li>
              );
            })}
            <li className="px-2.5 pt-1">
              <div className="flex items-center justify-between text-[11px] text-[#737373]"><span>{t("demo.progress", { n: progress })}</span><span>{doneCount}/{tasks.length}</span></div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#1c1c1c]"><div className="h-full rounded-full bg-[#7C6CFF] transition-all" style={{ width: `${progress}%` }} /></div>
            </li>
          </ol>

          {/* Interactive board */}
          <div className="card p-3.5">
            <div className="mb-2.5 flex flex-wrap gap-1.5">
              {clients.map((c) => (
                <button key={c} onClick={() => setClient(c)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${client === c ? "bg-white text-black" : "bg-[#111] text-[#A1A1A1] ring-1 ring-[#222] hover:text-white"}`}>
                  {c}
                </button>
              ))}
            </div>
            <p className="text-[13px] font-medium text-white">{DEMO[client].project}</p>
            <ul className="mt-2 space-y-1.5">
              {tasks.map((task) => (
                <li key={task}>
                  <button onClick={() => toggle(task)} className="flex w-full items-center gap-2.5 rounded-lg bg-[#111] px-3 py-2 text-left transition hover:bg-[#161616]">
                    <span className={`grid shrink-0 place-items-center rounded-full border ${done[task] ? "border-emerald-400 bg-emerald-400 text-black" : "border-[#444]"}`} style={{ width: 18, height: 18 }}>
                      {done[task] && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5" /></svg>}
                    </span>
                    <span className={`min-w-0 flex-1 truncate text-[13px] ${done[task] ? "text-[#555] line-through" : "text-[#F5F5F5]"}`}>{task}</span>
                  </button>
                </li>
              ))}
            </ul>
            {progress === 100 && <p className="mt-2.5 rounded-lg bg-emerald-400/10 px-3 py-2 text-center text-[13px] text-emerald-300">✓ {t("demo.done")} — Client → Project → Task → Done</p>}
          </div>
        </div>

        <div data-reveal className="mt-6 text-center">
          <Link to="/register" className="btn-primary !px-7 !py-2.5">{t("demo.cta")}</Link>
        </div>
      </div>
    </section>
  );
}

/* ── Use cases ──────────────────────────────────────── */
const CASES: Array<{ who: string; body: string }> = [
  { who: "uc.freelancers", body: "uc.freelancersBody" },
  { who: "uc.studios", body: "uc.studiosBody" },
  { who: "uc.consultants", body: "uc.consultantsBody" },
];

function UseCases() {
  const { t } = useI18n();
  return (
    <section className="border-t border-[#141414] bg-[#080808]">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <p data-reveal className="text-[11px] font-bold tracking-[0.18em] text-[#818181]">{t("uc.kicker")}</p>
        <h2 data-reveal className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-4xl">{t("uc.title")}</h2>
        <div className="mt-10 grid gap-3 md:grid-cols-3">
          {CASES.map((c) => (
            <div key={c.who} data-reveal className="card p-6">
              <h3 className="font-semibold text-white">{t(c.who)}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[#A1A1A1]">{t(c.body)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Technology ─────────────────────────────────────── */
const STACK: Array<{ name: string; desc: string }> = [
  ["tech.react", "tech.reactDesc"],
  ["tech.tailwind", "tech.tailwindDesc"],
  ["tech.node", "tech.nodeDesc"],
  ["tech.db", "tech.dbDesc"],
  ["tech.jwt", "tech.jwtDesc"],
  ["tech.zod", "tech.zodDesc"],
].map(([name, desc]) => ({ name, desc }));

function Technology() {
  const { t } = useI18n();
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
        <div>
          <p data-reveal className="text-[11px] font-bold tracking-[0.18em] text-[#818181]">{t("tech.kicker")}</p>
          <h2 data-reveal className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-4xl">{t("tech.title")}</h2>
          <p data-reveal className="mt-4 max-w-md text-sm leading-relaxed text-[#A1A1A1]">
            {t("tech.body")}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {STACK.map((item) => (
            <div key={item.name} data-reveal className="card p-4">
              <p className="font-mono text-[13px] text-white">{t(item.name)}</p>
              <p className="mt-0.5 text-xs text-[#818181]">{t(item.desc)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Roadmap ────────────────────────────────────────── */
const ROADMAP: Array<{ v: string; items: string[]; state: "done" | "now" | "later" }> = [
  { v: "rm.v01", items: ["rm.auth", "app.clients", "app.projects", "app.tasks", "app.notes", "app.dashboard", "app.activity"], state: "done" },
  { v: "rm.v02", items: ["fx.portal", "app.requests", "app.automations", "app.notifications", "fx.i18n"], state: "now" },
  { v: "rm.v03", items: ["rm.w1", "rm.w2", "rm.w3"], state: "later" },
  { v: "rm.v04", items: ["rm.t1", "rm.t2", "rm.t3"], state: "later" },
  { v: "rm.v10", items: ["rm.done"], state: "later" },
];

function Roadmap() {
  const { t } = useI18n();
  return (
    <section id="roadmap" className="scroll-mt-20 border-t border-[#141414] bg-[#080808]">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <p data-reveal className="text-[11px] font-bold tracking-[0.18em] text-[#818181]">{t("rm.kicker")}</p>
        <div data-reveal className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#7C6CFF]/15 px-3 py-1.5 text-[10px] font-mono font-semibold text-[#B9B0FF] ring-1 ring-[#7C6CFF]/30">
          <span className="h-1.5 w-1.5 rounded-full bg-[#7C6CFF]" />
          v0.2 — AHORA
        </div>
        <h2 data-reveal className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-4xl">{t("rm.title")}</h2>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ROADMAP.map((r) => (
            <div key={r.v} data-reveal className={`card p-5 ${r.state === "now" ? "!border-[#7C6CFF]/40" : ""}`}>
              <div className="flex items-center justify-between">
                <p className="font-mono text-[13px] font-semibold text-white">{t(r.v)}</p>
                {r.state === "now" ? (
                  <span className="rounded-full bg-[#7C6CFF]/15 px-2 py-0.5 text-[10px] font-bold text-[#B9B0FF]">{t("rm.now")}</span>
                ) : r.state === "done" ? (
                  <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">{t("rm.stateDone")}</span>
                ) : (
                  <span className="rounded-full bg-[#181818] px-2 py-0.5 text-[10px] font-bold text-[#818181]">{t("rm.planned")}</span>
                )}
              </div>
              <ul className="mt-3 space-y-1.5 text-sm text-[#A1A1A1]">
                {r.items.map((i) => <li key={i} className="flex gap-2"><span className="text-[#666]">—</span>{t(i)}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs text-[#6b6b6b]">{t("rm.footnote")}</p>
      </div>
    </section>
  );
}

/* ── Final CTA + Footer ─────────────────────────────── */
function FinalCTA({ loggedIn }: { loggedIn: boolean }) {
  const { t } = useI18n();
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
      <h2 className="anim-fade-up mx-auto max-w-xl text-3xl font-bold tracking-tight text-white sm:text-5xl">
        {t("cta.title1")}<br />{t("cta.title2")}
      </h2>
      <p className="anim-fade-up mx-auto mt-4 max-w-md text-[#A1A1A1]">{t("cta.sub")}</p>
      <div className="anim-fade-up mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link to={loggedIn ? "/app" : "/register"} className="btn-primary !px-8 !py-3 !text-[15px]">{loggedIn ? t("hero.ctaOpen") : t("hero.ctaStart")}</Link>
        {!loggedIn && <Link to="/login" className="btn-ghost !px-8 !py-3 !text-[15px]">{t("nav.login")}</Link>}
      </div>
    </section>
  );
}

function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-[#141414]">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <Logo />
        <p className="font-mono text-[11px] text-[#6b6b6b]">{t("footer.note")}</p>
        <div className="flex gap-4 text-xs text-[#818181]">
          <Link to="/login" className="hover:text-white">{t("nav.login")}</Link>
          <Link to="/register" className="hover:text-white">{t("nav.getStarted")}</Link>
          <Link to="/app" className="hover:text-white">{t("footer.app")}</Link>
        </div>
      </div>
    </footer>
  );
}
