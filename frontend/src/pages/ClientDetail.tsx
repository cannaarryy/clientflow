import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api.js";
import type { Activity, Client, Note } from "../types/index.js";
import { useI18n } from "../i18n/LanguageProvider.js";
import { useToast, errorMessage } from "../hooks/Toast.js";
import { StatusBadge, EmptyState, Modal, Field, VisibilityBadge } from "../components/ui.js";

interface Detail {
  client: Client;
  activities: Activity[];
}

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, timeAgo, formatDate } = useI18n();
  const { push } = useToast();
  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteModal, setNoteModal] = useState(false);
  const [noteForm, setNoteForm] = useState({ title: "", content: "", shared: false });
  const [noteBusy, setNoteBusy] = useState(false);
  const [portalBusy, setPortalBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const d = await api.get<Detail>(`/api/clients/${id}`);
      setData(d);
    } catch (e) {
      push(errorMessage(e), "error");
      navigate("/app/clients");
    } finally {
      setLoading(false);
    }
  }, [id, navigate, push]);

  useEffect(() => {
    void load();
  }, [load]);

  const portalUrl = (token?: string | null) =>
    token ? `${window.location.origin}/portal/${token}` : "";

  const setPortal = async (enabled: boolean) => {
    if (!id) return;
    setPortalBusy(true);
    try {
      await api.patch(`/api/clients/${id}/portal`, { enabled });
      push(t(enabled ? "portal.enabled" : "portal.disabledOk"), "success");
      void load();
    } catch (e) {
      push(errorMessage(e), "error");
    } finally {
      setPortalBusy(false);
    }
  };

  const regenerate = async () => {
    if (!id || !window.confirm(t("common.confirmDelete"))) return;
    setPortalBusy(true);
    try {
      await api.patch(`/api/clients/${id}/portal`, { enabled: true });
      const d = await api.post<{ portal: { portalToken: string } }>(`/api/clients/${id}/portal/regenerate`, {});
      void d;
      push(t("portal.regenerated"), "success");
      void load();
    } catch (e) {
      push(errorMessage(e), "error");
    } finally {
      setPortalBusy(false);
    }
  };

  const copyLink = async (token?: string | null) => {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(portalUrl(token));
      push(t("common.copied"), "success");
    } catch {
      push(portalUrl(token), "info");
    }
  };

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !noteForm.content.trim()) return;
    setNoteBusy(true);
    try {
      await api.post("/api/notes", { title: noteForm.title, content: noteForm.content.trim(), clientId: id, visibility: noteForm.shared ? "SHARED" : "INTERNAL" });
      setNoteModal(false);
      setNoteForm({ title: "", content: "", shared: false });
      void load();
    } catch (err) {
      push(errorMessage(err), "error");
    } finally {
      setNoteBusy(false);
    }
  };

  const deleteNote = async (n: Note) => {
    if (!window.confirm(t("common.confirmDelete"))) return;
    try {
      await api.del(`/api/notes/${n.id}`);
      void load();
    } catch (e) {
      push(errorMessage(e), "error");
    }
  };

  if (loading) return <div><div className="skeleton h-8 w-56" /><div className="skeleton mt-3 h-56" /></div>;
  if (!data) return <EmptyState title="404" action={<Link to="/app/clients" className="btn-ghost">←</Link>} />;

  const c = data.client;

  return (
    <div className="anim-fade-up">
      <Link to="/app/clients" className="text-xs text-[#737373] hover:text-white">← {t("preview.clients")}</Link>
      <div className="mt-1.5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#181818] text-base font-bold text-white ring-1 ring-[#2a2a2a]">
            {c.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
          </span>
          <div>
            <h1 className="text-xl font-bold text-white sm:text-2xl">{c.name}</h1>
            <p className="text-sm text-[#A1A1A1]">{[c.company, c.email, c.phone].filter(Boolean).join(" · ") || "—"}</p>
            <div className="mt-1.5 flex items-center gap-1.5">
              <StatusBadge value={c.status} />
              <span className="text-[11px] text-[#555]">{formatDate(c.createdAt)}</span>
            </div>
          </div>
        </div>
        <Link to={`/app/projects?client=${c.id}`} className="btn-ghost">+ {t("preview.projects")}</Link>
      </div>

      {/* Client Portal panel */}
      <section className={`card mt-3.5 p-3.5 ${c.portalEnabled ? "border-[#7C6CFF]/30" : ""}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-white">{t("portal.panel")}</h2>
          {c.portalEnabled ? <VisibilityBadge value="SHARED" /> : null}
        </div>
        {!c.portalEnabled ? (
          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
            <p className="max-w-xl text-[13px] text-[#A1A1A1]">{t("portal.disabled")}</p>
            <button onClick={() => void setPortal(true)} disabled={portalBusy} className="btn-primary !py-2 !text-xs">{t("portal.enable")}</button>
          </div>
        ) : (
          <div className="mt-2 space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input className="input flex-1 font-mono !text-xs" readOnly value={portalUrl(c.portalToken)} onFocus={(e) => e.target.select()} />
              <div className="flex gap-1.5">
                <button onClick={() => void copyLink(c.portalToken)} className="btn-ghost !py-2 !text-xs">{t("common.copy")}</button>
                <button onClick={() => void regenerate()} disabled={portalBusy} className="btn-ghost !py-2 !text-xs">{t("portal.regenerate")}</button>
                <button onClick={() => void setPortal(false)} disabled={portalBusy} className="rounded-lg px-3 py-2 text-xs text-[#737373] hover:bg-red-950/40 hover:text-red-300">{t("portal.disable")}</button>
              </div>
            </div>
            <p className="text-[11px] text-[#555]">{t("portal.sharedNote")}</p>
          </div>
        )}
      </section>

      {c.notes && (
        <div className="card mt-3 border-l-2 !border-l-[#7C6CFF] p-3.5">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#F5F5F5]">{c.notes}</p>
        </div>
      )}

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <section className="card p-3.5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">{t("preview.projects")} ({c.projects?.length ?? 0})</h2>
            <Link to="/app/projects" className="text-xs text-[#A1A1A1] hover:text-white">{t("app.viewAll")}</Link>
          </div>
          {!c.projects?.length ? (
            <p className="py-2 text-center text-sm text-[#555]">—</p>
          ) : (
            <ul className="space-y-1.5">
              {c.projects.map((proj) => (
                <li key={proj.id}>
                  <Link to={`/app/projects/${proj.id}`} className="flex items-center gap-2.5 rounded-lg bg-[#111] px-3 py-2 transition hover:bg-[#161616]">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] text-white">{proj.name}</span>
                      <span className="text-[11px] text-[#555]">{t(`st.${proj.status}`)} · {t(`st.${proj.priority}`)}</span>
                    </span>
                    {proj.isShared && <VisibilityBadge value="SHARED" />}
                    <StatusBadge value={proj.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-3.5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">{t("cd.requests", { n: c.requests?.length ?? 0 })}</h2>
            <Link to="/app/requests" className="text-xs text-[#A1A1A1] hover:text-white">{t("app.viewAll")}</Link>
          </div>
          {!c.requests?.length ? (
            <p className="py-2 text-center text-sm text-[#555]">{t("cd.noRequests")}</p>
          ) : (
            <ul className="space-y-1.5">
              {c.requests.map((r) => (
                <li key={r.id} className="flex items-center gap-2.5 rounded-lg bg-[#111] px-3 py-2">
                  <span className="min-w-0 flex-1 truncate text-[13px] text-white">{r.title}</span>
                  <StatusBadge value={r.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card mt-3 p-3.5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">{t("pd.tabNotes")} ({c.notesList?.length ?? 0})</h2>
          <button onClick={() => setNoteModal(true)} className="btn-ghost !py-1.5 !text-xs">+</button>
        </div>
        {!c.notesList?.length ? (
          <p className="py-2 text-center text-sm text-[#555]">—</p>
        ) : (
          <ul className="grid gap-1.5 md:grid-cols-2">
            {c.notesList.map((n) => (
              <li key={n.id} className="rounded-lg bg-[#111] p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[13px] font-medium text-white">{n.title || "—"}</p>
                  <div className="flex shrink-0 items-center gap-1">
                    <VisibilityBadge value={n.visibility ?? "INTERNAL"} />
                    <button onClick={() => void deleteNote(n)} className="text-[11px] text-[#555] hover:text-red-300">✕</button>
                  </div>
                </div>
                <p className="mt-0.5 whitespace-pre-wrap text-[13px] text-[#A1A1A1]">{n.content}</p>
                <p className="mt-1 text-[11px] text-[#555]">{timeAgo(n.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {data.activities.length > 0 && (
        <section className="card mt-3 p-3.5">
          <h2 className="mb-2 text-sm font-semibold text-white">{t("preview.activity")}</h2>
          <ul className="space-y-1.5">
            {data.activities.map((a) => (
              <li key={a.id} className="flex gap-2.5 text-[13px] text-[#A1A1A1]">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7C6CFF]" />
                <span>{a.message} <span className="text-[11px] text-[#555]">· {timeAgo(a.createdAt)}</span></span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Modal open={noteModal} onClose={() => setNoteModal(false)} title={t("n.newNote")}>
        <form onSubmit={addNote} className="space-y-3.5">
          <Field label={t("n.titleOpt")}><input className="input" value={noteForm.title} onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })} /></Field>
          <Field label={t("n.contentLabel")}><textarea className="input min-h-[110px] resize-y" value={noteForm.content} onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })} required /></Field>
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-[#737373]">
            <input type="checkbox" checked={noteForm.shared} onChange={(e) => setNoteForm({ ...noteForm, shared: e.target.checked })} className="h-3.5 w-3.5 accent-[#7C6CFF]" />
            {t("vis.shareWithClient")}
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setNoteModal(false)} className="btn-ghost">{t("common.cancel")}</button>
            <button className="btn-primary" disabled={noteBusy}>{noteBusy ? t("common.saving") : t("common.add")}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
