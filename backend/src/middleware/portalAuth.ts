import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export interface PortalRequest extends Request {
  portal?: { userId: string; clientId: string; clientName: string };
}

function extractToken(req: Request): string {
  // NOTE: req.params is NOT populated yet inside router-level middleware,
  // so the token is read from the path remainder after the mount point:
  // "/:token" or "/:token/requests" → first segment.
  const seg = req.path.split("/").filter(Boolean)[0];
  return seg ?? "";
}

/**
 * Client Portal auth: magic-link token scoped to ONE client.
 * The professional owns the data (userId); the token only selects the client.
 * Disabled or unknown tokens → 404 (no existence oracle).
 */
export async function portalAuth(req: PortalRequest, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) return res.status(404).json({ success: false, message: "Not found" });
  const client = await prisma.client.findFirst({
    where: { portalToken: token, portalEnabled: true },
    select: { id: true, userId: true, name: true },
  });
  if (!client) return res.status(404).json({ success: false, message: "Not found" });
  req.portal = { userId: client.userId, clientId: client.id, clientName: client.name };
  next();
}
