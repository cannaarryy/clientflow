import { Router, type RequestHandler } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth, type AuthRequest, requirePermission } from "../middleware/auth.js";
import { createClientSchema, updateClientSchema, portalSchema } from "../schemas/client.js";
import { recordActivity } from "../utils/activity.js";
import crypto from "crypto";

const router = Router();
router.use(requireAuth);

// Helper to get org-scoped where clause
function orgWhere(req: AuthRequest, extra: Record<string, unknown> = {}) {
  const base: Record<string, unknown> = { organizationId: req.organizationId };
  return { ...base, ...extra };
}

const clientsRead: RequestHandler = requirePermission("clients:read");
const clientsWrite: RequestHandler = requirePermission("clients:write");
const clientsDelete: RequestHandler = requirePermission("clients:delete");

router.get(
  "/",
  clientsRead,
  asyncHandler(async (req, res) => {
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const status = typeof req.query.status === "string" ? req.query.status : "";
    const where = orgWhere(req);
    if (status && ["ACTIVE", "INACTIVE", "LEAD"].includes(status)) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { company: { contains: search } },
        { email: { contains: search } },
      ];
    }
    const clients = await prisma.client.findMany({
      where: where as never,
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { projects: true, tasks: true } } },
    });
    return res.json({ success: true, data: { clients } });
  }),
);

router.post(
  "/",
  clientsWrite,
  asyncHandler(async (req, res) => {
    const { userId, organizationId } = req as AuthRequest;
    const input = createClientSchema.parse(req.body);
    const client = await prisma.client.create({
      data: {
        userId: userId!,
        organizationId,
        name: input.name.trim(),
        company: (input.company as string | undefined)?.trim(),
        email: (input.email as string | undefined)?.toLowerCase().trim(),
        phone: (input.phone as string | undefined)?.trim(),
        notes: (input.notes as string | undefined)?.trim(),
        status: input.status ?? "ACTIVE",
      },
    });
    await recordActivity(userId!, "client.created", `Client created: ${client.name}`, "client", client.id);
    return res.status(201).json({ success: true, data: { client } });
  }),
);

router.get(
  "/:id",
  clientsRead,
  asyncHandler(async (req, res) => {
    const { organizationId } = req as AuthRequest;
    const client = await prisma.client.findFirst({
      where: { id: req.params.id, organizationId },
      include: {
        projects: { orderBy: { updatedAt: "desc" } },
        tasks: { orderBy: { updatedAt: "desc" }, take: 20 },
        notesList: { orderBy: { createdAt: "desc" }, take: 20 },
        requests: { orderBy: { createdAt: "desc" }, take: 10, include: { project: { select: { id: true, name: true } } } },
      },
    });
    if (!client) return res.status(404).json({ success: false, message: "Client not found" });
    const activities = await prisma.activity.findMany({
      where: { organizationId, entityType: "client", entityId: client.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    return res.json({ success: true, data: { client, activities } });
  }),
);

router.patch(
  "/:id",
  clientsWrite,
  asyncHandler(async (req, res) => {
    const { userId, organizationId } = req as AuthRequest;
    const input = updateClientSchema.parse(req.body);
    const existing = await prisma.client.findFirst({ where: { id: req.params.id, organizationId } });
    if (!existing) return res.status(404).json({ success: false, message: "Client not found" });
    const client = await prisma.client.update({
      where: { id: existing.id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.company !== undefined ? { company: (input.company as string | undefined)?.trim() ?? null } : {}),
        ...(input.email !== undefined ? { email: (input.email as string | undefined)?.toLowerCase().trim() ?? null } : {}),
        ...(input.phone !== undefined ? { phone: (input.phone as string | undefined)?.trim() ?? null } : {}),
        ...(input.notes !== undefined ? { notes: (input.notes as string | undefined)?.trim() ?? null } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
    });
    await recordActivity(userId!, "client.updated", `Client updated: ${client.name}`, "client", client.id);
    return res.json({ success: true, data: { client } });
  }),
);

// PATCH /api/clients/:id/portal — enable/disable the Client Portal (magic link)
router.patch(
  "/:id/portal",
  clientsWrite,
  asyncHandler(async (req, res) => {
    const { userId, organizationId } = req as AuthRequest;
    const input = portalSchema.parse(req.body);
    const existing = await prisma.client.findFirst({ where: { id: req.params.id, organizationId } });
    if (!existing) return res.status(404).json({ success: false, message: "Client not found" });
    const client = await prisma.client.update({
      where: { id: existing.id },
      data: {
        portalEnabled: input.enabled,
        portalToken: input.enabled ? (existing.portalToken ?? crypto.randomBytes(32).toString("hex")) : existing.portalToken,
      },
      select: { id: true, portalEnabled: true, portalToken: true },
    });
    await recordActivity(userId!, input.enabled ? "portal.enabled" : "portal.disabled", `Portal ${input.enabled ? "enabled" : "disabled"} for ${existing.name}`, "client", existing.id);
    return res.json({ success: true, data: { portal: client } });
  }),
);

// POST /api/clients/:id/portal/regenerate — rotate the magic link
router.post(
  "/:id/portal/regenerate",
  clientsWrite,
  asyncHandler(async (req, res) => {
    const { userId, organizationId } = req as AuthRequest;
    const existing = await prisma.client.findFirst({ where: { id: req.params.id, organizationId } });
    if (!existing) return res.status(404).json({ success: false, message: "Client not found" });
    const client = await prisma.client.update({
      where: { id: existing.id },
      data: { portalToken: crypto.randomBytes(32).toString("hex"), portalEnabled: true },
      select: { id: true, portalEnabled: true, portalToken: true },
    });
    await recordActivity(userId!, "portal.regenerated", `Portal link regenerated for ${existing.name}`, "client", existing.id);
    return res.json({ success: true, data: { portal: client } });
  }),
);

router.delete(
  "/:id",
  clientsDelete,
  asyncHandler(async (req, res) => {
    const { userId, organizationId } = req as AuthRequest;
    const existing = await prisma.client.findFirst({ where: { id: req.params.id, organizationId } });
    if (!existing) return res.status(404).json({ success: false, message: "Client not found" });
    await prisma.client.delete({ where: { id: existing.id } });
    await recordActivity(userId!, "client.deleted", `Client deleted: ${existing.name}`);
    return res.json({ success: true, message: "Client deleted" });
  }),
);

export default router;