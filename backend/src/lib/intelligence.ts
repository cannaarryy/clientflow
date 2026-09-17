import { prisma } from "../lib/prisma.js";
import { computeHealth } from "../utils/health.js";

export interface NextAction {
  kind: "overdue" | "due_soon" | "stale_lead" | "open_request" | "idle_project";
  message: string;
  entityType?: string;
  entityId?: string;
}

/**
 * Intelligence layer (v0.2): provider interface, local heuristic implementation.
 *
 * There is NO external AI call here. Every suggestion is computed from real
 * workspace data with transparent rules. To plug a real model later:
 * implement `IntelligenceProvider` and select it via INTELLIGENCE_PROVIDER —
 * the REST contract stays identical and no API keys ever touch the repo.
 */
export interface IntelligenceProvider {
  nextActions(userId: string): Promise<NextAction[]>;
  projectSummary(userId: string, projectId: string): Promise<ProjectSummary | null>;
}

export interface ProjectSummary {
  progress: number;
  health: string;
  total: number;
  done: number;
  overdue: number;
  nextDue?: { title: string; dueDate: string } | null;
  highlights: string[];
}

const DAY = 24 * 60 * 60 * 1000;

class LocalHeuristicProvider implements IntelligenceProvider {
  async nextActions(userId: string): Promise<NextAction[]> {
    const now = Date.now();
    const out: NextAction[] = [];

    const overdue = await prisma.task.findMany({
      where: { userId, status: { not: "DONE" }, dueDate: { lt: new Date(now) } },
      orderBy: { dueDate: "asc" },
      take: 3,
      select: { id: true, title: true },
    });
    for (const t of overdue) out.push({ kind: "overdue", message: `Overdue: ${t.title}`, entityType: "task", entityId: t.id });

    const dueSoon = await prisma.task.findMany({
      where: { userId, status: { not: "DONE" }, dueDate: { gte: new Date(now), lt: new Date(now + 3 * DAY) } },
      orderBy: { dueDate: "asc" },
      take: 3,
      select: { id: true, title: true },
    });
    for (const t of dueSoon) out.push({ kind: "due_soon", message: `Due within 3 days: ${t.title}`, entityType: "task", entityId: t.id });

    const openRequests = await prisma.clientRequest.findMany({
      where: { userId, status: "OPEN" },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, title: true },
    });
    for (const r of openRequests) out.push({ kind: "open_request", message: `Untriaged request: ${r.title}`, entityType: "request", entityId: r.id });

    const staleLeads = await prisma.client.findMany({
      where: { userId, status: "LEAD", updatedAt: { lt: new Date(now - 14 * DAY) } },
      take: 2,
      select: { id: true, name: true },
    });
    for (const c of staleLeads) out.push({ kind: "stale_lead", message: `Lead untouched for 14+ days: ${c.name}`, entityType: "client", entityId: c.id });

    return out.slice(0, 6);
  }

  async projectSummary(userId: string, projectId: string): Promise<ProjectSummary | null> {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
      include: { tasks: { orderBy: { dueDate: "asc" } }, client: { select: { name: true, company: true } } },
    });
    if (!project) return null;
    const h = computeHealth({ status: project.status, dueDate: project.dueDate, tasks: project.tasks });
    const next = project.tasks.find((t) => t.status !== "DONE" && t.dueDate);
    const highlights: string[] = [];
    highlights.push(`${h.done}/${h.total} tasks done (${h.progress}%).`);
    if (h.overdue > 0) highlights.push(`${h.overdue} overdue — clear these first.`);
    if (project.dueDate && h.health === "AT_RISK") highlights.push(`Deadline pressure: due ${new Date(project.dueDate).toLocaleDateString()}.`);
    if (h.total === 0) highlights.push("No tasks yet — break the scope into tasks.");
    if (h.health === "COMPLETED") highlights.push("Delivered. Consider a follow-up task or review.");
    return {
      progress: h.progress,
      health: h.health,
      total: h.total,
      done: h.done,
      overdue: h.overdue,
      nextDue: next?.dueDate ? { title: next.title, dueDate: next.dueDate.toISOString() } : null,
      highlights,
    };
  }
}

const PROVIDER = process.env.INTELLIGENCE_PROVIDER ?? "local";

export function getProvider(): IntelligenceProvider {
  // Future: `if (PROVIDER === "openai") return new OpenAIProvider(...)`.
  void PROVIDER;
  return new LocalHeuristicProvider();
}
