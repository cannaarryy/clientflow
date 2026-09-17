import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { MSG, type Lang } from "./translations.js";

const STORAGE_KEY = "clientflow.lang";

function detectLang(): Lang {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "es" || saved === "en") return saved;
  return navigator.language?.toLowerCase().startsWith("es") ? "es" : "en";
}

export interface I18n {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  formatDate: (value?: string | null) => string;
  formatDateTime: (value?: string | null) => string;
  timeAgo: (value?: string | null) => string;
  greeting: (name?: string) => string;
  plural: (n: number, singularKey: string, pluralKey: string) => string;
  errorMessage: (err: unknown, fallbackKey?: string) => string;
  activityMessage: (type: string, fallback: string) => string;
}

const I18nContext = createContext<I18n | null>(null);

export function translate(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  const entry = MSG[key];
  let out = entry ? entry[lang] : key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) out = out.replace(`{${k}}`, String(v));
  }
  return out;
}

function localeOf(lang: Lang): string {
  return lang === "es" ? "es-ES" : "en-US";
}

function applyDocs(lang: Lang) {
  document.documentElement.lang = lang === "es" ? "es" : "en";
  document.title = translate(lang, "meta.title");
  document.querySelector('meta[name="description"]')?.setAttribute("content", translate(lang, "meta.description"));
}

const KNOWN_ERRORS: Array<[RegExp, string]> = [
  [/invalid email or password/i, "auth.badCredentials"],
  [/invalid credentials/i, "auth.badCredentials"],
  [/email already registered/i, "auth.emailTaken"],
  [/password must/i, "auth.pwShort"],
];

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang);

  const setLang = useCallback((l: Lang) => {
    localStorage.setItem(STORAGE_KEY, l);
    setLangState(l);
  }, []);

  useEffect(() => {
    applyDocs(lang);
  }, [lang]);

  const value = useMemo<I18n>(() => ({
    lang,
    setLang,
    t: (key, vars) => translate(lang, key, vars),
    formatDate: (v) => {
      if (!v) return "—";
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) return "—";
      return d.toLocaleDateString(localeOf(lang), { month: "short", day: "numeric", year: "numeric" });
    },
    formatDateTime: (v) => {
      if (!v) return "—";
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) return "—";
      return d.toLocaleString(localeOf(lang), { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    },
    timeAgo: (v) => {
      if (!v) return "";
      const d = new Date(v).getTime();
      if (Number.isNaN(d)) return "";
      const diff = Date.now() - d;
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return translate(lang, "time.justNow");
      if (mins < 60) return translate(lang, "time.minAgo", { n: mins });
      const hours = Math.floor(mins / 60);
      if (hours < 24) return translate(lang, "time.hourAgo", { n: hours });
      const days = Math.floor(hours / 24);
      if (days < 7) return translate(lang, "time.dayAgo", { n: days });
      return new Date(d).toLocaleDateString(localeOf(lang), { month: "short", day: "numeric", year: "numeric" });
    },
    greeting: (name) => {
      const h = new Date().getHours();
      const part = h < 12 ? translate(lang, "greet.morning") : h < 19 ? translate(lang, "greet.afternoon") : translate(lang, "greet.evening");
      const first = (name ?? "").trim().split(" ")[0];
      return first ? `${part}, ${first}` : part;
    },
    plural: (n, oneKey, manyKey) => translate(lang, n === 1 ? oneKey : manyKey, { n }),
    errorMessage: (err, fallbackKey) => {
      if (err instanceof Error && err.message) {
        for (const [re, k] of KNOWN_ERRORS) if (re.test(err.message)) return translate(lang, k);
        return err.message;
      }
      return translate(lang, fallbackKey ?? "common.error");
    },
    activityMessage: (type, fallback) => {
      const entry = MSG[`actMsg.${type}`];
      return entry ? entry[lang] : fallback;
    },
  }), [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within LanguageProvider");
  return ctx;
}

/** Pill switcher: ES / EN */
export function LangSwitcher({ className = "" }: { className?: string }) {
  const { lang, setLang, t } = useI18n();
  return (
    <div
      className={`inline-flex items-center gap-0.5 rounded-lg border border-[#222] bg-[#111] p-0.5 ${className}`}
      role="group"
      aria-label={t("lang.label")}
    >
      {(["es", "en"] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`rounded-md px-2 py-1 text-[11px] font-semibold transition ${
            lang === l ? "bg-white text-black" : "text-[#A1A1A1] hover:text-white"
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}