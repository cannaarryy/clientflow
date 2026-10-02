import { Router, type RequestHandler } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth, type AuthRequest, requirePermission } from "../middleware/auth.js";
import { computeHealth } from "../utils/health.js";
import { getProvider } from "../lib/intelligence.js";

const router = Router();
router.use(requireAuth);

const dashboardRead: RequestHandler = requirePermission("projects:read");

function orgWhere(req: AuthRequest, extra: Record<string, unknown> = {}) {
  const base: Record<string, unknown> = { organizationId: req.organizationId };
  return { ...base, ...extra };
}

// GET /api/dashboard — real workspace overview (nothing invented)
router.get(
  "/",
  dashboardRead,
  asyncHandler(async (req, res) => {
    const { organizationId } = req as AuthRequest;
    const now = new Date();
    const [
      activeClients,
      activeProjects,
      openTasks,
      completedTasks,
      overdueTasks,
      recentActivity,
      upcomingTasks,
      recentClients,
      openRequests,
      unreadNotifications,
      projectsRaw,
      nextActions,
    ] = await Promise.all([
      prisma.client.count({ where: { organizationId, status: "ACTIVE" } }),
      prisma.project.count({ where: { organizationId, status: "ACTIVE" } }),
      prisma.task.count({ where: { organizationId, status: { in: ["TODO", "IN_PROGRESS"] } } }),
      prisma.task.count({ where: { organizationId, status: "DONE" } }),
      prisma.task.findMany({
        where: { organizationId, status: { not: "DONE" }, dueDate: { lt: now } },
        orderBy: { dueDate: "asc" },
        take: 5,
        include: {
          project: { select: { id: true, name: true } },
          client: { select: { id: true, name: true, company: true } },
        },
      }),
      prisma.activity.findMany({ where: orgWhere(req), orderBy: { createdAt: "desc" }, take: 8 }),
      prisma.task.findMany({
        where: { organizationId, status: { in: ["TODO", "IN_PROGRESS"] }, dueDate: { gte: now } },
        orderBy: { dueDate: "asc" },
        take: 6,
        include: {
          project: { select: { id: true, name: true } },
          client: { select: { id: true, name: true, company: true } },
        },
      }),
      prisma.client.findMany({ where: orgWhere(req), orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.clientRequest.findMany({
        where: orgWhere(req, { status: "OPEN" }),
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { client: { select: { id: true, name: true, company: true } } },
      }),
      prisma.notification.count({ where: { organizationId, readAt: null } }),
      prisma.project.findMany({
        where: { organizationId, status: { in: ["ACTIVE", "PLANNING", "ON_HOLD"] } },
        orderBy: { dueDate: "asc" },
        take: 6,
        include: {
          client: { select: { id: true, name: true, company: true } },
          tasks: { select: { status: true, priority: true, dueDate: true } },
        },
      }),
      getProvider().nextActions((req as AuthRequest).userId!),
    ]);

    const projectHealth = projectsRaw.map((p: typeof projectsRaw[0]) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      dueDate: p.dueDate,
      client: p.client,
      ...computeHealth({ status: p.status, dueDate: p.dueDate, tasks: p.tasks }),
    }));

    // Upcoming deadlines: dated projects + dated open tasks, merged & sorted.
    const deadlines = [
      ...projectsRaw.filter((p: typeof projectsRaw[0]) => p.dueDate && p.dueDate >= now).map((p: typeof projectsRaw[0]) => ({ kind: "project" as const, id: p.id, title: p.name, dueDate: p.dueDate!.toISOString() })),
      ...upcomingTasks.filter((t: typeof upcomingTasks[0]) => t.dueDate).map((t: typeof upcomingTasks[0]) => ({ kind: "task" as const, id: t.id, title: t.title, dueDate: (t.dueDate as Date).toISOString() })),
    ]
      .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate))
      .slice(0, 6);

    return res.json({
      success: true,
      data: {
        stats: { activeClients, activeProjects, openTasks, completedTasks, overdue: overdueTasks.length, openRequests: openRequests.length, unreadNotifications },
        recentActivity,
        upcomingTasks,
        overdueTasks,
        recentClients,
        openRequests,
        projectHealth,
        deadlines,
        nextActions,
      },
    });
  }),
);

export default router