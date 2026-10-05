import { Router, type RequestHandler } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth, type AuthRequest, requirePermission } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

const auditRead: RequestHandler = requirePermission("admin:access");

function orgWhere(req: AuthRequest, extra: Record<string, unknown> = {}) {
  const base: Record<string, unknown> = { organizationId: req.organizationId };
  return { ...base, ...extra };
}

type AuditWhere = {
  organizationId: string;
  action?: string;
  resourceType?: string;
  userId?: string;
  createdAt?: { gte?: Date; lte?: Date };
};

// GET /api/admin/audit — list audit logs with filters
router.get(
  "/audit",
  auditRead,
  asyncHandler(async (req: AuthRequest, res) => {
    const organizationId = req.organizationId!;
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 50)));
    const action = typeof req.query.action === "string" ? req.query.action : undefined;
    const resourceType = typeof req.query.resourceType === "string" ? req.query.resourceType : undefined;
    const userIdFilter = typeof req.query.userId === "string" ? req.query.userId : undefined;
    const from = typeof req.query.from === "string" ? new Date(req.query.from) : undefined;
    const to = typeof req.query.to === "string" ? new Date(req.query.to) : undefined;

    const where: AuditWhere = { organizationId };
    if (action) where.action = action;
    if (resourceType) where.resourceType = resourceType;
    if (userIdFilter) where.userId = userIdFilter;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = from;
      if (to) where.createdAt.lte = to;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return res.json({
      success: true,
      data: {
        logs,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  }),
);

// GET /api/admin/audit/:id — get single audit log detail
router.get(
  "/audit/:id",
  auditRead,
  asyncHandler(async (req: AuthRequest, res) => {
    const organizationId = req.organizationId!;
    const log = await prisma.auditLog.findFirst({
      where: { id: req.params.id, organizationId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    if (!log) return res.status(404).json({ success: false, message: "Audit log not found" });
    return res.json({ success: true, data: { log } });
  }),
);

// GET /api/admin/audit/stats — audit log statistics
router.get(
  "/audit/stats",
  auditRead,
  asyncHandler(async (req: AuthRequest, res) => {
    const organizationId = req.organizationId!;
    const from = typeof req.query.from === "string" ? new Date(req.query.from) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const to = typeof req.query.to === "string" ? new Date(req.query.to) : new Date();

    const where = {
      organizationId,
      createdAt: { gte: from, lte: to },
    };

    const [total, byAction, byResourceType, byUser, byStatusCode] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.groupBy({ by: ["action"], where, _count: { action: true }, orderBy: { _count: { action: "desc" } }, take: 20 }),
      prisma.auditLog.groupBy({ by: ["resourceType"], where, _count: { resourceType: true }, orderBy: { _count: { resourceType: "desc" } } }),
      prisma.auditLog.groupBy({ by: ["userId"], where, _count: { userId: true }, orderBy: { _count: { userId: "desc" } }, take: 20 }),
      prisma.auditLog.groupBy({ by: ["statusCode"], where, _count: { statusCode: true } }),
    ]);

    return res.json({
      success: true,
      data: {
        total,
        byAction: byAction.map((a) => ({ action: a.action, count: a._count.action })),
        byResourceType: byResourceType.map((r) => ({ resourceType: r.resourceType, count: r._count.resourceType })),
        byUser: byUser.map((u) => ({ userId: u.userId, count: u._count.userId })),
        byStatusCode: byStatusCode.map((s) => ({ statusCode: s.statusCode, count: s._count.statusCode })),
      },
    });
  }),
);

export default router;