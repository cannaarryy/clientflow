import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api.js";
import type { Activity, Client, Note } from "../types/index.js";
import { useToast, errorMessage } from "../hooks/Toast.js";
import { StatusBadge, EmptyState, Modal, Field } from "../components/ui.js";
import { formatDate, timeAgo, initials } from "../utils/format.js";

interface Detail {
  client: Client;
  activities: Activity[];
}

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { push } = useToast();
  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteModal, setNoteModal] = useState(false);
  const [noteForm, setNoteForm] = useState({ title: "", content: "" });
  const [noteBusy, setNoteBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const d = await api.get<Detail>(`/api/clients/${id}`);
      setData(d);
    } catch (e) {
      push(errorMessage(e, "Client not found"), "error");
      navigate("/app/clients");
    } finally {
      setLoading(false);
    }
  }, [id, navigate, push]);

  useEffect(() => {
    void load();
  }, [load]);

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !noteForm.content.trim()) {
      push("Note content is required", "error");
      return;
    }
    setNoteBusy(true);
    try {
      await api.post("/api/notes", { title: noteForm.title, content: noteForm.content.trim(), clientId: id });
      push("Note added", "success");
      setNoteModal(false);
      setNoteForm({ title: "", content: "" });
      void load();
    } catch (err) {
      push(errorMessage(err, "Could not add note"), "error");
    } finally {
      setNoteBusy(false);
    }
  };

  const deleteNote = async (n: Note) => {
    if (!window.confirm("Delete this note?")) return;
    try {
      await api.del(`/api/notes/${n.id}`);
      push("Note deleted", "success");
      void load();
    } catch (e) {
      push(errorMessage(e, "Could not delete note"), "error");
    }
  };

  if (loading) return <div><div className="skeleton h-8 w-56" /><div className="skeleton mt-4 h-64" /></div>;
  if (!data) return <EmptyState title="Client not found" action={<Link to="/app/clients" className="btn-ghost">Back to clients</Link>} />;

  const c = data.client;

  return (
    <div className="anim-fade-up">
      <Link to="/app/clients" className="text-xs text-[#737373] hover:text-white">← All clients</Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#181818] text-lg font-bold text-white ring-1 ring-[#2a2a2a]">{initials(c.name)}</span>
          <div>
            <h1 className="text-2xl font-bold text-white">{c.name}</h1>
            <p className="text-sm text-[#A1A1A1]">{[c.company, c.email, c.phone].filter(Boolean).join(" · ") || "No contact details"}</p>
            <div className="mt-2 flex items-center gap-2">
              <StatusBadge value={c.status} />
              <span className="text-xs text-[#555]">Client since {formatDate(c.createdAt)}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/app/projects?client=${c.id}`} className="btn-ghost">+ New project</Link>
        </div>
      </div>

      {c.notes && (
        <div className="card mt-5 border-l-2 !border-l-[#7C6CFF] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">About</p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[#F5F5F5]">{c.notes}</p>
        </div>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Projects ({c.projects?.length ?? 0})</h2>
            <Link to="/app/projects" className="text-xs text-[#A1A1A1] hover:text-white">View all →</Link>
          </div>
          {!c.projects?.length ? (
            <p className="py-3 text-center text-sm text-[#737373]">No projects yet.</p>
          ) : (
            <ul className="space-y-2">
              {c.projects.map((p) => (
                <li key={p.id}>
                  <Link to={`/app/projects/${p.id}`} className="flex items-center gap-3 rounded-lg bg-[#111] px-3 py-2.5 transition hover:bg-[#161616]">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-white">{p.name}</span>
                      <span className="text-xs text-[#737373]">{p.status.replace("_", " ")} · {p.priority}</span>
                    </span>
                    <StatusBadge value={p.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Tasks ({c.tasks?.length ?? 0})</h2>
            <Link to="/app/tasks" className="text-xs text-[#A1A1A1] hover:text-white">View all →</Link>
          </div>
          {!c.tasks?.length ? (
            <p className="py-3 text-center text-sm text-[#737373]">No tasks yet.</p>
          ) : (
            <ul className="space-y-2">
              {c.tasks.slice(0, 8).map((t) => (
                <li key={t.id} className="flex items-center gap-3 rounded-lg bg-[#111] px-3 py-2.5">
                  <span className="min-w-0 flex-1 truncate text-sm text-white">{t.title}</span>
                  <StatusBadge value={t.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card mt-4 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Notes ({c.notesList?.length ?? 0})</h2>
          <button onClick={() => setNoteModal(true)} className="btn-ghost !py-1.5 !text-xs">+ Add note</button>
        </div>
        {!c.notesList?.length ? (
          <p className="py-3 text-center text-sm text-[#737373]">No notes yet. Capture context, decisions and follow-ups here.</p>
        ) : (
          <ul className="space-y-2">
            {c.notesList.map((n) => (
              <li key={n.id} className="rounded-lg bg-[#111] p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-white">{n.title || "Untitled note"}</p>
                  <button onClick={() => void deleteNote(n)} className="text-xs text-[#555] hover:text-red-300">Delete</button>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-[#A1A1A1]">{n.content}</p>
                <p className="mt-1 text-[11px] text-[#555]">{timeAgo(n.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {data.activities.length > 0 && (
        <section className="card mt-4 p-5">
          <h2 className="mb-3 text-sm font-semibold text-white">Activity</h2>
          <ul className="space-y-2">
            {data.activities.map((a) => (
              <li key={a.id} className="flex gap-3 text-sm text-[#A1A1A1]">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7C6CFF]" />
                <span>{a.message} <span className="text-xs text-[#555]">· {timeAgo(a.createdAt)}</span></span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Modal open={noteModal} onClose={() => setNoteModal(false)} title="Add note">
        <form onSubmit={addNote} className="space-y-4">
          <Field label="Title (optional)"><input className="input" value={noteForm.title} onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })} placeholder="Discovery takeaways" /></Field>
          <Field label="Content *"><textarea className="input min-h-[120px] resize-y" value={noteForm.content} onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })} placeholder="Write the note…" required /></Field>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setNoteModal(false)} className="btn-ghost">Cancel</button>
            <button className="btn-primary" disabled={noteBusy}>{noteBusy ? "Saving…" : "Add note"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
