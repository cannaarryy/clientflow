import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { registerSchema, loginSchema } from "../schemas/auth.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { signToken, AUTH_COOKIE, cookieOptions } from "../utils/jwt.js";
import { recordActivity } from "../utils/activity.js";

const DEMO_EMAIL = "demo@clientflow.io";

const router = Router();

const safeUser = (u: { id: string; email: string; name: string; tokenVersion: number }) => u;

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const input = registerSchema.parse(req.body);
    const email = input.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ success: false, message: "An account with this email already exists" });
    const passwordHash = await hashPassword(input.password);
    const user = await prisma.user.create({ data: { email, name: input.name.trim(), passwordHash } });
    await recordActivity(user.id, "user.registered", `Welcome, ${user.name}. Account created.`);
    const token = signToken(user.id, user.tokenVersion);
    res.cookie(AUTH_COOKIE, token, cookieOptions());
    
    const membership = await prisma.membership.findFirst({
      where: { userId: user.id },
      select: { organizationId: true, role: true },
      orderBy: { createdAt: "desc" },
    });
    
    return res.status(201).json({ 
      success: true, 
      data: { 
        user: safeUser({ id: user.id, email: user.email, name: user.name, tokenVersion: user.tokenVersion }),
        membership 
      } 
    });
  }),
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const input = loginSchema.parse(req.body);
    const email = input.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ success: false, message: "Invalid email or password" });
    const ok = await verifyPassword(input.password, user.passwordHash);
    if (!ok) return res.status(401).json({ success: false, message: "Invalid email or password" });
    const token = signToken(user.id, user.tokenVersion);
    res.cookie(AUTH_COOKIE, token, cookieOptions());
    
    const membership = await prisma.membership.findFirst({
      where: { userId: user.id },
      select: { organizationId: true, role: true },
      orderBy: { createdAt: "desc" },
    });
    
    return res.json({ 
      success: true, 
      data: { 
        user: safeUser({ id: user.id, email: user.email, name: user.name, tokenVersion: user.tokenVersion }),
        membership 
      } 
    });
  }),
);

router.post("/logout", requireAuth, asyncHandler(async (req, res) => {
  const { userId } = req as AuthRequest;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user) {
    await prisma.user.update({ where: { id: userId }, data: { tokenVersion: user.tokenVersion + 1 } });
  }
  res.clearCookie(AUTH_COOKIE, { path: "/" });
  return res.json({ success: true, message: "Logged out" });
}));

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { userId, organizationId } = req as AuthRequest;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true, createdAt: true } });
    if (!user) return res.status(401).json({ success: false, message: "Not authenticated" });
    
    let membership = null;
    if (organizationId) {
      const mem = await prisma.membership.findUnique({
        where: { userId_organizationId: { userId: userId!, organizationId: organizationId! } },
        select: { organizationId: true, role: true },
      });
      if (mem) membership = { organizationId: mem.organizationId, role: mem.role as "OWNER" | "ADMIN" | "MEMBER" | "VIEWER" };
    }
    
    return res.json({ success: true, data: { user, membership } });
  }),
);

export default router;
