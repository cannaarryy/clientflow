import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { updateProfileSchema, changePasswordSchema } from "../schemas/auth.js";
import { verifyPassword, hashPassword } from "../utils/password.js";

const router = Router();
router.use(requireAuth);

router.patch(
  "/profile",
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthRequest;
    const input = updateProfileSchema.parse(req.body);
    if (input.email) {
      const taken = await prisma.user.findFirst({ where: { email: input.email.toLowerCase().trim(), NOT: { id: userId } } });
      if (taken) return res.status(409).json({ success: false, message: "This email is already in use" });
    }
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.email !== undefined ? { email: input.email.toLowerCase().trim() } : {}),
      },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    return res.json({ success: true, data: { user } });
  }),
);

router.patch(
  "/password",
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthRequest;
    const input = changePasswordSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(401).json({ success: false, message: "Not authenticated" });
    const ok = await verifyPassword(input.currentPassword, user.passwordHash);
    if (!ok) return res.status(400).json({ success: false, message: "Current password is incorrect" });
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(input.newPassword) } });
    return res.json({ success: true, message: "Password updated" });
  }),
);

export default router;
