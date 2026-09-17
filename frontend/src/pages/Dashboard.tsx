import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import type { DashboardData } from "../types/index.js";
import { useAuth } from "../hooks/AuthContext.js";
import { useToast, errorMessage } from "../hooks/Toast.js";
import { useI18n } from "../i18n/LanguageProvider.js";
import { StatusBadge, EmptyState, HealthBadge } from "../components/ui.js";

export function DashboardPage() {
  const { user } = useAuth();
  const { push } = useToast();
  const { t, greeting, timeAgo, formatDate } = useI18n();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<DashboardData>("/api/dashboard")
      .then(setData)
      .catch((e) => push(errorMessage(e, t("dash.loadError")), "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div>
        <div className="skeleton mb-1.5 h-7 w-64" />
        <div className="skeleton mb-5 h-4 w-40" />
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-20" />)}
        </div>
      </div>
    );
  }
  if (!data) return <EmptyState title={t("dash.loadError")} />;

  const stats = [
    { label: t("preview.statProjects"), value: data.stats.activeProjects, to: "/app/projects" },
    { label: t("dash.overdue"), value: data.stats.overdue, to: "/app/tasks", alert: data.stats.overdue > 0 },
    { label: t("dash.openRequests"), value: data.stats.openRequests, to: "/app/requests" },
    { label: t("preview.statClients"), value: data.stats.activeClients, to: "/app/clients" },
  ];

  const isEmpty = data.stats.activeClients === 0 && data.stats.activeProjects === 0 && data.stats.openTasks === 0;

  return (
    <div className="anim-fade-up">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#555]">{t("dash.overview")}</p>
      <h1 className="mt-0.5 text-xl font-bold tracking-tight text-white sm:text-2xl">{greeting(user?.name)}</h1>
      <p className="mt-0.5 text-sm text-[#A1A1A1]">{t("dash.sub")}</p>

      <div className="mt-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className={`card group p-3.5 transition hover:border-[#333] ${s.alert ? "!border-red-900/40" : ""}`}>
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#737373]">{s.label}</p>
            <p className={`mt-0.5 text-2xl font-bold ${s.alert ? "text-red-300" : "text-white"}`}>{s.value}</p>
          </Link>
        ))}
      </div>

      {isEmpty && (
        <div className="mt-4">
          <EmptyState
            title={t("dash.welcome")}
            hint={t("dash.welcomeHint")}
            action={<Link to="/app/clients" className="btn-primary">{t("dash.addFirstClient")}</Link>}
          />
        </div>
      )}

      {/* Suggested next actions (rule-based intelligence, real data) */}
      <section className="card mt-3 p-4">
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">{t("dash.nextActions")}</h2>
          <span className="font-mono text-[10px] text-[#555]">{t("dash.nextActionsNote")}</span>
        </div>
        {data.nextActions.length === 0 ? (
          <p className="py-2 text-center text-sm text-[#555]">{t("dash.nextActionsEmpty")}</p>
        ) : (
          <ul className="grid gap-1.5 md:grid-cols-2">
            {data.nextActions.map((a, i) => (
              <li key={`${a.entityId ?? i}-${i}`}>
                <ActionLink action={a} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        {/* Project health */}
        <section className="card p-4">
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">{t("dash.health")}</h2>
            <Link to="/app/projects" className="text-xs text-[#A1A1A1] hover:text-white">{t("app.viewAll")}</Link>
          </div>
          {data.projectHealth.length === 0 ? (
            <p className="py-2 text-center text-sm text-[#555]">{t("dash.healthEmpty")}</p>
          ) : (
            <ul className="space-y-1.5">
              {data.projectHealth.map((p) => (
                <li key={p.id}>
                  <Link to={`/app/projects/${p.id}`} className="flex items-center gap-2.5 rounded-lg bg-[#111] px-3 py-2 transition hover:bg-[#161616]">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] text-white">{p.name}</span>
                      <span className="block text-[11px] text-[#555]">{p.done}/{p.total} · {p.progress}%</span>
                    </span>
                    <HealthBadge value={p.health} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Overdue */}
        <section className="card p-4">
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">{t("dash.overdue")}</h2>
            <Link to="/app/tasks" className="text-xs text-[#A1A1A1] hover:text-white">{t("app.viewAll")}</Link>
          </div>
          {data.overdueTasks.length === 0 ? (
            <p className="py-2 text-center text-sm text-[#555]">{t("dash.overdueEmpty")}</p>
          ) : (
            <ul className="space-y-1.5">
              {data.overdueTasks.map((task) => (
                <li key={task.id} className="flex items-center gap-2.5 rounded-lg border border-red-900/30 bg-[#140b0b] px-3 py-2">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] text-white">{task.title}</span>
                    <span className="block truncate text-[11px] text-red-300/70">
                      {[task.project?.name, task.dueDate ? formatDate(task.dueDate) : null].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <StatusBadge value={task.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Deadlines */}
        <section className="card p-4">
          <h2 className="mb-2.5 text-sm font-semibold text-white">{t("dash.deadlines")}</h2>
          {data.deadlines.length === 0 ? (
            <p className="py-2 text-center text-sm text-[#555]">{t("dash.deadlinesEmpty")}</p>
          ) : (
            <ul className="space-y-1.5">
              {data.deadlines.map((d) => (
                <li key={`${d.kind}-${d.id}`}>
                  <Link to={d.kind === "project" ? `/app/projects/${d.id}` : "/app/tasks"} className="flex items-center gap-2.5 rounded-lg bg-[#111] px-3 py-2 transition hover:bg-[#161616]">
                    <span className="rounded bg-[#1c1c1c] px-1.5 py-0.5 font-mono text-[10px] text-[#737373]">{d.kind === "project" ? "PRJ" : "TSK"}</span>
                    <span className="min-w-0 flex-1 truncate text-[13px] text-white">{d.title}</span>
                    <span className="shrink-0 text-[11px] text-[#737373]">{formatDate(d.dueDate)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent requests */}
        <section className="card p-4">
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">{t("dash.recentRequests")}</h2>
            <Link to="/app/requests" className="text-xs text-[#A1A1A1] hover:text-white">{t("app.viewAll")}</Link>
          </div>
          {data.openRequests.length === 0 ? (
            <p className="py-2 text-center text-sm text-[#555]">{t("dash.noRequests")}</p>
          ) : (
            <ul className="space-y-1.5">
              {data.openRequests.map((r) => (
                <li key={r.id}>
                  <Link to="/app/requests" className="flex items-center gap-2.5 rounded-lg bg-[#111] px-3 py-2 transition hover:bg-[#161616]">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] text-white">{r.title}</span>
                      <span className="block truncate text-[11px] text-[#555]">{r.client?.company ?? r.client?.name}</span>
                    </span>
                    <StatusBadge value={r.priority} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <section className="card p-4">
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">{t("dash.upcoming")}</h2>
            <Link to="/app/tasks" className="text-xs text-[#A1A1A1] hover:text-white">{t("app.viewAll")}</Link>
          </div>
          {data.upcomingTasks.length === 0 ? (
            <p className="py-2 text-center text-sm text-[#555]">{t("dash.noTasks")} <Link to="/app/tasks" className="text-white hover:underline">{t("dash.createOne")}</Link>.</p>
          ) : (
            <ul className="space-y-1.5">
              {data.upcomingTasks.map((task) => (
                <li key={task.id} className="flex items-center gap-2.5 rounded-lg bg-[#111] px-3 py-2">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${task.status === "IN_PROGRESS" ? "bg-[#7C6CFF]" : "bg-[#444]"}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] text-white">{task.title}</span>
                    <span className="block truncate text-[11px] text-[#555]">
                      {[task.project?.name, task.dueDate ? formatDate(task.dueDate) : null].filter(Boolean).join(" · ") || "—"}
                    </span>
                  </span>
                  <StatusBadge value={task.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-4">
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">{t("dash.recentActivity")}</h2>
            <Link to="/app/activity" className="text-xs text-[#A1A1A1] hover:text-white">{t("app.viewAll")}</Link>
          </div>
          {data.recentActivity.length === 0 ? (
            <p className="py-2 text-center text-sm text-[#555]">{t("dash.noActivity")}</p>
          ) : (
            <ul className="space-y-2">
              {data.recentActivity.map((a) => (
                <li key={a.id} className="flex gap-2.5 text-[13px]">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7C6CFF]" />
                  <span className="min-w-0 flex-1 text-[#A1A1A1]"><span className="text-[#F5F5F5]">{a.message}</span> <span className="whitespace-nowrap text-[11px] text-[#555]">· {timeAgo(a.createdAt)}</span></span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function ActionLink({ action }: { action: DashboardData["nextActions"][number] }) {
  const to = action.entityType === "task" ? "/app/tasks" : action.entityType === "request" ? "/app/requests" : action.entityType === "client" ? `/app/clients/${action.entityId}` : "/app";
  const color = action.kind === "overdue" ? "border-red-900/30 bg-[#140b0b]" : action.kind === "open_request" ? "border-[#7C6CFF]/25 bg-[#7C6CFF]/[0.05]" : "bg-[#111]";
  return (
    <Link to={to} className={`flex items-center gap-2.5 rounded-lg border border-transparent px-3 py-2 transition hover:border-[#333] ${color}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${action.kind === "overdue" ? "bg-red-400" : action.kind === "due_soon" ? "bg-amber-300" : "bg-[#7C6CFF]"}`} />
      <span className="min-w-0 flex-1 truncate text-[13px] text-[#F5F5F5]">{action.message}</span>
      <span className="shrink-0 text-[#444]">→</span>
    </Link>
  );
}
