import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { createClientSchema, updateClientSchema } from "../schemas/client.js";
import { recordActivity } from "../utils/activity.js";

const router = Router();
router.use(requireAuth);

const clean = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthRequest;
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const status = typeof req.query.status === "string" ? req.query.status : "";
    const where: Record<string, unknown> = { userId };
    if (status && ["ACTIVE", "INACTIVE", "LEAD"].includes(status)) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
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
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthRequest;
    const input = createClientSchema.parse(req.body);
    const client = await prisma.client.create({
      data: {
        userId: userId!,
        name: input.name.trim(),
        company: (clean(input.company) as string | undefined)?.trim(),
        email: (clean(input.email) as string | undefined)?.toLowerCase().trim(),
        phone: (clean(input.phone) as string | undefined)?.trim(),
        notes: (clean(input.notes) as string | undefined)?.trim(),
        status: input.status ?? "ACTIVE",
      },
    });
    await recordActivity(userId!, "client.created", `Client created: ${client.name}`, "client", client.id);
    return res.status(201).json({ success: true, data: { client } });
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthRequest;
    const client = await prisma.client.findFirst({
      where: { id: req.params.id, userId },
      include: {
        projects: { orderBy: { updatedAt: "desc" } },
        tasks: { orderBy: { updatedAt: "desc" }, take: 20 },
        notesList: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });
    if (!client) return res.status(404).json({ success: false, message: "Client not found" });
    const activities = await prisma.activity.findMany({
      where: { userId, entityType: "client", entityId: client.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    return res.json({ success: true, data: { client, activities } });
  }),
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthRequest;
    const input = updateClientSchema.parse(req.body);
    const existing = await prisma.client.findFirst({ where: { id: req.params.id, userId } });
    if (!existing) return res.status(404).json({ success: false, message: "Client not found" });
    const client = await prisma.client.update({
      where: { id: existing.id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.company !== undefined ? { company: (clean(input.company) as string | undefined)?.trim() ?? null } : {}),
        ...(input.email !== undefined ? { email: (clean(input.email) as string | undefined)?.toLowerCase().trim() ?? null } : {}),
        ...(input.phone !== undefined ? { phone: (clean(input.phone) as string | undefined)?.trim() ?? null } : {}),
        ...(input.notes !== undefined ? { notes: (clean(input.notes) as string | undefined)?.trim() ?? null } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
    });
    await recordActivity(userId!, "client.updated", `Client updated: ${client.name}`, "client", client.id);
    return res.json({ success: true, data: { client } });
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthRequest;
    const existing = await prisma.client.findFirst({ where: { id: req.params.id, userId } });
    if (!existing) return res.status(404).json({ success: false, message: "Client not found" });
    await prisma.client.delete({ where: { id: existing.id } });
    await recordActivity(userId!, "client.deleted", `Client deleted: ${existing.name}`);
    return res.json({ success: true, message: "Client deleted" });
  }),
);

export default router;
