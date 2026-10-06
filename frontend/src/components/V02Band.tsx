import { Link } from "react-router-dom";
import { useI18n } from "../i18n/LanguageProvider.js";

export function V02Band() {
  const { t } = useI18n();
  return (
    <section id="v02" className="scroll-mt-20 border-t border-[#141414] bg-[#080808]">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div data-reveal className="mx-auto max-w-xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#7C6CFF]/15 px-3 py-1.5 text-[10px] font-mono font-semibold text-[#B9B0FF] ring-1 ring-[#7C6CFF]/30">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7C6CFF]" />
            {t("v02.kicker")}
          </span>
          <h2 data-reveal className="mx-auto mt-4 max-w-xl text-2xl font-bold tracking-tight text-white sm:text-4xl">{t("v02.title")}</h2>
          <p data-reveal className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#A1A1A1]">{t("v02.sub")}</p>
        </div>

        <div data-reveal className="mx-auto mt-10 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: "🔗", title: "v02.portal", body: "v02.portalBody", cta: "v02.cta" },
            { icon: "📨", title: "v02.requests", body: "v02.requestsBody", cta: "v02.cta" },
            { icon: "⚙️", title: "v02.auto", body: "v02.autoBody", cta: "v02.cta" },
            { icon: "🔔", title: "v02.notif", body: "v02.notifBody", cta: "v02.cta" },
            { icon: "🌐", title: "v02.i18n", body: "v02.i18nBody", cta: "v02.cta" },
          ].map((item, i) => (
            <div key={item.title} data-reveal className="card p-5 sm:p-6 transition hover:border-[#333]">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#7C6CFF]/10 px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] text-[#B9B0FF] ring-1 ring-[#7C6CFF]/25">{item.icon}</span>
              <h3 className="mt-4 text-lg font-semibold text-white">{t(item.title)}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[#A1A1A1]">{t(item.body)}</p>
              <Link to="/demo" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#7C6CFF] hover:text-white">
                {t(item.cta)} <span>→</span>
              </Link>
            </div>
          ))}
        </div>

        <div data-reveal className="mt-8 text-center">
          <Link to="/demo" className="btn-primary !px-7 !py-2.5">{t("v02.cta")}</Link>
        </div>
      </div>
    </section>
  );
}