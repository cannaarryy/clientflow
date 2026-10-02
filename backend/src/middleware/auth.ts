import type { NextFunction, Request, Response } from "express";
import { verifyToken, AUTH_COOKIE } from "../utils/jwt.js";
import { prisma } from "../lib/prisma.js";

export interface AuthRequest extends Request {
  userId?: string;
  organizationId?: string;
  membershipRole?: string;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.[AUTH_COOKIE];
  if (!token) return res.status(401).json({ success: false, message: "Not authenticated" });
  try {
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, tokenVersion: true, organizationId: true },
    });
    if (!user) return res.status(401).json({ success: false, message: "Not authenticated" });
    if (user.tokenVersion !== payload.tokenVersion) {
      return res.status(401).json({ success: false, message: "Session expired. Please log in again." });
    }
    req.userId = user.id;
    req.organizationId = user.organizationId ?? undefined;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Session expired. Please log in again." });
  }
}

export type Permission =
  | "clients:read" | "clients:write" | "clients:delete"
  | "projects:read" | "projects:write" | "projects:delete"
  | "tasks:read" | "tasks:write" | "tasks:delete"
  | "notes:read" | "notes:write" | "notes:delete"
  | "requests:read" | "requests:write" | "requests:delete"
  | "comments:read" | "comments:write" | "comments:delete"
  | "automations:read" | "automations:write" | "automations:delete"
  | "users:read" | "users:write" | "users:delete"
  | "settings:read" | "settings:write"
  | "admin:access";

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  OWNER: [
    "clients:read", "clients:write", "clients:delete",
    "projects:read", "projects:write", "projects:delete",
    "tasks:read", "tasks:write", "tasks:delete",
    "notes:read", "notes:write", "notes:delete",
    "requests:read", "requests:write", "requests:delete",
    "comments:read", "comments:write", "comments:delete",
    "automations:read", "automations:write", "automations:delete",
    "users:read", "users:write", "users:delete",
    "settings:read", "settings:write",
    "admin:access",
  ],
  ADMIN: [
    "clients:read", "clients:write", "clients:delete",
    "projects:read", "projects:write", "projects:delete",
    "tasks:read", "tasks:write", "tasks:delete",
    "notes:read", "notes:write", "notes:delete",
    "requests:read", "requests:write", "requests:delete",
    "comments:read", "comments:write", "comments:delete",
    "automations:read", "automations:write", "automations:delete",
    "users:read", "users:write",
    "settings:read", "settings:write",
  ],
  MEMBER: [
    "clients:read", "clients:write",
    "projects:read", "projects:write",
    "tasks:read", "tasks:write",
    "notes:read", "notes:write",
    "requests:read", "requests:write",
    "comments:read", "comments:write",
    "automations:read",
    "settings:read",
  ],
  VIEWER: [
    "clients:read",
    "projects:read",
    "tasks:read",
    "notes:read",
    "requests:read",
    "comments:read",
    "automations:read",
    "settings:read",
  ],
};

export function requirePermission(permission: Permission) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userId || !req.organizationId) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }
    const membership = await prisma.membership.findUnique({
      where: { userId_organizationId: { userId: req.userId, organizationId: req.organizationId } },
      select: { role: true },
    });
    if (!membership) {
      return res.status(403).json({ success: false, message: "Not a member of this organization" });
    }
    const allowed = ROLE_PERMISSIONS[membership.role] ?? [];
    if (!allowed.includes(permission)) {
      return res.status(403).json({ success: false, message: "Insufficient permissions" });
    }
    req.membershipRole = membership.role;
    next();
  };
}

export function hasPermission(role: string, permission: Permission): boolean {
  const allowed = ROLE_PERMISSIONS[role] ?? [];
  return allowed.includes(permission);
}