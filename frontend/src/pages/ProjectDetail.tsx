import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api.js";
import type { Note, Project, TaskStatus } from "../types/index.js";
import { useToast, errorMessage } from "../hooks/Toast.js";
import { StatusBadge, EmptyState, Modal, Field } from "../components/ui.js";
import { formatDate, timeAgo } from "../utils/format.js";

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { push } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [taskTitle, setTaskTitle] = useState("");
  const [noteModal, setNoteModal] = useState(false);
  const [noteForm, setNoteForm] = useState({ title: "", content: "" });

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const d = await api.get<{ project: Project }>(`/api/projects/${id}`);
      setProject(d.project);
    } catch (e) {
      push(errorMessage(e, "Project not found"), "error");
      navigate("/app/projects");
    } finally {
      setLoading(false);
    }
  }, [id, navigate, push]);

  useEffect(() => {
    void load();
  }, [load]);

  const quickAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !project) return;
    try {
      await api.post("/api/tasks", { title: taskTitle.trim(), projectId: project.id, clientId: project.clientId });
      push("Task created", "success");
      setTaskTitle("");
      void load();
    } catch (err) {
      push(errorMessage(err, "Could not create task"), "error");
    }
  };

  const cycleStatus = async (taskId: string, current: TaskStatus) => {
    const next: TaskStatus = current === "TODO" ? "IN_PROGRESS" : current === "IN_PROGRESS" ? "DONE" : "TODO";
    try {
      await api.patch(`/api/tasks/${taskId}`, { status: next });
      void load();
    } catch (e) {
      push(errorMessage(e, "Could not update task"), "error");
    }
  };

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !noteForm.content.trim()) return;
    try {
      await api.post("/api/notes", { title: noteForm.title, content: noteForm.content.trim(), projectId: project.id, clientId: project.clientId });
      push("Note added", "success");
      setNoteModal(false);
      setNoteForm({ title: "", content: "" });
      void load();
    } catch (err) {
      push(errorMessage(err, "Could not add note"), "error");
    }
  };

  const deleteNote = async (n: Note) => {
    if (!window.confirm("Delete this note?")) return;
    try {
      await api.del(`/api/notes/${n.id}`);
      void load();
    } catch (e) {
      push(errorMessage(e, "Could not delete note"), "error");
    }
  };

  if (loading) return <div><div className="skeleton h-8 w-56" /><div className="skeleton mt-4 h-64" /></div>;
  if (!project) return <EmptyState title="Project not found" action={<Link to="/app/projects" className="btn-ghost">Back to projects</Link>} />;

  const done = project.tasks?.filter((t) => t.status === "DONE").length ?? 0;
  const total = project.tasks?.length ?? 0;
  const progress = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="anim-fade-up">
      <Link to="/app/projects" className="text-xs text-[#737373] hover:text-white">← All projects</Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">{project.name}</h1>
          <p className="mt-1 text-sm text-[#A1A1A1]">
            {project.client && <Link to={`/app/clients/${project.clientId}`} className="hover:text-white hover:underline">{project.client.name}</Link>}
            {project.dueDate ? ` · Due ${formatDate(project.dueDate)}` : " · No due date"}
          </p>
          <div className="mt-2 flex gap-2"><StatusBadge value={project.status} /><StatusBadge value={project.priority} /></div>
        </div>
      </div>

      {project.description && <p className="card mt-4 whitespace-pre-wrap p-4 text-sm leading-relaxed text-[#A1A1A1]">{project.description}</p>}

      <div className="card mt-4 p-4">
        <div className="flex items-center justify-between text-xs text-[#A1A1A1]">
          <span>Progress — {done}/{total} tasks done</span><span>{progress}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#1c1c1c]">
          <div className="h-full rounded-full bg-[#7C6CFF] transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-3 text-sm font-semibold text-white">Tasks ({total})</h2>
          <form onSubmit={quickAddTask} className="mb-3 flex gap-2">
            <input className="input" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Add a task and press Enter…" />
            <button className="btn-primary shrink-0">Add</button>
          </form>
          {!project.tasks?.length ? (
            <p className="py-3 text-center text-sm text-[#737373]">No tasks yet.</p>
          ) : (
            <ul className="space-y-2">
              {project.tasks.map((t) => (
                <li key={t.id} className="flex items-center gap-3 rounded-lg bg-[#111] px-3 py-2.5">
                  <button
                    onClick={() => void cycleStatus(t.id, t.status)}
                    title="Advance status"
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border transition ${t.status === "DONE" ? "border-emerald-400 bg-emerald-400 text-black" : "border-[#444] hover:border-[#7C6CFF]"}`}
                  >
                    {t.status === "DONE" && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5" /></svg>}
                  </button>
                  <span className={`min-w-0 flex-1 truncate text-sm ${t.status === "DONE" ? "text-[#555] line-through" : "text-white"}`}>{t.title}</span>
                  <StatusBadge value={t.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Notes ({project.notesList?.length ?? 0})</h2>
            <button onClick={() => setNoteModal(true)} className="btn-ghost !py-1.5 !text-xs">+ Add note</button>
          </div>
          {!project.notesList?.length ? (
            <p className="py-3 text-center text-sm text-[#737373]">No notes yet.</p>
          ) : (
            <ul className="space-y-2">
              {project.notesList.map((n) => (
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
      </div>

      <Modal open={noteModal} onClose={() => setNoteModal(false)} title="Add note">
        <form onSubmit={addNote} className="space-y-4">
          <Field label="Title (optional)"><input className="input" value={noteForm.title} onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })} /></Field>
          <Field label="Content *"><textarea className="input min-h-[120px] resize-y" value={noteForm.content} onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })} required /></Field>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setNoteModal(false)} className="btn-ghost">Cancel</button>
            <button className="btn-primary">Add note</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
