import { Link } from "react-router-dom";
import { useI18n } from "../i18n/LanguageProvider.js";

export function NotFoundPage() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#050505] px-4 text-center">
      <p className="font-mono text-sm text-[#7C6CFF]">404</p>
      <h1 className="mt-2 text-2xl font-bold text-white">{t("nf.title")}</h1>
      <p className="mt-1 text-sm text-[#A1A1A1]">{t("nf.sub")}</p>
      <div className="mt-6 flex gap-2">
        <Link to="/" className="btn-ghost">{t("nf.back")}</Link>
        <Link to="/app" className="btn-primary">{t("nf.openApp")}</Link>
      </div>
    </div>
  );
}
