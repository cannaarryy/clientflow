import { StatusBadge } from "./ui.js";
import { useI18n } from "../i18n/LanguageProvider.js";

export function ProductPreview() {
  const { t } = useI18n();
  return (
    <div className="overflow-hidden rounded-2xl border border-[#262626] bg-[#080808] shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)]">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-[#1e1e1e] bg-[#0D0D0D] px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#2c2c2c]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#2c2c2c]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#2c2c2c]" />
        <span className="ml-3 hidden flex-1 truncate rounded-md bg-[#141414] px-3 py-1 font-mono text-[11px] text-[#818181] sm:block">
          app.clientflow.io/app
        </span>
        <span className="ml-auto rounded-full bg-emerald-400/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-400/20">
          {t("preview.live")}
        </span>
      </div>

      <div className="grid md:grid-cols-[190px_1fr]">
        {/* Mini sidebar */}
        <div className="hidden border-r border-[#1c1c1c] bg-[#0A0A0A] p-3 md:block">
          <div className="mb-3 flex items-center gap-2 px-1">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-black ring-1 ring-[#2a2a2a]">
              <svg width="13" height="13" viewBox="0 0 32 32" fill="none"><path d="M7 22.5c3 2.4 7.2 3.4 11 2.8M7 17c3.6 2.6 8.2 3.6 12.6 2.8M7 11.5c4 2.8 9.2 3.8 14 2.8" stroke="#7C6CFF" strokeWidth="2.6" strokeLinecap="round" /></svg>
            </span>
            <span className="text-[10px] font-bold tracking-[0.18em]">{t("brand.name")}</span>
          </div>
          {[t("preview.before"), t("preview.clients"), t("preview.projects"), t("preview.tasks"), t("preview.notes"), t("preview.activity")].map((item, i) => (
            <div key={item} className={`mb-0.5 rounded-lg px-2.5 py-1.5 text-[12px] ${i === 0 ? "bg-[#181818] text-white" : "text-[#818181]"}`}>
              {item}
            </div>
          ))}
        </div>

        {/* Mini dashboard */}
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-semibold text-white">{t("preview.greeting")}</p>
              <p className="text-[11px] text-[#818181]">{t("preview.sub")}</p>
            </div>
            <span className="hidden rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-semibold text-black sm:block">{t("preview.new")}</span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
            {[
              [t("preview.statClients"), "4"],
              [t("preview.statProjects"), "2"],
              [t("preview.statTasks"), "9"],
              [t("preview.statDone"), "3"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-[#222] bg-[#0D0D0D] p-3">
                <p className="text-[10px] uppercase tracking-wider text-[#818181]">{label}</p>
                <p className="mt-0.5 text-lg font-bold text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-2 grid gap-2 lg:grid-cols-2">
            <div className="rounded-xl border border-[#222] bg-[#0D0D0D] p-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#A1A1A1]">{t("dash.upcoming")}</p>
              <div className="space-y-1.5">
                {[
                  [t("preview.task1"), "TODO"],
                  [t("preview.task2"), "IN_PROGRESS"],
                  [t("preview.task3"), "IN_PROGRESS"],
                ].map(([task, s]) => (
                  <div key={task} className="flex items-center justify-between gap-2 rounded-lg bg-[#111] px-2.5 py-2">
                    <span className="truncate text-[12px] text-[#F5F5F5]">{task}</span>
                    <StatusBadge value={s as "TODO" | "IN_PROGRESS"} />
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-[#222] bg-[#0D0D0D] p-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#A1A1A1]">{t("preview.pipeline")}</p>
              <div className="space-y-1.5">
                {[
                  [t("preview.pipe1"), "ACTIVE"],
                  [t("preview.pipe2"), "ACTIVE"],
                  [t("preview.pipe3"), "PLANNING"],
                ].map(([n, s]) => (
                  <div key={n} className="flex items-center justify-between gap-2 rounded-lg bg-[#111] px-2.5 py-2">
                    <span className="truncate text-[12px] text-[#F5F5F5]">{n}</span>
                    <StatusBadge value={s as "ACTIVE" | "PLANNING"} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-2 rounded-xl border border-[#222] bg-[#0D0D0D] p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#A1A1A1]">{t("preview.recent")}</p>
            <div className="space-y-1 text-[12px]">
              <p className="text-[#A1A1A1]"><span className="text-white">{t("preview.act1")}</span> {t("preview.act1t")} <span className="text-[#6b6b6b]">· {t("time.agoShort")}</span></p>
              <p className="text-[#A1A1A1]"><span className="text-white">{t("preview.act2")}</span> {t("preview.act2t")} <span className="text-[#6b6b6b]">· {t("time.yesterday")}</span></p>
              <p className="text-[#A1A1A1]"><span className="text-white">{t("preview.act3")}</span> {t("preview.act3t")} <span className="text-[#6b6b6b]">· {t("time.agoDays")}</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
