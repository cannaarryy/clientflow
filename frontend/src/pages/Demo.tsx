import { useState } from "react";
import { useI18n } from "../i18n/LanguageProvider.js";
import { Link } from "react-router-dom";
import { StatusBadge } from "../components/ui.js";
import { LangSwitcher } from "../i18n/LanguageProvider.js";

/* ── Interactive demo (sandboxed, local state only) ── */
const DEMO: Record<string, { project: string; tasks: string[] }> = {
  Nova: { project: "Website Redesign", tasks: ["Draft homepage wireframes", "Design UI kit (dark)", "Copy review with client"] },
  Lumen: { project: "Analytics Dashboard", tasks: ["API contract for metrics", "Build chart components", "CSV export feature"] },
};

export function DemoPage() {
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
    <div className="min-h-screen bg-[#050505] text-[#F5F5F5]">
      <Navbar loggedIn={false} menuOpen={false} onToggleMenu={() => {}} />
      <main>
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
      </main>
    </div>
  );
}

function Navbar({ loggedIn, menuOpen, onToggleMenu }: { loggedIn: boolean; menuOpen: boolean; onToggleMenu: () => void }) {
  const { t } = useI18n();
  return (
    <header className="sticky top-0 z-50 border-b border-[#141414] bg-[#050505]/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Logo />
        <nav className="ml-6 hidden items-center gap-5 text-sm text-[#A1A1A1] md:flex">
          <a href="/#product" className="transition hover:text-white">{t("nav.product")}</a>
          <a href="/#features" className="transition hover:text-white">{t("nav.features")}</a>
          <a href="/#demo" className="transition hover:text-white">{t("nav.demo")}</a>
          <a href="/#how" className="transition hover:text-white">{t("nav.how")}</a>
          <a href="/#roadmap" className="transition hover:text-white">{t("nav.roadmap")}</a>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <LangSwitcher className="hidden md:inline-flex" />
          {false ? (
            <Link to="/app" className="btn-primary !py-2">{t("nav.openApp")}</Link>
          ) : (
            <>
              <Link to="/login" className="hidden rounded-lg px-4 py-2 text-sm text-[#A1A1A1] transition hover:text-white sm:block">{t("nav.login")}</Link>
              <Link to="/register" className="btn-primary !py-2">{t("nav.getStarted")}</Link>
            </>
          )}
          <button
            onClick={() => {}}
            aria-label={t("nav.menu")}
            aria-expanded={false}
            className="grid h-9 w-9 place-items-center rounded-lg text-[#A1A1A1] hover:bg-[#181818] hover:text-white lg:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
          </button>
        </div>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#000" />
      <path d="M9 21.5c2.5 2 6 3 9.5 2.5M9 16.5c3 2.2 7 3.2 11 2.5M9 11.5c3.5 2.4 8 3.4 12.5 2.5" stroke="#7C6CFF" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    </svg>
  );
}