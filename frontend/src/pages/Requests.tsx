import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../services/api.js";
import type { Client, ClientRequest, Priority, Project, RequestStatus } from "../types/index.js";
import { useI18n } from "../i18n/LanguageProvider.js";
import { useToast, errorMessage } from "../hooks/Toast.js";
import { PageHeader, StatusBadge, EmptyState, Modal, Field, SkeletonList } from "../components/ui.js";
import { Comments } from "../components/Comments.js";

const STATUSES: Array<RequestStatus | "ALL"> = ["ALL", "OPEN", "IN_PROGRESS", "CONVERTED", "DECLINED"];

export function RequestsPage() {
  const { t, timeAgo } = useI18n();
  const { push } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<ClientRequest[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<RequestStatus | "ALL">("ALL");
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState<ClientRequest | null>(null);
  const [form, setForm] = useState({ title: "", description: "", clientId: "", projectId: "", priority: "MEDIUM" as Priority });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status !== "ALL") params.set("status", status);
      const [r, c, p] = await Promise.all([
        api.get<{ requests: ClientRequest[] }>(`/api/requests?${params.toString()}`),
        clients.length ? null : api.get<{ clients: Client[] }>("/api/clients"),
        projects.length ? null : api.get<{ projects: Project[] }>("/api/projects"),
      ]);
      setItems(r.requests);
      if (c) setClients(c.clients);
      if (p) setProjects(p.projects);
    } catch (e) {
      push(errorMessage(e, t("req.loadError")), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setModal(true);
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDetail = async (id: string) => {
    try {
      const d = await api.get<{ request: ClientRequest }>(`/api/requests/${id}`);
      setSelected(d.request);
    } catch (e) {
      push(errorMessage(e), "error");
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.clientId) {
      push(t("req.saveError"), "error");
      return;
    }
    setBusy(true);
    try {
      await api.post("/api/requests", { ...form, title: form.title.trim(), projectId: form.projectId || undefined });
      push(t("req.created"), "success");
      setModal(false);
      setForm({ title: "", description: "", clientId: "", projectId: "", priority: "MEDIUM" });
      void load();
    } catch (err) {
      push(errorMessage(err, t("req.saveError")), "error");
    } finally {
      setBusy(false);
    }
  };

  const setReqStatus = async (r: ClientRequest, s: RequestStatus) => {
    try {
      await api.patch(`/api/requests/${r.id}`, { status: s });
      setItems((l) => l.map((x) => (x.id === r.id ? { ...x, status: s } : x)));
      if (selected?.id === r.id) setSelected({ ...selected, status: s });
    } catch (e) {
      push(errorMessage(e), "error");
    }
  };

  const convert = async (r: ClientRequest) => {
    try {
      const d = await api.post<{ task: { id: string } }>(`/api/requests/${r.id}/convert`, {});
      push(t("req.converted"), "success");
      setItems((l) => l.map((x) => (x.id === r.id ? { ...x, status: "CONVERTED" as RequestStatus } : x)));
      if (selected?.id === r.id) void openDetail(r.id);
      return d;
    } catch (e) {
      push(errorMessage(e, t("req.convertError")), "error");
      return null;
    }
  };

  return (
    <div className="anim-fade-up">
      <PageHeader
        title={t("req.title")}
        subtitle={t("req.sub", { n: items.length })}
        action={<button onClick={() => setModal(true)} className="btn-primary">{t("req.new")}</button>}
      />

      <div className="mb-4 flex flex-wrap gap-1.5">
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${status === s ? "bg-white text-black" : "bg-[#111] text-[#A1A1A1] ring-1 ring-[#222] hover:text-white"}`}>
            {s === "ALL" ? t("common.all") : t(`st.${s}`)}
          </button>
        ))}
      </div>

      {loading ? <SkeletonList /> : items.length === 0 ? (
        <EmptyState title={t("req.empty")} hint={t("req.emptyHint")} action={<button onClick={() => setModal(true)} className="btn-primary">{t("req.new")}</button>} />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          <ul className="space-y-2">
            {items.map((r) => (
              <li key={r.id}>
                <button onClick={() => void openDetail(r.id)} className={`card w-full p-3.5 text-left transition hover:border-[#333] ${selected?.id === r.id ? "!border-[#7C6CFF]/50" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 flex-1 truncate text-sm font-medium text-white">{r.title}</p>
                    <StatusBadge value={r.status} />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-[#737373]">
                    {(r.client?.company ?? r.client?.name ?? "") + (r.createdBy === "CLIENT" ? ` · ${t("req.fromClient")}` : "")}
                  </p>
                  <p className="mt-1 text-[11px] text-[#555]">{timeAgo(r.createdAt)} · {t(`st.${r.priority}`)}</p>
                </button>
              </li>
            ))}
          </ul>

          <div className="lg:sticky lg:top-4 lg:self-start">
            {!selected ? (
              <div className="card hidden p-6 text-center text-sm text-[#555] lg:block">←</div>
            ) : (
              <div className="card anim-fade-up p-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-base font-semibold text-white">{selected.title}</h2>
                  <button onClick={() => setSelected(null)} className="text-xs text-[#555] hover:text-white">✕</button>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <StatusBadge value={selected.status} />
                  <StatusBadge value={selected.priority} />
                  <span className="text-[11px] text-[#555]">{selected.createdBy === "CLIENT" ? t("req.fromClient") : t("req.fromYou")}</span>
                </div>
                {selected.description && <p className="mt-2.5 whitespace-pre-wrap text-sm leading-relaxed text-[#A1A1A1]">{selected.description}</p>}
                <div className="mt-2 text-xs text-[#737373]">
                  {t("req.client")} <Link to={`/app/clients/${selected.clientId}`} className="text-white hover:underline">{selected.client?.name}</Link>
                  {selected.project && <> · <Link to={`/app/projects/${selected.project.id}`} className="hover:text-white hover:underline">{selected.project.name}</Link></>}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[#1c1c1c] pt-3">
                  {selected.status !== "CONVERTED" && (
                    <button onClick={() => void convert(selected)} className="btn-primary !py-1.5 !text-xs">{t("req.convert")}</button>
                  )}
                  {selected.status === "OPEN" && <button onClick={() => void setReqStatus(selected, "IN_PROGRESS")} className="btn-ghost !py-1.5 !text-xs">{t("st.IN_PROGRESS")}</button>}
                  {selected.status !== "DECLINED" && selected.status !== "CONVERTED" && (
                    <button onClick={() => void setReqStatus(selected, "DECLINED")} className="rounded-lg px-3 py-1.5 text-xs text-[#737373] hover:bg-red-950/40 hover:text-red-300">{t("st.DECLINED")}</button>
                  )}
                </div>
                <div className="mt-3 border-t border-[#1c1c1c] pt-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#737373]">{t("req.comments")}</p>
                  <Comments scope={{ requestId: selected.id }} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={t("req.new")}>
        <form onSubmit={save} className="space-y-3.5">
          <Field label={t("req.titleLabel")}><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Field>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label={t("req.client")}>
              <select className="input" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value, projectId: "" })} required>
                <option value="">…</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.company ?? c.name}</option>)}
              </select>
            </Field>
            <Field label={t("req.project")}>
              <select className="input" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                <option value="">{t("req.noProject")}</option>
                {(form.clientId ? projects.filter((p) => p.clientId === form.clientId) : projects).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
          </div>
          <Field label={t("req.priorityLabel")}>
            <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}>
              <option value="LOW">{t("st.LOW")}</option><option value="MEDIUM">{t("st.MEDIUM")}</option><option value="HIGH">{t("st.HIGH")}</option>
            </select>
          </Field>
          <Field label={t("req.descLabel")}><textarea className="input min-h-[90px] resize-y" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModal(false)} className="btn-ghost">{t("common.cancel")}</button>
            <button className="btn-primary" disabled={busy}>{busy ? t("common.saving") : t("common.create")}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
