import { Router, type RequestHandler } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth, type AuthRequest, requirePermission } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

const notificationsRead: RequestHandler = requirePermission("notes:read");
const notificationsWrite: RequestHandler = requirePermission("notes:write");

function orgWhere(req: AuthRequest, extra: Record<string, unknown> = {}) {
  const base: Record<string, unknown> = { organizationId: req.organizationId };
  return { ...base, ...extra };
}

router.get(
  "/",
  notificationsRead,
  asyncHandler(async (req: AuthRequest, res) => {
    const unreadOnly = req.query.unread === "1";
    const notifications = await prisma.notification.findMany({
      where: { organizationId: req.organizationId, ...(unreadOnly ? { readAt: null } : {}) },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    const unread = await prisma.notification.count({ where: { organizationId: req.organizationId, readAt: null } });
    return res.json({ success: true, data: { notifications, unread } });
  }),
);

router.patch(
  "/:id/read",
  notificationsWrite,
  asyncHandler(async (req: AuthRequest, res) => {
    const existing = await prisma.notification.findFirst({ where: { id: req.params.id, organizationId: req.organizationId } });
    if (!existing) return res.status(404).json({ success: false, message: "Notification not found" });
    const notification = await prisma.notification.update({ where: { id: existing.id }, data: { readAt: new Date() } });
    return res.json({ success: true, data: { notification } });
  }),
);

router.post(
  "/read-all",
  notificationsWrite,
  asyncHandler(async (req: AuthRequest, res) => {
    await prisma.notification.updateMany({ where: { organizationId: req.organizationId, readAt: null }, data: { readAt: new Date() } });
    return res.json({ success: true, message: "All notifications marked as read" });
  }),
);

export default router