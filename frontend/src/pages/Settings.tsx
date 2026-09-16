import { useState } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../hooks/AuthContext.js";
import { useToast, errorMessage } from "../hooks/Toast.js";
import { PageHeader, Field } from "../components/ui.js";
import { formatDate } from "../utils/format.js";

export function SettingsPage() {
  const { user, refresh } = useAuth();
  const { push } = useToast();
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
      push("Profile updated", "success");
    } catch (err) {
      push(errorMessage(err, "Could not update profile"), "error");
    } finally {
      setBusy(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.next.length < 8) {
      push("New password must be at least 8 characters", "error");
      return;
    }
    if (pw.next !== pw.confirm) {
      push("New passwords do not match", "error");
      return;
    }
    setPwBusy(true);
    try {
      await api.patch("/api/user/password", { currentPassword: pw.current, newPassword: pw.next });
      setPw({ current: "", next: "", confirm: "" });
      push("Password updated", "success");
    } catch (err) {
      push(errorMessage(err, "Could not change password"), "error");
    } finally {
      setPwBusy(false);
    }
  };

  return (
    <div className="anim-fade-up max-w-2xl">
      <PageHeader title="Settings" subtitle="Manage your profile and account" />

      <section className="card p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-white">Profile</h2>
        <p className="mt-0.5 text-xs text-[#737373]">Member since {formatDate(user?.createdAt)}</p>
        <form onSubmit={saveProfile} className="mt-4 space-y-4">
          <Field label="Name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} /></Field>
          <Field label="Email"><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
          <div className="flex justify-end"><button className="btn-primary" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button></div>
        </form>
      </section>

      <section className="card mt-4 p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-white">Password</h2>
        <p className="mt-0.5 text-xs text-[#737373]">Use at least 8 characters.</p>
        <form onSubmit={changePassword} className="mt-4 space-y-4">
          <Field label="Current password"><input type="password" className="input" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} required autoComplete="current-password" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="New password"><input type="password" className="input" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} required minLength={8} autoComplete="new-password" /></Field>
            <Field label="Confirm new password"><input type="password" className="input" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} required autoComplete="new-password" /></Field>
          </div>
          <div className="flex justify-end"><button className="btn-ghost" disabled={pwBusy}>{pwBusy ? "Updating…" : "Change password"}</button></div>
        </form>
      </section>

      <section className="card mt-4 p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-white">Sessions</h2>
        <p className="mt-1 text-sm text-[#A1A1A1]">Authentication uses a secure HTTP-only cookie. Logging out clears your session on this device.</p>
      </section>
    </div>
  );
}
