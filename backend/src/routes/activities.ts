import { Router, type RequestHandler } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth, type AuthRequest, requirePermission } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

const activitiesRead: RequestHandler = requirePermission("notes:read"); // activities are part of notes domain

function orgWhere(req: AuthRequest, extra: Record<string, unknown> = {}) {
  const base: Record<string, unknown> = { organizationId: req.organizationId };
  return { ...base, ...extra };
}

router.get(
  "/",
  activitiesRead,
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit ?? 30) || 30, 100);
    const activities = await prisma.activity.findMany({
      where: orgWhere(req),
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return res.json({ success: true, data: { activities } });
  }),
);

export default router