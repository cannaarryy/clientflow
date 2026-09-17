import { prisma } from "../lib/prisma.js";
import { recordActivity } from "./activity.js";

export type TriggerId = "project.completed" | "task.completed" | "task.overdue" | "request.created";
export type ActionId = "create_task" | "create_activity" | "create_notification";

export const TRIGGERS: Array<{ id: TriggerId; label: string }> = [
  { id: "project.completed", label: "Project becomes completed" },
  { id: "task.completed", label: "Task becomes completed" },
  { id: "task.overdue", label: "Task becomes overdue" },
  { id: "request.created", label: "Request is created" },
];

export const ACTIONS: Array<{ id: ActionId; label: string }> = [
  { id: "create_task", label: "Create a follow-up task" },
  { id: "create_activity", label: "Log an activity entry" },
  { id: "create_notification", label: "Create a notification" },
];

export interface RuleContext {
  entityId?: string;
  entityType?: string;
  message?: string;
  projectId?: string;
  clientId?: string;
  title?: string;
  [key: string]: unknown;
}

function parseConfig(raw: string): Record<string, unknown> {
  try {
    const v = JSON.parse(raw) as unknown;
    return typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/**
 * Extensible automation engine: Trigger → Rule → Action.
 * Rules live in the DB (AutomationRule); triggers are evaluated from
 * domain events. Adding a trigger/action = one entry + one branch below.
 */
export async function evaluateAutomations(userId: string, trigger: string, ctx: RuleContext): Promise<number> {
  const rules = await prisma.automationRule.findMany({ where: { userId, trigger, enabled: true } });
  let fired = 0;
  for (const rule of rules) {
    try {
      await runAction(userId, rule.action, parseConfig(rule.config), ctx, trigger);
      await prisma.automationRule.update({ where: { id: rule.id }, data: { lastRunAt: new Date() } });
      fired += 1;
    } catch (err) {
      console.error(`[automations] rule ${rule.id} failed`, err);
    }
  }
  return fired;
}

async function runAction(
  userId: string,
  action: string,
  config: Record<string, unknown>,
  ctx: RuleContext,
  trigger: string,
): Promise<void> {
  const str = (v: unknown, fallback: string): string => (typeof v === "string" && v.trim() ? v : fallback);

  if (action === "create_task") {
    const title = str(
      config.title,
      trigger === "project.completed" ? `Follow up: ${str(ctx.title, "completed project")}` : `Follow up: ${str((ctx.title ?? ctx.message) as string | undefined, "open item")}`,
    );
    await prisma.task.create({
      data: {
        userId,
        title: title.slice(0, 200),
        description: typeof config.description === "string" ? config.description : undefined,
        priority: config.priority === "LOW" || config.priority === "HIGH" ? (config.priority as string) : "MEDIUM",
        projectId: typeof ctx.projectId === "string" ? ctx.projectId : undefined,
        clientId: typeof ctx.clientId === "string" ? ctx.clientId : undefined,
      },
    });
    await recordActivity(userId, "automation.task_created", `Automation created task: ${title}`);
    return;
  }

  if (action === "create_activity") {
    await recordActivity(
      userId,
      "automation.note",
      str(config.message, `Automation ran for ${trigger}`),
      typeof ctx.entityType === "string" ? ctx.entityType : undefined,
      typeof ctx.entityId === "string" ? ctx.entityId : undefined,
    );
    return;
  }

  if (action === "create_notification") {
    const message = str(config.message, ctx.message ?? `Automation: ${trigger}`);
    const entityId = typeof ctx.entityId === "string" ? ctx.entityId : undefined;
    const exists = await prisma.notification.findFirst({ where: { userId, type: `automation.${trigger}`, entityId, readAt: null } });
    if (exists) return; // idempotent: don't spam unread for the same entity
    await prisma.notification.create({
      data: { userId, type: `automation.${trigger}`, message, entityType: typeof ctx.entityType === "string" ? ctx.entityType : undefined, entityId },
    });
    return;
  }

  console.warn(`[automations] unknown action: ${action}`);
}

/**
 * Overdue scanner. Called explicitly (dashboard + "run now"), never silently
 * on every request. Emits one event per newly-overdue task; notification
 * dedupe in emitEvent keeps it idempotent.
 */
export async function runOverdueCheck(userId: string, now = Date.now()): Promise<number> {
  const tasks = await prisma.task.findMany({
    where: { userId, status: { not: "DONE" }, dueDate: { lt: new Date(now) } },
    select: { id: true, title: true, projectId: true, clientId: true },
    take: 50,
  });
  for (const t of tasks) {
    const { emitEvent } = await import("./events.js");
    await emitEvent({
      userId,
      type: "task.overdue",
      message: `Task overdue: ${t.title}`,
      entityType: "task",
      entityId: t.id,
      context: { projectId: t.projectId ?? undefined, clientId: t.clientId ?? undefined, title: t.title },
    });
  }
  return tasks.length;
}
