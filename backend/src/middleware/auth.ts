import type { NextFunction, Request, Response } from "express";
import { verifyToken, AUTH_COOKIE } from "../utils/jwt.js";
import { prisma } from "../lib/prisma.js";

export interface AuthRequest extends Request {
  userId?: string;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.[AUTH_COOKIE];
  if (!token) return res.status(401).json({ success: false, message: "Not authenticated" });
  try {
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { id: true } });
    if (!user) return res.status(401).json({ success: false, message: "Not authenticated" });
    req.userId = user.id;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Session expired. Please log in again." });
  }
}
