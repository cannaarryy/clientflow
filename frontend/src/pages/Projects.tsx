import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../services/api.js";
import type { Client, Project, ProjectStatus, Priority } from "../types/index.js";
import { useToast, errorMessage } from "../hooks/Toast.js";
import { PageHeader, StatusBadge, EmptyState, Modal, Field, SkeletonList } from "../components/ui.js";
import { formatDate } from "../utils/format.js";

const STATUSES: Array<ProjectStatus | "ALL"> = ["ALL", "ACTIVE", "PLANNING", "ON_HOLD", "COMPLETED"];

export function ProjectsPage() {
  const { push } = useToast();
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ProjectStatus | "ALL">("ALL");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState({ name: "", description: "", clientId: "", status: "PLANNING" as ProjectStatus, priority: "MEDIUM" as Priority, startDate: "", dueDate: "" });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (status !== "ALL") params.set("status", status);
      const [p, c] = await Promise.all([
        api.get<{ projects: Project[] }>(`/api/projects?${params.toString()}`),
        clients.length ? null : api.get<{ clients: Client[] }>("/api/clients"),
      ]);
      setProjects(p.projects);
      if (c) setClients(c.clients);
    } catch (e) {
      push(errorMessage(e, "Could not load projects"), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status]);

  useEffect(() => {
    const preset = searchParams.get("client");
    if (preset) {
      setForm((f) => ({ ...f, clientId: preset }));
      setModal(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm((f) => ({ name: "", description: "", clientId: f.clientId || clients[0]?.id || "", status: "PLANNING", priority: "MEDIUM", startDate: "", dueDate: "" }));
    setModal(true);
  };

  const openEdit = (p: Project) => {
    setEditing(p);
    setForm({
      name: p.name, description: p.description ?? "", clientId: p.clientId,
      status: p.status, priority: p.priority,
      startDate: p.startDate ? p.startDate.slice(0, 10) : "", dueDate: p.dueDate ? p.dueDate.slice(0, 10) : "",
    });
    setModal(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.clientId) {
      push("Name and client are required", "error");
      return;
    }
    setBusy(true);
    try {
      const payload = { ...form, name: form.name.trim(), description: form.description.trim(), startDate: form.startDate || undefined, dueDate: form.dueDate || undefined };
      if (editing) {
        await api.patch(`/api/projects/${editing.id}`, payload);
        push("Project updated", "success");
      } else {
        await api.post("/api/projects", payload);
        push("Project created", "success");
      }
      setModal(false);
      void load();
    } catch (err) {
      push(errorMessage(err, "Could not save project"), "error");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (p: Project) => {
    if (!window.confirm(`Delete project "${p.name}"? Its tasks and notes will be deleted too.`)) return;
    try {
      await api.del(`/api/projects/${p.id}`);
      push("Project deleted", "success");
      setProjects((l) => l.filter((x) => x.id !== p.id));
    } catch (e) {
      push(errorMessage(e, "Could not delete project"), "error");
    }
  };

  return (
    <div className="anim-fade-up">
      <PageHeader title="Projects" subtitle={`${projects.length} project${projects.length === 1 ? "" : "s"}`} action={<button onClick={openCreate} className="btn-primary">+ New project</button>} />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <input className="input sm:max-w-xs" placeholder="Search projects…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setStatus(s)} className={`rounded-lg px-3 py-2 text-xs font-medium transition ${status === s ? "bg-white text-black" : "bg-[#111] text-[#A1A1A1] ring-1 ring-[#222] hover:text-white"}`}>
              {s === "ALL" ? "All" : s.replace("_", " ").charAt(0) + s.replace("_", " ").slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? <SkeletonList /> : projects.length === 0 ? (
        <EmptyState
          title={search || status !== "ALL" ? "No projects match your filters" : "No projects yet"}
          hint={clients.length === 0 ? "Create a client first, then attach projects to it." : "Create a project linked to a client to start tracking work."}
          action={search || status !== "ALL" ? undefined : <button onClick={openCreate} className="btn-primary">+ Create project</button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <div key={p.id} className="card p-4 transition hover:border-[#333]">
              <div className="flex items-start justify-between gap-2">
                <Link to={`/app/projects/${p.id}`} className="min-w-0 flex-1 font-semibold text-white hover:underline">{p.name}</Link>
                <StatusBadge value={p.status} />
              </div>
              <p className="mt-0.5 truncate text-xs text-[#737373]">{p.client ? `${p.client.company ?? p.client.name}` : "—"}</p>
              {p.description && <p className="mt-2 line-clamp-2 text-sm text-[#A1A1A1]">{p.description}</p>}
              <div className="mt-3 flex items-center justify-between text-xs text-[#737373]">
                <StatusBadge value={p.priority} />
                <span>{p.dueDate ? `Due ${formatDate(p.dueDate)}` : "No due date"} · {p._count?.tasks ?? 0} tasks</span>
              </div>
              <div className="mt-3 flex gap-2 border-t border-[#1c1c1c] pt-3">
                <Link to={`/app/projects/${p.id}`} className="btn-ghost flex-1 !py-1.5 !text-xs">Open</Link>
                <button onClick={() => openEdit(p)} className="btn-ghost flex-1 !py-1.5 !text-xs">Edit</button>
                <button onClick={() => void remove(p)} className="rounded-lg px-3 py-1.5 text-xs text-[#737373] hover:bg-red-950/40 hover:text-red-300">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Edit project" : "New project"} wide>
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><Field label="Name *"><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Website redesign" required /></Field></div>
            <Field label="Client *">
              <select className="input" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} required>
                <option value="">Select a client…</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.company ? `${c.company} — ${c.name}` : c.name}</option>)}
              </select>
            </Field>
            <Field label="Priority">
              <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}>
                <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option>
              </select>
            </Field>
            <Field label="Status">
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}>
                <option value="PLANNING">Planning</option><option value="ACTIVE">Active</option><option value="ON_HOLD">On hold</option><option value="COMPLETED">Completed</option>
              </select>
            </Field>
            <div />
            <Field label="Start date"><input type="date" className="input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></Field>
            <Field label="Due date"><input type="date" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></Field>
          </div>
          <Field label="Description"><textarea className="input min-h-[90px] resize-y" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Scope, goals, deliverables…" /></Field>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModal(false)} className="btn-ghost">Cancel</button>
            <button className="btn-primary" disabled={busy}>{busy ? "Saving…" : editing ? "Save changes" : "Create project"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
