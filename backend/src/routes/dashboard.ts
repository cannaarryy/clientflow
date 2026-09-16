import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// GET /api/dashboard — overview numbers + recent slices
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthRequest;
    const [activeClients, activeProjects, openTasks, completedTasks, recentActivity, upcomingTasks, recentClients] =
      await Promise.all([
        prisma.client.count({ where: { userId, status: "ACTIVE" } }),
        prisma.project.count({ where: { userId, status: "ACTIVE" } }),
        prisma.task.count({ where: { userId, status: { in: ["TODO", "IN_PROGRESS"] } } }),
        prisma.task.count({ where: { userId, status: "DONE" } }),
        prisma.activity.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 8 }),
        prisma.task.findMany({
          where: { userId, status: { in: ["TODO", "IN_PROGRESS"] } },
          orderBy: { dueDate: "asc" },
          take: 6,
          include: {
            project: { select: { id: true, name: true } },
            client: { select: { id: true, name: true, company: true } },
          },
        }),
        prisma.client.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 5 }),
      ]);
    return res.json({
      success: true,
      data: {
        stats: { activeClients, activeProjects, openTasks, completedTasks },
        recentActivity,
        upcomingTasks,
        recentClients,
      },
    });
  }),
);

export default router;
