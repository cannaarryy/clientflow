import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import { useAuth } from "../hooks/AuthContext.js";
import { useI18n } from "../i18n/LanguageProvider.js";
import { useToast, errorMessage } from "../hooks/Toast.js";
import { PageHeader, Field } from "../components/ui.js";

export function SettingsPage() {
  const { user, refresh } = useAuth();
  const { push } = useToast();
  const { t, formatDate } = useI18n();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [busy, setBusy] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwBusy, setPwBusy] = useState(false);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.patch("/api/user/profile", { name: name.trim(), email: email.trim() });
      await refresh();
      push(t("set.updated"), "success");
    } catch (err) {
      push(errorMessage(err, t("set.updateError")), "error");
    } finally {
      setBusy(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.next.length < 8) {
      push(t("set.pwTooShort"), "error");
      return;
    }
    if (pw.next !== pw.confirm) {
      push(t("set.pwMismatch"), "error");
      return;
    }
    setPwBusy(true);
    try {
      await api.patch("/api/user/password", { currentPassword: pw.current, newPassword: pw.next });
      setPw({ current: "", next: "", confirm: "" });
      push(t("set.pwUpdated"), "success");
    } catch (err) {
      push(errorMessage(err, t("set.pwError")), "error");
    } finally {
      setPwBusy(false);
    }
  };

  return (
    <div className="anim-fade-up max-w-2xl">
      <PageHeader title={t("set.title")} subtitle={t("set.sub")} />

      <section className="card p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-white">{t("set.profile")}</h2>
        <p className="mt-0.5 text-xs text-[#737373]">{t("set.memberSince", { date: formatDate(user?.createdAt) })}</p>
        <form onSubmit={saveProfile} className="mt-3.5 space-y-3.5">
          <Field label={t("auth.name")}><input className="input" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} /></Field>
          <Field label={t("auth.email")}><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
          <div className="flex justify-end"><button className="btn-primary" disabled={busy}>{busy ? t("common.saving") : t("common.save")}</button></div>
        </form>
      </section>

      <section className="card mt-3 p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-white">{t("set.password")}</h2>
        <p className="mt-0.5 text-xs text-[#737373]">{t("set.pwHint")}</p>
        <form onSubmit={changePassword} className="mt-3.5 space-y-3.5">
          <Field label={t("set.currentPw")}><input type="password" className="input" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} required autoComplete="current-password" /></Field>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label={t("set.newPw")}><input type="password" className="input" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} required minLength={8} autoComplete="new-password" /></Field>
            <Field label={t("set.confirmPw")}><input type="password" className="input" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} required autoComplete="new-password" /></Field>
          </div>
          <div className="flex justify-end"><button className="btn-ghost" disabled={pwBusy}>{pwBusy ? t("set.updating") : t("set.changePw")}</button></div>
        </form>
      </section>

      <section className="card mt-3 p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-white">{t("set.sessions")}</h2>
        <p className="mt-1 text-sm text-[#A1A1A1]">{t("set.sessionsBody")}</p>
      </section>

      <section className="card mt-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-white">{t("auto.title")}</h2>
            <p className="mt-0.5 text-xs text-[#737373]">{t("auto.sub")}</p>
          </div>
          <Link to="/app/automations" className="btn-ghost !py-2 !text-xs">{t("app.viewAll")}</Link>
        </div>
      </section>
    </div>
  );
}
