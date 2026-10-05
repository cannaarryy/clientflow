import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import crypto from "crypto";

interface AuditData {
  organizationId: string;
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  oldData?: unknown;
  newData?: unknown;
  statusCode: number;
}

declare global {
  namespace Express {
    interface Request {
      auditData?: AuditData;
      auditRequestId?: string;
    }
  }
}

function generateRequestId(): string {
  return crypto.randomUUID();
}

function sanitizeForAudit(data: unknown): string | null {
  if (data === undefined || data === null) return null;
  try {
    // Remove sensitive fields before logging
    const sanitized = JSON.parse(JSON.stringify(data, (key, value) => {
      if (typeof key === "string" && (
        key.toLowerCase().includes("password") ||
        key.toLowerCase().includes("token") ||
        key.toLowerCase().includes("secret") ||
        key.toLowerCase().includes("hash") ||
        key.toLowerCase().includes("cookie")
      )) {
        return "[REDACTED]";
      }
      return value;
    }));
    return JSON.stringify(sanitized);
  } catch {
    return null;
  }
}

export async function auditMiddleware(req: Request, res: Response, next: NextFunction) {
  // Generate request ID for correlation
  req.auditRequestId = req.headers["x-request-id"] as string || generateRequestId();
  res.setHeader("x-request-id", req.auditRequestId);

  // Capture request body for audit (before it's modified)
  const originalBody = req.body ? JSON.parse(JSON.stringify(req.body)) : undefined;

  // Capture response
  const originalSend = res.send;
  let responseBody: unknown;

  res.send = function (body?: unknown): Response {
    responseBody = body;
    return originalSend.call(this, body);
  };

  res.on("finish", async () => {
    // Only audit authenticated requests to sensitive endpoints
    if (!req.auditData) return;

    try {
      const { organizationId, userId, action, resourceType, resourceId, oldData, newData, statusCode } = req.auditData;

      await prisma.auditLog.create({
        data: {
          organizationId,
          userId,
          requestId: req.auditRequestId!,
          action,
          resourceType,
          resourceId,
          oldData: sanitizeForAudit(oldData),
          newData: sanitizeForAudit(newData ?? responseBody),
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
          statusCode,
        },
      });
    } catch (err) {
      // Never let audit logging break the main request
      console.error("[audit] failed to write audit log:", err);
    }
  });

  next();
}

// Helper to set audit data in route handlers
export function setAuditData(req: Request, data: Partial<AuditData>) {
  req.auditData = { ...req.auditData, ...data } as AuditData;
}

export function createAuditData(
  organizationId: string,
  action: string,
  resourceType: string,
  options: { userId?: string; resourceId?: string; oldData?: unknown; newData?: unknown; statusCode?: number } = {}
): Partial<AuditData> {
  return {
    organizationId,
    action,
    resourceType,
    ...options,
    statusCode: options.statusCode ?? 200,
  };
}