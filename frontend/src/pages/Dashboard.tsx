import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import type { DashboardData } from "../types/index.js";
import { useAuth } from "../hooks/AuthContext.js";
import { useToast, errorMessage } from "../hooks/Toast.js";
import { StatusBadge, EmptyState } from "../components/ui.js";
import { greeting, timeAgo, formatDate } from "../utils/format.js";

export function DashboardPage() {
  const { user } = useAuth();
  const { push } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<DashboardData>("/api/dashboard")
      .then(setData)
      .catch((e) => push(errorMessage(e, "Could not load dashboard"), "error"))
      .finally(() => setLoading(false));
  }, [push]);

  if (loading) {
    return (
      <div>
        <div className="skeleton mb-2 h-8 w-64" />
        <div className="skeleton mb-6 h-4 w-40" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-24" />)}
        </div>
      </div>
    );
  }
  if (!data) return <EmptyState title="Could not load dashboard" hint="Check that the API is running and try again." />;

  const stats = [
    { label: "Active Clients", value: data.stats.activeClients, to: "/app/clients" },
    { label: "Active Projects", value: data.stats.activeProjects, to: "/app/projects" },
    { label: "Open Tasks", value: data.stats.openTasks, to: "/app/tasks" },
    { label: "Completed Tasks", value: data.stats.completedTasks, to: "/app/tasks?status=DONE" },
  ];

  const isEmpty = data.stats.activeClients === 0 && data.stats.activeProjects === 0 && data.stats.openTasks === 0;

  return (
    <div className="anim-fade-up">
      <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-[#737373]">Overview</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">{greeting(user?.name)}</h1>
      <p className="mt-1 text-sm text-[#A1A1A1]">Here's the state of your work.</p>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="card group p-4 transition hover:border-[#333] sm:p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-[#737373]">{s.label}</p>
            <p className="mt-1 text-3xl font-bold text-white">{s.value}</p>
          </Link>
        ))}
      </div>

      {isEmpty && (
        <div className="mt-6">
          <EmptyState
            title="Welcome to ClientFlow"
            hint="Add your first client, then create a project and your first tasks. It takes less than a minute."
            action={<Link to="/app/clients" className="btn-primary">+ Add your first client</Link>}
          />
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Upcoming tasks</h2>
            <Link to="/app/tasks" className="text-xs text-[#A1A1A1] hover:text-white">View all →</Link>
          </div>
          {data.upcomingTasks.length === 0 ? (
            <p className="py-4 text-center text-sm text-[#737373]">No open tasks. <Link to="/app/tasks" className="text-white hover:underline">Create one</Link>.</p>
          ) : (
            <ul className="space-y-2">
              {data.upcomingTasks.map((t) => (
                <li key={t.id} className="flex items-center gap-3 rounded-lg bg-[#111] px-3 py-2.5">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${t.status === "DONE" ? "bg-emerald-400" : t.status === "IN_PROGRESS" ? "bg-[#7C6CFF]" : "bg-[#444]"}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-white">{t.title}</span>
                    <span className="block truncate text-xs text-[#737373]">
                      {[t.project?.name, t.dueDate ? `Due ${formatDate(t.dueDate)}` : null].filter(Boolean).join(" · ") || "No project"}
                    </span>
                  </span>
                  <StatusBadge value={t.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Recent activity</h2>
            <Link to="/app/activity" className="text-xs text-[#A1A1A1] hover:text-white">View all →</Link>
          </div>
          {data.recentActivity.length === 0 ? (
            <p className="py-4 text-center text-sm text-[#737373]">No activity yet.</p>
          ) : (
            <ul className="space-y-2.5">
              {data.recentActivity.map((a) => (
                <li key={a.id} className="flex gap-3 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7C6CFF]" />
                  <span className="min-w-0 flex-1 text-[#A1A1A1]"><span className="text-[#F5F5F5]">{a.message}</span> <span className="whitespace-nowrap text-xs text-[#555]">· {timeAgo(a.createdAt)}</span></span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card mt-4 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Recent clients</h2>
          <Link to="/app/clients" className="text-xs text-[#A1A1A1] hover:text-white">View all →</Link>
        </div>
        {data.recentClients.length === 0 ? (
          <p className="py-4 text-center text-sm text-[#737373]">No clients yet.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {data.recentClients.map((c) => (
              <Link key={c.id} to={`/app/clients/${c.id}`} className="rounded-lg bg-[#111] p-3 transition hover:bg-[#161616]">
                <p className="truncate text-sm font-medium text-white">{c.name}</p>
                <p className="truncate text-xs text-[#737373]">{c.company ?? c.email ?? "—"}</p>
                <div className="mt-2"><StatusBadge value={c.status} /></div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
