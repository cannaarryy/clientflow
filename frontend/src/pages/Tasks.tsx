import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../services/api.js";
import type { Client, Project, Task, TaskStatus, Priority } from "../types/index.js";
import { useToast, errorMessage } from "../hooks/Toast.js";
import { useI18n } from "../i18n/LanguageProvider.js";
import { PageHeader, StatusBadge, EmptyState, Modal, Field, SkeletonList, VisibilityBadge } from "../components/ui.js";
import { formatDate } from "../utils/format.js";

const COLUMNS: Array<{ id: TaskStatus; labelKey: string }> = [
  { id: "TODO", labelKey: "t.todo" },
  { id: "IN_PROGRESS", labelKey: "t.inProgress" },
  { id: "DONE", labelKey: "t.done" },
];

export function TasksPage() {
  const { push } = useToast();
  const { t, formatDate, plural } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "kanban">("list");
  const [filter, setFilter] = useState<TaskStatus | "ALL">((searchParams.get("status") as TaskStatus) || "ALL");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState({ title: "", description: "", status: "TODO" as TaskStatus, priority: "MEDIUM" as Priority, dueDate: "", projectId: "", clientId: "", isShared: false });
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

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      openCreate();
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", description: "", status: "TODO", priority: "MEDIUM", dueDate: "", projectId: "", clientId: "", isShared: false });
    setModal(true);
  };

  const openEdit = (t: Task) => {
    setEditing(t);
    setForm({
      title: t.title, description: t.description ?? "", status: t.status, priority: t.priority,
      dueDate: t.dueDate ? t.dueDate.slice(0, 10) : "", projectId: t.projectId ?? "", clientId: t.clientId ?? "", isShared: !!t.isShared,
    });
    setModal(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      push(t("t.titleRequired"), "error");
      return;
    }
    setBusy(true);
    try {
      const payload = { ...form, title: form.title.trim(), description: form.description.trim(), dueDate: form.dueDate || undefined, projectId: form.projectId || undefined, clientId: form.clientId || undefined };
      if (editing) {
        await api.patch(`/api/tasks/${editing.id}`, payload);
        push(t("t.updated"), "success");
      } else {
        await api.post("/api/tasks", payload);
        push(t("t.created"), "success");
      }
      setModal(false);
      void load();
    } catch (err) {
      push(errorMessage(err, t("t.saveError")), "error");
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

  const remove = async (task: Task) => {
    if (!window.confirm(t("t.deleteConfirm", { title: task.title }))) return;
    try {
      await api.del(`/api/tasks/${task.id}`);
      setTasks((l) => l.filter((x) => x.id !== task.id));
      push(t("t.deleted"), "success");
    } catch (e) {
      push(errorMessage(e, t("t.deleteError")), "error");
    }
  };

  const projectOptions = form.clientId ? projects.filter((p) => p.clientId === form.clientId) : projects;

  return (
    <div className="anim-fade-up">
      <PageHeader
        title={t("t.title")}
        subtitle={plural(tasks.length, "t.subCount", "t.subCountPlural")}
        action={
          <>
            <div className="flex rounded-lg bg-[#111] p-0.5 ring-1 ring-[#222]">
              {(["list", "kanban"] as const).map((v) => (
                <button key={v} onClick={() => setView(v)} className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition ${view === v ? "bg-[#222] text-white" : "text-[#737373] hover:text-white"}`}>{t(v === "list" ? "t.list" : "t.kanban")}</button>
              ))}
            </div>
            <button onClick={openCreate} className="btn-primary">{t("t.new")}</button>
          </>
        }
      />

      <div className="mb-3.5 flex gap-1.5">
        {(["ALL", "TODO", "IN_PROGRESS", "DONE"] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${filter === s ? "bg-white text-black" : "bg-[#111] text-[#A1A1A1] ring-1 ring-[#222] hover:text-white"}`}>
            {s === "ALL" ? t("common.all") : t(`st.${s}`)}
          </button>
        ))}
      </div>

      {loading ? <SkeletonList /> : tasks.length === 0 ? (
        <EmptyState
          title={filter !== "ALL" ? t("t.noMatch") : t("t.empty")}
          hint={t("t.emptyHint")}
          action={filter !== "ALL" ? undefined : <button onClick={openCreate} className="btn-primary">{t("t.createCta")}</button>}
        />
      ) : view === "list" ? (
        <ul className="space-y-1.5">
          {tasks.map((task) => (
            <li key={task.id} className="card flex items-center gap-2.5 p-2.5 transition hover:border-[#333]">
              <button
                onClick={() => void move(task, task.status === "TODO" ? "IN_PROGRESS" : task.status === "IN_PROGRESS" ? "DONE" : "TODO")}
                title={t("pd.advance")}
                className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border transition ${task.status === "DONE" ? "border-emerald-400 bg-emerald-400 text-black" : "border-[#444] hover:border-[#7C6CFF]"}`}
              >
                {task.status === "DONE" && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5" /></svg>}
              </button>
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm ${task.status === "DONE" ? "text-[#555] line-through" : "text-white"}`}>{task.title}</p>
                <p className="truncate text-xs text-[#737373]">
                  {[task.project?.name, task.client?.company ?? task.client?.name, task.dueDate ? t("dash.due", { date: formatDate(task.dueDate) }) : null].filter(Boolean).join(" · ") || t("t.noLink")}
                </p>
              </div>
              {task.isShared && <VisibilityBadge value="SHARED" />}
              <div className="hidden sm:block"><StatusBadge value={task.priority} /></div>
              <StatusBadge value={task.status} />
              <button onClick={() => openEdit(task)} className="rounded-lg px-2.5 py-1.5 text-xs text-[#A1A1A1] hover:bg-[#181818] hover:text-white">{t("t.edit")}</button>
              <button onClick={() => void remove(task)} className="rounded-lg px-2 py-1.5 text-xs text-[#555] hover:bg-red-950/40 hover:text-red-300">✕</button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="grid gap-2.5 md:grid-cols-3">
          {COLUMNS.map((col) => {
            const items = tasks.filter((task) => task.status === col.id);
            return (
              <div key={col.id} className="rounded-xl border border-[#1e1e1e] bg-[#080808] p-2.5">
                <div className="mb-1.5 flex items-center justify-between px-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#A1A1A1]">{t(col.labelKey)}</p>
                  <span className="rounded-full bg-[#181818] px-2 py-0.5 font-mono text-[11px] text-[#737373]">{items.length}</span>
                </div>
                <div className="space-y-1.5">
                  {items.map((task) => (
                    <div key={task.id} className="card !bg-[#0D0D0D] p-2.5">
                      <p className="text-sm text-white">{task.title}</p>
                      <p className="mt-0.5 truncate text-xs text-[#737373]">{[task.project?.name, task.dueDate ? formatDate(task.dueDate) : null].filter(Boolean).join(" · ") || "—"}</p>
                      <div className="mt-1.5 flex items-center justify-between">
                        <StatusBadge value={task.priority} />
                        <div className="flex gap-1">
                          {col.id !== "TODO" && <button onClick={() => void move(task, col.id === "DONE" ? "IN_PROGRESS" : "TODO")} className="rounded px-1.5 py-1 text-[11px] text-[#737373] hover:bg-[#181818] hover:text-white">←</button>}
                          {col.id !== "DONE" && <button onClick={() => void move(task, col.id === "TODO" ? "IN_PROGRESS" : "DONE")} className="rounded px-1.5 py-1 text-[11px] text-[#737373] hover:bg-[#181818] hover:text-white">→</button>}
                          <button onClick={() => openEdit(task)} className="rounded px-1.5 py-1 text-[11px] text-[#737373] hover:bg-[#181818] hover:text-white">{t("t.edit")}</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && <p className="rounded-lg border border-dashed border-[#262626] px-3 py-4 text-center text-xs text-[#555]">{t("t.dropZone")}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? t("t.editTitle") : t("t.newTitle")}>
        <form onSubmit={save} className="space-y-3.5">
          <Field label={t("t.titleLabel")}><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={t("t.titlePh")} required /></Field>
          <Field label={t("t.descLabel")}><textarea className="input min-h-[80px] resize-y" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label={t("t.statusLabel")}>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}>
                <option value="TODO">{t("st.TODO")}</option><option value="IN_PROGRESS">{t("st.IN_PROGRESS")}</option><option value="DONE">{t("st.DONE")}</option>
              </select>
            </Field>
            <Field label={t("t.priorityLabel")}>
              <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}>
                <option value="LOW">{t("st.LOW")}</option><option value="MEDIUM">{t("st.MEDIUM")}</option><option value="HIGH">{t("st.HIGH")}</option>
              </select>
            </Field>
            <Field label={t("t.clientOpt")}>
              <select className="input" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value, projectId: "" })}>
                <option value="">{t("t.noClient")}</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.company ?? c.name}</option>)}
              </select>
            </Field>
            <Field label={t("t.projectOpt")}>
              <select className="input" value={form.projectId} onChange={(e) => {
                const found = projects.find((x) => x.id === e.target.value);
                setForm({ ...form, projectId: e.target.value, clientId: found ? found.clientId : form.clientId });
              }}>
                <option value="">{t("t.noProject")}</option>
                {projectOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
          </div>
          <Field label={t("t.dueLabel")}><input type="date" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></Field>
          <div className="flex items-end pb-2">
            <label className="flex cursor-pointer items-center gap-1.5 text-xs text-[#737373]" title={t("tk.sharedHint")}>
              <input type="checkbox" checked={form.isShared} onChange={(e) => setForm({ ...form, isShared: e.target.checked })} className="h-3.5 w-3.5 accent-[#7C6CFF]" />
              {t("tk.shared")}
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModal(false)} className="btn-ghost">{t("common.cancel")}</button>
            <button className="btn-primary" disabled={busy}>{busy ? t("common.saving") : editing ? t("common.save") : t("t.createCta")}</button>
          </div>
        </form>
      </Modal>

      <p className="mt-5 text-center text-xs text-[#555]">
        <Link to="/app/projects" className="hover:text-[#A1A1A1]">{t("t.location")}</Link>
      </p>
    </div>
  );
}
