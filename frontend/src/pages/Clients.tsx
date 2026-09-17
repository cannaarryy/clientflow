import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../services/api.js";
import type { Client, ClientStatus } from "../types/index.js";
import { useToast, errorMessage } from "../hooks/Toast.js";
import { useI18n } from "../i18n/LanguageProvider.js";
import { PageHeader, StatusBadge, EmptyState, Modal, Field, SkeletonList } from "../components/ui.js";
import { initials } from "../utils/format.js";

const STATUSES: Array<ClientStatus | "ALL"> = ["ALL", "ACTIVE", "LEAD", "INACTIVE"];

export function ClientsPage() {
  const { push } = useToast();
  const { t, formatDate, plural } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ClientStatus | "ALL">("ALL");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", notes: "", status: "ACTIVE" as ClientStatus });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (status !== "ALL") params.set("status", status);
      const data = await api.get<{ clients: Client[] }>(`/api/clients?${params.toString()}`);
      setClients(data.clients);
    } catch (e) {
      push(errorMessage(e, "Could not load clients"), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", company: "", email: "", phone: "", notes: "", status: "ACTIVE" });
    setModal(true);
  };

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      openCreate();
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openEdit = (c: Client) => {
    setEditing(c);
    setForm({ name: c.name, company: c.company ?? "", email: c.email ?? "", phone: c.phone ?? "", notes: c.notes ?? "", status: c.status });
    setModal(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      push(t("cl.nameRequired"), "error");
      return;
    }
    setBusy(true);
    try {
      if (editing) {
        await api.patch(`/api/clients/${editing.id}`, { ...form, name: form.name.trim() });
        push(t("cl.updated"), "success");
      } else {
        await api.post("/api/clients", { ...form, name: form.name.trim() });
        push(t("cl.created"), "success");
      }
      setModal(false);
      void load();
    } catch (err) {
      push(errorMessage(err, "cl.saveError"), "error");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (c: Client) => {
    if (!window.confirm(t("cl.deleteConfirm", { name: c.name }))) return;
    try {
      await api.del(`/api/clients/${c.id}`);
      push(t("cl.deleted"), "success");
      setClients((list) => list.filter((x) => x.id !== c.id));
    } catch (e) {
      push(errorMessage(e, "cl.deleteError"), "error");
    }
  };

  const filtered = useMemo(() => clients, [clients]);

  return (
    <div className="anim-fade-up min-w-0">
      <PageHeader
        title={t("cl.title")}
        subtitle={plural(filtered.length, "cl.subCount", "cl.subCountPlural")}
        action={<button onClick={openCreate} className="btn-primary">{t("cl.new")}</button>}
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input className="input sm:max-w-xs" placeholder={t("cl.search")} value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="flex gap-1.5">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition ${status === s ? "bg-white text-black" : "bg-[#111] text-[#A1A1A1] ring-1 ring-[#222] hover:text-white"}`}
            >
              {t(s === "ALL" ? "cl.all" : `st.${s}`)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <SkeletonList />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={search || status !== "ALL" ? t("cl.notFound") : t("cl.notFound")}
          hint={search || status !== "ALL" ? t("cl.notFoundHint") : t("cl.notFoundHint")}
          action={search || status !== "ALL" ? undefined : <button onClick={openCreate} className="btn-primary">{t("cl.notFoundAction")}</button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <div key={c.id} className="card group p-4 transition hover:border-[#333]">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#181818] text-xs font-bold text-[#A1A1A1] ring-1 ring-[#2a2a2a]">
                  {initials(c.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <Link to={`/app/clients/${c.id}`} className="block truncate font-semibold text-white hover:underline">{c.name}</Link>
                  <p className="truncate text-xs text-[#818181]">{c.company ?? c.email ?? "—"}</p>
                </div>
                <StatusBadge value={c.status} />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-[#818181]">
                <span>{c._count ? t("cl.counts", { p: c._count.projects, t: c._count.tasks }) : t("cl.since", { date: formatDate(c.createdAt) })}</span>
              </div>
              <div className="mt-3 flex gap-2 border-t border-[#1c1c1c] pt-3">
                <Link to={`/app/clients/${c.id}`} className="btn-ghost flex-1 !py-1.5 !text-xs">{t("cl.open")}</Link>
                <button onClick={() => openEdit(c)} className="btn-ghost flex-1 !py-1.5 !text-xs">{t("cl.edit")}</button>
                <button onClick={() => void remove(c)} className="rounded-lg px-3 py-1.5 text-xs text-[#818181] hover:bg-red-950/40 hover:text-red-300">{t("cl.delete")}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? t("cl.edit") + " " + t("cl.title").toLowerCase() : t("cl.new")}>
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("auth.name") + " *"}><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Sofia Bennett" required /></Field>
            <Field label={t("cl.company")}><input className="input" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Nova Studio" /></Field>
            <Field label={t("cl.email")}><input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="sofia@studio.co" /></Field>
            <Field label={t("cl.phone")}><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 415 555 0132" /></Field>
            <Field label={t("cl.status")}>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ClientStatus })}>
                <option value="ACTIVE">{t("st.ACTIVE")}</option>
                <option value="LEAD">{t("st.LEAD")}</option>
                <option value="INACTIVE">{t("st.INACTIVE")}</option>
              </select>
            </Field>
            <div />
          </div>
          <Field label={t("cl.notes")}><textarea className="input min-h-[90px] resize-y" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Context, preferences, agreements…" /></Field>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setModal(false)} className="btn-ghost">{t("cl.cancel")}</button>
            <button className="btn-primary" disabled={busy}>{busy ? t("cl.saving") : editing ? t("cl.saveChanges") : t("cl.create")}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
