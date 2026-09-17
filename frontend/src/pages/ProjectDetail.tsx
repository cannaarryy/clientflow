import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api.js";
import type { Note, Project, ProjectSummary, TaskStatus } from "../types/index.js";
import type { Health } from "../types/index.js";
import { useI18n } from "../i18n/LanguageProvider.js";
import { useToast, errorMessage } from "../hooks/Toast.js";
import { StatusBadge, EmptyState, Modal, Field, HealthBadge, VisibilityBadge, Tabs, ProgressBar } from "../components/ui.js";
import { Comments } from "../components/Comments.js";

interface Detail {
  project: Project;
  health: { health: Health; progress: number; total: number; done: number; overdue: number };
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, timeAgo, formatDate } = useI18n();
  const { push } = useToast();
  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskShared, setTaskShared] = useState(false);
  const [noteModal, setNoteModal] = useState(false);
  const [noteForm, setNoteForm] = useState({ title: "", content: "", shared: false });
  const [summary, setSummary] = useState<ProjectSummary | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const d = await api.get<Detail>(`/api/projects/${id}`);
      setData(d);
      api.get<{ summary: ProjectSummary }>(`/api/intelligence/projects/${id}/summary`).then((s) => setSummary(s.summary)).catch(() => {});
    } catch (e) {
      push(errorMessage(e), "error");
      navigate("/app/projects");
    } finally {
      setLoading(false);
    }
  }, [id, navigate, push]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleShare = async () => {
    if (!data) return;
    try {
      await api.patch(`/api/projects/${data.project.id}/share`, { isShared: !data.project.isShared });
      setData({ ...data, project: { ...data.project, isShared: !data.project.isShared } });
      push(t(data.project.isShared ? "pd.shareOff" : "pd.shareOn"), "success");
    } catch (e) {
      push(errorMessage(e), "error");
    }
  };

  const quickAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !data) return;
    try {
      await api.post("/api/tasks", { title: taskTitle.trim(), projectId: data.project.id, clientId: data.project.clientId, isShared: taskShared });
      setTaskTitle("");
      void load();
    } catch (err) {
      push(errorMessage(err), "error");
    }
  };

  const cycleStatus = async (taskId: string, current: TaskStatus) => {
    const next: TaskStatus = current === "TODO" ? "IN_PROGRESS" : current === "IN_PROGRESS" ? "DONE" : "TODO";
    try {
      await api.patch(`/api/tasks/${taskId}`, { status: next });
      void load();
    } catch (e) {
      push(errorMessage(e), "error");
    }
  };

  const toggleTaskShared = async (taskId: string, shared: boolean) => {
    try {
      await api.patch(`/api/tasks/${taskId}`, { isShared: !shared });
      void load();
    } catch (e) {
      push(errorMessage(e), "error");
    }
  };

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !noteForm.content.trim()) return;
    try {
      await api.post("/api/notes", { title: noteForm.title, content: noteForm.content.trim(), projectId: data.project.id, clientId: data.project.clientId, visibility: noteForm.shared ? "SHARED" : "INTERNAL" });
      setNoteModal(false);
      setNoteForm({ title: "", content: "", shared: false });
      void load();
    } catch (err) {
      push(errorMessage(err), "error");
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
  if (!data) return <EmptyState title="404" action={<Link to="/app/projects" className="btn-ghost">←</Link>} />;

  const p = data.project;
  const h = data.health;
  const tabs = [
    { id: "overview", label: t("pd.tabOverview") },
    { id: "tasks", label: t("pd.tabTasks"), count: p.tasks?.length ?? 0 },
    { id: "comments", label: t("pd.tabComments"), count: p.comments?.length ?? 0 },
    { id: "notes", label: t("pd.tabNotes"), count: p.notesList?.length ?? 0 },
    { id: "requests", label: t("pd.tabRequests"), count: p.requests?.length ?? 0 },
  ];

  return (
    <div className="anim-fade-up">
      <Link to="/app/projects" className="text-xs text-[#737373] hover:text-white">← {t("preview.projects")}</Link>
      <div className="mt-1.5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-white sm:text-2xl">{p.name}</h1>
          <p className="mt-0.5 text-sm text-[#A1A1A1]">
            {p.client && <Link to={`/app/clients/${p.clientId}`} className="hover:text-white hover:underline">{p.client.name}</Link>}
            {p.dueDate ? ` · ${t("common.dueOn", { date: formatDate(p.dueDate) })}` : ` · ${t("common.noDueDate")}`}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <StatusBadge value={p.status} /><StatusBadge value={p.priority} /><HealthBadge value={h.health} />
            {p.isShared ? <VisibilityBadge value="SHARED" /> : null}
          </div>
        </div>
        <button onClick={() => void toggleShare()} className={p.isShared ? "btn-ghost" : "btn-primary"}>
          {p.isShared ? t("pd.shared") + " ✓" : t("pd.share")}
        </button>
      </div>

      <div className="card mt-3.5 p-3.5">
        <div className="flex items-center justify-between text-xs text-[#A1A1A1]">
          <span>{h.done}/{h.total}</span><span>{h.progress}%</span>
        </div>
        <div className="mt-1.5"><ProgressBar value={h.progress} /></div>
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === "overview" && (
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="space-y-3">
            {p.description && <p className="card whitespace-pre-wrap p-3.5 text-sm leading-relaxed text-[#A1A1A1]">{p.description}</p>}
            {summary && (
              <section className="card border-[#7C6CFF]/25 p-3.5">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-white">{t("pd.summary")}</h2>
                  <span className="font-mono text-[10px] text-[#555]">{t("pd.summaryNote")}</span>
                </div>
                <ul className="mt-2 space-y-1">
                  {summary.highlights.map((hl, i) => (
                    <li key={i} className="flex gap-2 text-[13px] text-[#A1A1A1]"><span className="text-[#7C6CFF]">→</span>{hl}</li>
                  ))}
                </ul>
                {summary.nextDue && <p className="mt-2 text-xs text-[#737373]">{t("dash.deadlines")}: {summary.nextDue.title} · {formatDate(summary.nextDue.dueDate)}</p>}
              </section>
            )}
          </div>
          <section className="card p-3.5">
            <h2 className="mb-2 text-sm font-semibold text-white">{t("pd.tabActivity")}</h2>
            <ActivityForProject projectId={p.id} />
          </section>
        </div>
      )}

      {tab === "tasks" && (
        <section className="card p-3.5">
          <form onSubmit={quickAddTask} className="mb-2.5 flex flex-col gap-2 sm:flex-row">
            <input className="input flex-1" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder={t("pd.addTaskPh")} />
            <label className="flex items-center gap-1.5 whitespace-nowrap text-xs text-[#737373]">
              <input type="checkbox" checked={taskShared} onChange={(e) => setTaskShared(e.target.checked)} className="h-3.5 w-3.5 accent-[#7C6CFF]" />
              {t("pd.markShared")}
            </label>
            <button className="btn-primary shrink-0">{t("common.add")}</button>
          </form>
          {!p.tasks?.length ? (
            <p className="py-3 text-center text-sm text-[#555]">{t("pd.noTasks")}</p>
          ) : (
            <ul className="space-y-1.5">
              {p.tasks.map((task) => (
                <li key={task.id} className="flex items-center gap-2.5 rounded-lg bg-[#111] px-3 py-2">
                  <button
                    onClick={() => void cycleStatus(task.id, task.status)}
                    title={task.status}
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border transition ${task.status === "DONE" ? "border-emerald-400 bg-emerald-400 text-black" : "border-[#444] hover:border-[#7C6CFF]"}`}
                  >
                    {task.status === "DONE" && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5" /></svg>}
                  </button>
                  <span className={`min-w-0 flex-1 truncate text-sm ${task.status === "DONE" ? "text-[#555] line-through" : "text-white"}`}>{task.title}</span>
                  {task.isShared && <VisibilityBadge value="SHARED" />}
                  <button onClick={() => void toggleTaskShared(task.id, !!task.isShared)} className="shrink-0 text-[11px] text-[#555] hover:text-white" title={t("tk.sharedHint")}>
                    {task.isShared ? "◉" : "○"}
                  </button>
                  <StatusBadge value={task.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "comments" && (
        <section className="card p-3.5">
          <Comments scope={{ projectId: p.id }} />
        </section>
      )}

      {tab === "notes" && (
        <section className="card p-3.5">
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">{t("pd.tabNotes")} ({p.notesList?.length ?? 0})</h2>
            <button onClick={() => setNoteModal(true)} className="btn-ghost !py-1.5 !text-xs">{t("n.new")}</button>
          </div>
          {!p.notesList?.length ? (
            <p className="py-3 text-center text-sm text-[#555]">—</p>
          ) : (
            <ul className="space-y-1.5">
              {p.notesList.map((n) => (
                <li key={n.id} className="rounded-lg bg-[#111] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-white">{n.title || "—"}</p>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <VisibilityBadge value={n.visibility ?? "INTERNAL"} />
                      <button onClick={() => void deleteNote(n)} className="text-[11px] text-[#555] hover:text-red-300">✕</button>
                    </div>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-[#A1A1A1]">{n.content}</p>
                  <p className="mt-1 text-[11px] text-[#555]">{timeAgo(n.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "requests" && (
        <section className="card p-3.5">
          {!p.requests?.length ? (
            <p className="py-3 text-center text-sm text-[#555]">{t("cd.noRequests")}</p>
          ) : (
            <ul className="space-y-1.5">
              {p.requests.map((r) => (
                <li key={r.id}>
                  <Link to="/app/requests" className="flex items-center gap-2.5 rounded-lg bg-[#111] px-3 py-2 transition hover:bg-[#161616]">
                    <span className="min-w-0 flex-1 truncate text-sm text-white">{r.title}</span>
                    <StatusBadge value={r.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
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
            <button className="btn-primary">{t("common.add")}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function ActivityForProject({ projectId }: { projectId: string }) {
  const { timeAgo } = useI18n();
  const [items, setItems] = useState<Array<{ id: string; message: string; createdAt: string }>>([]);
  useEffect(() => {
    api.get<{ activities: Array<{ id: string; message: string; createdAt: string; entityId?: string | null }> }>("/api/activities?limit=100")
      .then((d) => setItems(d.activities.filter((a) => a.entityId === projectId).slice(0, 8)))
      .catch(() => {});
  }, [projectId]);
  if (items.length === 0) return <p className="py-2 text-center text-sm text-[#555]">—</p>;
  return (
    <ul className="space-y-2">
      {items.map((a) => (
        <li key={a.id} className="flex gap-2.5 text-[13px] text-[#A1A1A1]">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7C6CFF]" />
          <span>{a.message} <span className="text-[11px] text-[#555]">· {timeAgo(a.createdAt)}</span></span>
        </li>
      ))}
    </ul>
  );
}
