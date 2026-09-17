import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthRequest;
    const unreadOnly = req.query.unread === "1";
    const notifications = await prisma.notification.findMany({
      where: { userId, ...(unreadOnly ? { readAt: null } : {}) },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    const unread = await prisma.notification.count({ where: { userId, readAt: null } });
    return res.json({ success: true, data: { notifications, unread } });
  }),
);

router.patch(
  "/:id/read",
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthRequest;
    const existing = await prisma.notification.findFirst({ where: { id: req.params.id, userId } });
    if (!existing) return res.status(404).json({ success: false, message: "Notification not found" });
    const notification = await prisma.notification.update({ where: { id: existing.id }, data: { readAt: new Date() } });
    return res.json({ success: true, data: { notification } });
  }),
);

router.post(
  "/read-all",
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthRequest;
    await prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
    return res.json({ success: true, message: "All notifications marked as read" });
  }),
);

export default router;
