/**
 * Project health — pure, computed, never stored.
 * Rules (all from real data, no invented metrics):
 * - COMPLETED status            → completed
 * - ON_HOLD status              → blocked
 * - open tasks past their due   → at_risk (blocked if a HIGH priority one is overdue)
 * - dueDate passed + open tasks → at_risk
 * - otherwise                   → healthy
 * Progress = done / total * 100 (0 when no tasks).
 */

export type Health = "HEALTHY" | "AT_RISK" | "BLOCKED" | "COMPLETED";

export interface HealthInput {
  status: string;
  dueDate?: Date | string | null;
  tasks: Array<{ status: string; priority?: string | null; dueDate?: Date | string | null }>;
}

export interface HealthResult {
  health: Health;
  progress: number;
  total: number;
  done: number;
  overdue: number;
}

const toTime = (v: Date | string | null | undefined): number | null => {
  if (!v) return null;
  const t = v instanceof Date ? v.getTime() : new Date(v).getTime();
  return Number.isNaN(t) ? null : t;
};

export function computeHealth(input: HealthInput, now = Date.now()): HealthResult {
  const total = input.tasks.length;
  const done = input.tasks.filter((t) => t.status === "DONE").length;
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);
  const overdueTasks = input.tasks.filter(
    (t) => t.status !== "DONE" && toTime(t.dueDate) !== null && (toTime(t.dueDate) as number) < now,
  );
  const overdue = overdueTasks.length;

  if (input.status === "COMPLETED") return { health: "COMPLETED", progress, total, done, overdue };
  if (input.status === "ON_HOLD") return { health: "BLOCKED", progress, total, done, overdue };
  if (overdueTasks.some((t) => t.priority === "HIGH")) return { health: "BLOCKED", progress, total, done, overdue };
  if (overdue > 0) return { health: "AT_RISK", progress, total, done, overdue };
  const due = toTime(input.dueDate);
  if (due !== null && due < now && total - done > 0) return { health: "AT_RISK", progress, total, done, overdue };
  return { health: "HEALTHY", progress, total, done, overdue };
}

export function isOverdue(dueDate: Date | string | null | undefined, status: string, now = Date.now()): boolean {
  if (status === "DONE") return false;
  const t = toTime(dueDate);
  return t !== null && t < now;
}
