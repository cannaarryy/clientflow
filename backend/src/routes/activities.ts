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
    const limit = Math.min(Number(req.query.limit ?? 30) || 30, 100);
    const activities = await prisma.activity.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return res.json({ success: true, data: { activities } });
  }),
);

export default router;
