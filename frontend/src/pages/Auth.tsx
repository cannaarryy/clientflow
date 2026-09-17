import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "../components/ui.js";
import { useAuth } from "../hooks/AuthContext.js";
import { useToast, errorMessage } from "../hooks/Toast.js";
import { useI18n, LangSwitcher } from "../i18n/LanguageProvider.js";

export function LoginPage() {
  const { login } = useAuth();
  const { push } = useToast();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate("/app");
    } catch (err) {
      push(errorMessage(err, "Could not log in"), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="mt-2 flex justify-end"><LangSwitcher /></div>
        <div className="card anim-fade-up p-6 sm:p-8">
          <h1 className="text-xl font-bold text-white">{t("auth.welcome")}</h1>
          <p className="mt-1 text-sm text-[#A1A1A1]">{t("auth.loginSub")}</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="email">{t("auth.email")}</label>
              <input id="email" className="input" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@studio.co" />
            </div>
            <div>
              <label className="label" htmlFor="password">{t("auth.password")}</label>
              <input id="password" className="input" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <button className="btn-primary w-full" disabled={busy}>{busy ? t("auth.loggingIn") : t("nav.login")}</button>
          </form>
          <p className="mt-4 rounded-lg bg-[#111] px-3 py-2 text-center font-mono text-[11px] leading-relaxed text-[#818181]">
            {t("auth.demo")}<br /><span className="text-[#A1A1A1]">demo@clientflow.io / Demo1234!</span>
          </p>
          <p className="mt-5 text-center text-sm text-[#A1A1A1]">
            {t("auth.noAccount")} <Link to="/register" className="font-medium text-white hover:underline">{t("auth.createOne")}</Link>
          </p>
        </div>
        <p className="mt-6 text-center text-xs text-[#6b6b6b]"><Link to="/" className="hover:text-[#A1A1A1]">{t("auth.backToSite")}</Link></p>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const { push } = useToast();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      push(t("auth.pwShort"), "error");
      return;
    }
    setBusy(true);
    try {
      await register(name.trim(), email.trim(), password);
      push(t("auth.welcomeMsg"), "success");
      navigate("/app");
    } catch (err) {
      push(errorMessage(err, "Could not create account"), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="mt-2 flex justify-end"><LangSwitcher /></div>
        <div className="card anim-fade-up p-6 sm:p-8">
          <h1 className="text-xl font-bold text-white">{t("auth.registerTitle")}</h1>
          <p className="mt-1 text-sm text-[#A1A1A1]">{t("auth.registerSub")}</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="name">{t("auth.name")}</label>
              <input id="name" className="input" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Rivera" autoComplete="name" />
            </div>
            <div>
              <label className="label" htmlFor="email">{t("auth.email")}</label>
              <input id="email" className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@studio.co" autoComplete="email" />
            </div>
            <div>
              <label className="label" htmlFor="password">{t("auth.password")}</label>
              <input id="password" className="input" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("auth.min8")} autoComplete="new-password" />
            </div>
            <button className="btn-primary w-full" disabled={busy}>{busy ? t("auth.creating") : t("nav.getStarted")}</button>
          </form>
          <p className="mt-5 text-center text-sm text-[#A1A1A1]">
            {t("auth.haveAccount")} <Link to="/login" className="font-medium text-white hover:underline">{t("nav.login")}</Link>
          </p>
        </div>
        <p className="mt-6 text-center text-xs text-[#6b6b6b]"><Link to="/" className="hover:text-[#A1A1A1]">{t("auth.backToSite")}</Link></p>
      </div>
    </div>
  );
}
