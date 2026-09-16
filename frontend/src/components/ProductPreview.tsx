import { StatusBadge } from "./ui.js";

/**
 * Real-component product preview used on the landing page.
 * It reuses the same visual language (cards, badges, palette)
 * as the application itself — no fake static image.
 */
export function ProductPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#262626] bg-[#080808] shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)]">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-[#1e1e1e] bg-[#0D0D0D] px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#2c2c2c]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#2c2c2c]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#2c2c2c]" />
        <span className="ml-3 hidden flex-1 truncate rounded-md bg-[#141414] px-3 py-1 font-mono text-[11px] text-[#737373] sm:block">
          app.clientflow.io/app
        </span>
        <span className="ml-auto rounded-full bg-emerald-400/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-400/20">
          ● LIVE PREVIEW
        </span>
      </div>

      <div className="grid md:grid-cols-[190px_1fr]">
        {/* Mini sidebar */}
        <div className="hidden border-r border-[#1c1c1c] bg-[#0A0A0A] p-3 md:block">
          <div className="mb-3 flex items-center gap-2 px-1">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-black ring-1 ring-[#2a2a2a]">
              <svg width="13" height="13" viewBox="0 0 32 32" fill="none"><path d="M7 22.5c3 2.4 7.2 3.4 11 2.8M7 17c3.6 2.6 8.2 3.6 12.6 2.8M7 11.5c4 2.8 9.2 3.8 14 2.8" stroke="#7C6CFF" strokeWidth="2.6" strokeLinecap="round" /></svg>
            </span>
            <span className="text-[10px] font-bold tracking-[0.18em]">CLIENTFLOW</span>
          </div>
          {["Dashboard", "Clients", "Projects", "Tasks", "Notes", "Activity"].map((item, i) => (
            <div key={item} className={`mb-0.5 rounded-lg px-2.5 py-1.5 text-[12px] ${i === 0 ? "bg-[#181818] text-white" : "text-[#737373]"}`}>
              {item}
            </div>
          ))}
        </div>

        {/* Mini dashboard */}
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-semibold text-white">Good morning, Alex</p>
              <p className="text-[11px] text-[#737373]">Here's what's happening today.</p>
            </div>
            <span className="hidden rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-semibold text-black sm:block">+ New</span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
            {[
              ["Active Clients", "4"],
              ["Active Projects", "2"],
              ["Open Tasks", "9"],
              ["Completed", "3"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-[#222] bg-[#0D0D0D] p-3">
                <p className="text-[10px] uppercase tracking-wider text-[#737373]">{label}</p>
                <p className="mt-0.5 text-lg font-bold text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-2 grid gap-2 lg:grid-cols-2">
            <div className="rounded-xl border border-[#222] bg-[#0D0D0D] p-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#A1A1A1]">Upcoming tasks</p>
              <div className="space-y-1.5">
                {[
                  ["Send Friday update to Sofia", "TODO"],
                  ["Build chart components", "IN_PROGRESS"],
                  ["Write proposal doc", "IN_PROGRESS"],
                ].map(([t, s]) => (
                  <div key={t} className="flex items-center justify-between gap-2 rounded-lg bg-[#111] px-2.5 py-2">
                    <span className="truncate text-[12px] text-[#F5F5F5]">{t}</span>
                    <StatusBadge value={s as "TODO" | "IN_PROGRESS"} />
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-[#222] bg-[#0D0D0D] p-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#A1A1A1]">Pipeline</p>
              <div className="space-y-1.5">
                {[
                  ["Nova Studio — Website Redesign", "ACTIVE"],
                  ["Lumen — Analytics Dashboard", "ACTIVE"],
                  ["Atlas — Proposal & Discovery", "PLANNING"],
                ].map(([t, s]) => (
                  <div key={t} className="flex items-center justify-between gap-2 rounded-lg bg-[#111] px-2.5 py-2">
                    <span className="truncate text-[12px] text-[#F5F5F5]">{t}</span>
                    <StatusBadge value={s as "ACTIVE" | "PLANNING"} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-2 rounded-xl border border-[#222] bg-[#0D0D0D] p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#A1A1A1]">Recent activity</p>
            <div className="space-y-1 text-[12px]">
              <p className="text-[#A1A1A1]"><span className="text-white">Task completed:</span> Draft homepage wireframes <span className="text-[#555]">· 2h ago</span></p>
              <p className="text-[#A1A1A1]"><span className="text-white">Project created:</span> Lumen — Analytics Dashboard <span className="text-[#555]">· yesterday</span></p>
              <p className="text-[#A1A1A1]"><span className="text-white">Note added:</span> Discovery call <span className="text-[#555]">· 2d ago</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
