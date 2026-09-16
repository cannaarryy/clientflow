import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import type { Client, Note, Project } from "../types/index.js";
import { useToast, errorMessage } from "../hooks/Toast.js";
import { PageHeader, EmptyState, Modal, Field, SkeletonList } from "../components/ui.js";
import { timeAgo } from "../utils/format.js";

export function NotesPage() {
  const { push } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [form, setForm] = useState({ title: "", content: "", clientId: "", projectId: "" });
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
      push(errorMessage(e, "Could not load notes"), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", content: "", clientId: clients[0]?.id ?? "", projectId: "" });
    setModal(true);
  };

  const openEdit = (n: Note) => {
    setEditing(n);
    setForm({ title: n.title ?? "", content: n.content, clientId: n.clientId ?? "", projectId: n.projectId ?? "" });
    setModal(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.content.trim() || (!form.clientId && !form.projectId && !editing)) {
      push("Content and a client or project are required", "error");
      return;
    }
    setBusy(true);
    try {
      if (editing) {
        await api.patch(`/api/notes/${editing.id}`, { title: form.title, content: form.content.trim() });
        push("Note updated", "success");
      } else {
        await api.post("/api/notes", { title: form.title, content: form.content.trim(), clientId: form.clientId || undefined, projectId: form.projectId || undefined });
        push("Note created", "success");
      }
      setModal(false);
      void load();
    } catch (err) {
      push(errorMessage(err, "Could not save note"), "error");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (n: Note) => {
    if (!window.confirm("Delete this note?")) return;
    try {
      await api.del(`/api/notes/${n.id}`);
      setNotes((l) => l.filter((x) => x.id !== n.id));
      push("Note deleted", "success");
    } catch (e) {
      push(errorMessage(e, "Could not delete note"), "error");
    }
  };

  return (
    <div className="anim-fade-up">
      <PageHeader title="Notes" subtitle={`${notes.length} note${notes.length === 1 ? "" : "s"}`} action={<button onClick={openCreate} className="btn-primary">+ New note</button>} />

      {loading ? <SkeletonList /> : notes.length === 0 ? (
        <EmptyState title="No notes yet" hint="Capture decisions, context and follow-ups linked to clients or projects." action={<button onClick={openCreate} className="btn-primary">+ Create note</button>} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {notes.map((n) => (
            <article key={n.id} className="card flex flex-col p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-white">{n.title || "Untitled note"}</h3>
                <div className="flex shrink-0 gap-1">
                  <button onClick={() => openEdit(n)} className="rounded px-2 py-1 text-xs text-[#A1A1A1] hover:bg-[#181818] hover:text-white">Edit</button>
                  <button onClick={() => void remove(n)} className="rounded px-2 py-1 text-xs text-[#555] hover:bg-red-950/40 hover:text-red-300">Delete</button>
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

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Edit note" : "New note"}>
        <form onSubmit={save} className="space-y-4">
          <Field label="Title (optional)"><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Meeting takeaways" /></Field>
          {!editing && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Client">
                <select className="input" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value, projectId: "" })}>
                  <option value="">Select…</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.company ?? c.name}</option>)}
                </select>
              </Field>
              <Field label="Project">
                <select className="input" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                  <option value="">Select…</option>
                  {(form.clientId ? projects.filter((p) => p.clientId === form.clientId) : projects).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
            </div>
          )}
          <Field label="Content *"><textarea className="input min-h-[140px] resize-y" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Write the note…" required /></Field>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModal(false)} className="btn-ghost">Cancel</button>
            <button className="btn-primary" disabled={busy}>{busy ? "Saving…" : editing ? "Save changes" : "Create note"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
