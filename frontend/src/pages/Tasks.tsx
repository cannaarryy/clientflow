import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../services/api.js";
import type { Client, Project, Task, TaskStatus, Priority } from "../types/index.js";
import { useToast, errorMessage } from "../hooks/Toast.js";
import { PageHeader, StatusBadge, EmptyState, Modal, Field, SkeletonList } from "../components/ui.js";
import { formatDate } from "../utils/format.js";

const COLUMNS: Array<{ id: TaskStatus; label: string }> = [
  { id: "TODO", label: "To do" },
  { id: "IN_PROGRESS", label: "In progress" },
  { id: "DONE", label: "Done" },
];

export function TasksPage() {
  const { push } = useToast();
  const [searchParams] = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "kanban">("list");
  const [filter, setFilter] = useState<TaskStatus | "ALL">((searchParams.get("status") as TaskStatus) || "ALL");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState({ title: "", description: "", status: "TODO" as TaskStatus, priority: "MEDIUM" as Priority, dueDate: "", projectId: "", clientId: "" });
  const [busy, setBusy] = useState(false);

  const load = async (statusOverride?: TaskStatus | "ALL") => {
    setLoading(true);
    try {
      const f = statusOverride ?? filter;
      const params = new URLSearchParams();
      if (f !== "ALL") params.set("status", f);
      const [t, c, p] = await Promise.all([
        api.get<{ tasks: Task[] }>(`/api/tasks?${params.toString()}`),
        clients.length ? null : api.get<{ clients: Client[] }>("/api/clients"),
        projects.length ? null : api.get<{ projects: Project[] }>("/api/projects"),
      ]);
      setTasks(t.tasks);
      if (c) setClients(c.clients);
      if (p) setProjects(p.projects);
    } catch (e) {
      push(errorMessage(e, "Could not load tasks"), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", description: "", status: "TODO", priority: "MEDIUM", dueDate: "", projectId: "", clientId: "" });
    setModal(true);
  };

  const openEdit = (t: Task) => {
    setEditing(t);
    setForm({
      title: t.title, description: t.description ?? "", status: t.status, priority: t.priority,
      dueDate: t.dueDate ? t.dueDate.slice(0, 10) : "", projectId: t.projectId ?? "", clientId: t.clientId ?? "",
    });
    setModal(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      push("Title is required", "error");
      return;
    }
    setBusy(true);
    try {
      const payload = { ...form, title: form.title.trim(), description: form.description.trim(), dueDate: form.dueDate || undefined, projectId: form.projectId || undefined, clientId: form.clientId || undefined };
      if (editing) {
        await api.patch(`/api/tasks/${editing.id}`, payload);
        push("Task updated", "success");
      } else {
        await api.post("/api/tasks", payload);
        push("Task created", "success");
      }
      setModal(false);
      void load();
    } catch (err) {
      push(errorMessage(err, "Could not save task"), "error");
    } finally {
      setBusy(false);
    }
  };

  const move = async (t: Task, status: TaskStatus) => {
    try {
      await api.patch(`/api/tasks/${t.id}`, { status });
      setTasks((l) => l.map((x) => (x.id === t.id ? { ...x, status } : x)));
    } catch (e) {
      push(errorMessage(e, "Could not update task"), "error");
    }
  };

  const remove = async (t: Task) => {
    if (!window.confirm(`Delete task "${t.title}"?`)) return;
    try {
      await api.del(`/api/tasks/${t.id}`);
      setTasks((l) => l.filter((x) => x.id !== t.id));
      push("Task deleted", "success");
    } catch (e) {
      push(errorMessage(e, "Could not delete task"), "error");
    }
  };

  const projectOptions = form.clientId ? projects.filter((p) => p.clientId === form.clientId) : projects;

  return (
    <div className="anim-fade-up">
      <PageHeader
        title="Tasks"
        subtitle={`${tasks.length} task${tasks.length === 1 ? "" : "s"}`}
        action={
          <>
            <div className="flex rounded-lg bg-[#111] p-0.5 ring-1 ring-[#222]">
              {(["list", "kanban"] as const).map((v) => (
                <button key={v} onClick={() => setView(v)} className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition ${view === v ? "bg-[#222] text-white" : "text-[#737373] hover:text-white"}`}>{v}</button>
              ))}
            </div>
            <button onClick={openCreate} className="btn-primary">+ New task</button>
          </>
        }
      />

      <div className="mb-4 flex gap-1.5">
        {(["ALL", "TODO", "IN_PROGRESS", "DONE"] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`rounded-lg px-3 py-2 text-xs font-medium transition ${filter === s ? "bg-white text-black" : "bg-[#111] text-[#A1A1A1] ring-1 ring-[#222] hover:text-white"}`}>
            {s === "ALL" ? "All" : s.replace("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
          </button>
        ))}
      </div>

      {loading ? <SkeletonList /> : tasks.length === 0 ? (
        <EmptyState
          title={filter !== "ALL" ? "No tasks with this status" : "No tasks yet"}
          hint="Break projects into small, actionable tasks with due dates."
          action={filter !== "ALL" ? undefined : <button onClick={openCreate} className="btn-primary">+ Create task</button>}
        />
      ) : view === "list" ? (
        <ul className="space-y-2">
          {tasks.map((t) => (
            <li key={t.id} className="card flex items-center gap-3 p-3 transition hover:border-[#333]">
              <button
                onClick={() => void move(t, t.status === "TODO" ? "IN_PROGRESS" : t.status === "IN_PROGRESS" ? "DONE" : "TODO")}
                title="Advance status"
                className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border transition ${t.status === "DONE" ? "border-emerald-400 bg-emerald-400 text-black" : "border-[#444] hover:border-[#7C6CFF]"}`}
              >
                {t.status === "DONE" && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5" /></svg>}
              </button>
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm ${t.status === "DONE" ? "text-[#555] line-through" : "text-white"}`}>{t.title}</p>
                <p className="truncate text-xs text-[#737373]">
                  {[t.project?.name, t.client?.company ?? t.client?.name, t.dueDate ? `Due ${formatDate(t.dueDate)}` : null].filter(Boolean).join(" · ") || "No link"}
                </p>
              </div>
              <div className="hidden sm:block"><StatusBadge value={t.priority} /></div>
              <StatusBadge value={t.status} />
              <button onClick={() => openEdit(t)} className="rounded-lg px-2.5 py-1.5 text-xs text-[#A1A1A1] hover:bg-[#181818] hover:text-white">Edit</button>
              <button onClick={() => void remove(t)} className="rounded-lg px-2 py-1.5 text-xs text-[#555] hover:bg-red-950/40 hover:text-red-300">✕</button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          {COLUMNS.map((col) => {
            const items = tasks.filter((t) => t.status === col.id);
            return (
              <div key={col.id} className="rounded-xl border border-[#1e1e1e] bg-[#080808] p-3">
                <div className="mb-2 flex items-center justify-between px-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#A1A1A1]">{col.label}</p>
                  <span className="rounded-full bg-[#181818] px-2 py-0.5 font-mono text-[11px] text-[#737373]">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map((t) => (
                    <div key={t.id} className="card !bg-[#0D0D0D] p-3">
                      <p className="text-sm text-white">{t.title}</p>
                      <p className="mt-0.5 truncate text-xs text-[#737373]">{[t.project?.name, t.dueDate ? formatDate(t.dueDate) : null].filter(Boolean).join(" · ") || "—"}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <StatusBadge value={t.priority} />
                        <div className="flex gap-1">
                          {col.id !== "TODO" && <button onClick={() => void move(t, col.id === "DONE" ? "IN_PROGRESS" : "TODO")} className="rounded px-1.5 py-1 text-[11px] text-[#737373] hover:bg-[#181818] hover:text-white">←</button>}
                          {col.id !== "DONE" && <button onClick={() => void move(t, col.id === "TODO" ? "IN_PROGRESS" : "DONE")} className="rounded px-1.5 py-1 text-[11px] text-[#737373] hover:bg-[#181818] hover:text-white">→</button>}
                          <button onClick={() => openEdit(t)} className="rounded px-1.5 py-1 text-[11px] text-[#737373] hover:bg-[#181818] hover:text-white">Edit</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && <p className="rounded-lg border border-dashed border-[#262626] px-3 py-5 text-center text-xs text-[#555]">Drop zone — move tasks here</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Edit task" : "New task"}>
        <form onSubmit={save} className="space-y-4">
          <Field label="Title *"><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Design homepage hero" required /></Field>
          <Field label="Description"><textarea className="input min-h-[80px] resize-y" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Status">
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}>
                <option value="TODO">To do</option><option value="IN_PROGRESS">In progress</option><option value="DONE">Done</option>
              </select>
            </Field>
            <Field label="Priority">
              <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}>
                <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option>
              </select>
            </Field>
            <Field label="Client (optional)">
              <select className="input" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value, projectId: "" })}>
                <option value="">No client</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.company ?? c.name}</option>)}
              </select>
            </Field>
            <Field label="Project (optional)">
              <select className="input" value={form.projectId} onChange={(e) => {
                const p = projects.find((x) => x.id === e.target.value);
                setForm({ ...form, projectId: e.target.value, clientId: p ? p.clientId : form.clientId });
              }}>
                <option value="">No project</option>
                {projectOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Due date"><input type="date" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></Field>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModal(false)} className="btn-ghost">Cancel</button>
            <button className="btn-primary" disabled={busy}>{busy ? "Saving…" : editing ? "Save changes" : "Create task"}</button>
          </div>
        </form>
      </Modal>

      <p className="mt-6 text-center text-xs text-[#555]">
        <Link to="/app/projects" className="hover:text-[#A1A1A1]">Tasks live inside projects — open a project for full context →</Link>
      </p>
    </div>
  );
}
