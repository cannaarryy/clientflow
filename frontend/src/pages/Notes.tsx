import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../services/api.js";
import type { Client, Note, Project, Visibility } from "../types/index.js";
import { useToast, errorMessage } from "../hooks/Toast.js";
import { useI18n } from "../i18n/LanguageProvider.js";
import { PageHeader, EmptyState, Modal, Field, SkeletonList, VisibilityBadge } from "../components/ui.js";
import { timeAgo } from "../utils/format.js";

export function NotesPage() {
  const { push } = useToast();
  const { t, timeAgo, plural } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [notes, setNotes] = useState<Note[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [form, setForm] = useState({ title: "", content: "", clientId: "", projectId: "", visibility: "INTERNAL" as Visibility });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [n, c, p] = await Promise.all([
        api.get<{ notes: Note[] }>("/api/notes"),
        clients.length ? null : api.get<{ clients: Client[] }>("/api/clients"),
        projects.length ? null : api.get<{ projects: Project[] }>("/api/projects"),
      ]);
      setNotes(n.notes);
      if (c) setClients(c.clients);
      if (p) setProjects(p.projects);
    } catch (e) {
      push(errorMessage(e, t("n.loadError")), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      openCreate();
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", content: "", clientId: clients[0]?.id ?? "", projectId: "", visibility: "INTERNAL" });
    setModal(true);
  };

  const openEdit = (n: Note) => {
    setEditing(n);
    setForm({ title: n.title ?? "", content: n.content, clientId: n.clientId ?? "", projectId: n.projectId ?? "", visibility: n.visibility ?? "INTERNAL" });
    setModal(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.content.trim() || (!form.clientId && !form.projectId && !editing)) {
      push(t("n.titleReq"), "error");
      return;
    }
    setBusy(true);
    try {
      if (editing) {
        await api.patch(`/api/notes/${editing.id}`, { title: form.title, content: form.content.trim(), visibility: form.visibility });
        push(t("n.updated"), "success");
      } else {
        await api.post("/api/notes", { title: form.title, content: form.content.trim(), clientId: form.clientId || undefined, projectId: form.projectId || undefined, visibility: form.visibility });
        push(t("n.createdMsg"), "success");
      }
      setModal(false);
      void load();
    } catch (err) {
      push(errorMessage(err, t("n.saveError")), "error");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (n: Note) => {
    if (!window.confirm(t("cd.noteDeleteConfirm"))) return;
    try {
      await api.del(`/api/notes/${n.id}`);
      setNotes((l) => l.filter((x) => x.id !== n.id));
      push(t("cd.noteDeleted"), "success");
    } catch (e) {
      push(errorMessage(e, t("n.saveError")), "error");
    }
  };

  return (
    <div className="anim-fade-up">
      <PageHeader title={t("n.title")} subtitle={plural(notes.length, "n.subCount", "n.subCountPlural")} action={<button onClick={openCreate} className="btn-primary">{t("n.new")}</button>} />

      {loading ? <SkeletonList /> : notes.length === 0 ? (
        <EmptyState title={t("n.empty")} hint={t("n.emptyHint")} action={<button onClick={openCreate} className="btn-primary">{t("n.create")}</button>} />
      ) : (
        <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
          {notes.map((n) => (
            <article key={n.id} className="card flex flex-col p-3.5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-white">{n.title || t("cd.untitled")}</h3>
                <div className="flex shrink-0 items-center gap-1">
                  <VisibilityBadge value={n.visibility ?? "INTERNAL"} />
                  <button onClick={() => openEdit(n)} className="rounded px-2 py-1 text-xs text-[#A1A1A1] hover:bg-[#181818] hover:text-white">{t("common.edit")}</button>
                  <button onClick={() => void remove(n)} className="rounded px-2 py-1 text-xs text-[#555] hover:bg-red-950/40 hover:text-red-300">{t("common.delete")}</button>
                </div>
              </div>
              <p className="mt-1 flex-1 whitespace-pre-wrap text-sm leading-relaxed text-[#A1A1A1]">{n.content}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#1c1c1c] pt-3 text-[11px]">
                {n.project ? <Link to={`/app/projects/${n.project.id}`} className="rounded-full bg-[#7C6CFF]/10 px-2 py-0.5 text-[#B9B0FF] hover:underline">{n.project.name}</Link>
                  : n.client ? <Link to={`/app/clients/${n.client.id}`} className="rounded-full bg-[#181818] px-2 py-0.5 text-[#A1A1A1] hover:underline">{n.client.company ?? n.client.name}</Link> : null}
                <span className="ml-auto text-[#555]">{timeAgo(n.createdAt)}</span>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? t("n.editNote") : t("n.newNote")}>
        <form onSubmit={save} className="space-y-3.5">
          <Field label={t("n.titleOpt")}><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={t("n.meetingPh")} /></Field>
          {!editing && (
            <div className="grid gap-3.5 sm:grid-cols-2">
              <Field label={t("n.client")}>
                <select className="input" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value, projectId: "" })}>
                  <option value="">{t("n.select")}</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.company ?? c.name}</option>)}
                </select>
              </Field>
              <Field label={t("n.project")}>
                <select className="input" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                  <option value="">{t("n.select")}</option>
                  {(form.clientId ? projects.filter((p) => p.clientId === form.clientId) : projects).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
            </div>
          )}
          <Field label={t("n.contentLabel")}><textarea className="input min-h-[140px] resize-y" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder={t("n.writing")} required /></Field>
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-[#737373]">
            <input type="checkbox" checked={form.visibility === "SHARED"} onChange={(e) => setForm({ ...form, visibility: e.target.checked ? "SHARED" : "INTERNAL" })} className="h-3.5 w-3.5 accent-[#7C6CFF]" />
            {t("vis.shareWithClient")}
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModal(false)} className="btn-ghost">{t("common.cancel")}</button>
            <button className="btn-primary" disabled={busy}>{busy ? t("common.saving") : editing ? t("common.save") : t("n.create")}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
