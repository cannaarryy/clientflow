import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { createProjectSchema, updateProjectSchema } from "../schemas/project.js";
import { recordActivity } from "../utils/activity.js";

const router = Router();
router.use(requireAuth);

const toDate = (v: unknown): Date | undefined => {
  if (typeof v !== "string" || !v) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
};
const clean = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthRequest;
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const status = typeof req.query.status === "string" ? req.query.status : "";
    const where: Record<string, unknown> = { userId };
    if (status && ["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED"].includes(status)) where.status = status;
    if (search) where.name = { contains: search, mode: "insensitive" };
    const projects = await prisma.project.findMany({
      where: where as never,
      orderBy: { updatedAt: "desc" },
      include: { client: { select: { id: true, name: true, company: true } }, _count: { select: { tasks: true } } },
    });
    return res.json({ success: true, data: { projects } });
  }),
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthRequest;
    const input = createProjectSchema.parse(req.body);
    const client = await prisma.client.findFirst({ where: { id: input.clientId, userId } });
    if (!client) return res.status(400).json({ success: false, message: "Client not found" });
    const project = await prisma.project.create({
      data: {
        userId: userId!,
        clientId: client.id,
        name: input.name.trim(),
        description: (clean(input.description) as string | undefined)?.trim(),
        status: input.status ?? "PLANNING",
        priority: input.priority ?? "MEDIUM",
        startDate: toDate(input.startDate),
        dueDate: toDate(input.dueDate),
      },
      include: { client: { select: { id: true, name: true, company: true } } },
    });
    await recordActivity(userId!, "project.created", `Project created: ${project.name}`, "project", project.id);
    return res.status(201).json({ success: true, data: { project } });
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthRequest;
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, userId },
      include: {
        client: true,
        tasks: { orderBy: { createdAt: "desc" } },
        notesList: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });
    return res.json({ success: true, data: { project } });
  }),
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthRequest;
    const input = updateProjectSchema.parse(req.body);
    const existing = await prisma.project.findFirst({ where: { id: req.params.id, userId } });
    if (!existing) return res.status(404).json({ success: false, message: "Project not found" });
    if (input.clientId) {
      const client = await prisma.client.findFirst({ where: { id: input.clientId, userId } });
      if (!client) return res.status(400).json({ success: false, message: "Client not found" });
    }
    const project = await prisma.project.update({
      where: { id: existing.id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.description !== undefined ? { description: (clean(input.description) as string | undefined)?.trim() ?? null } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
        ...(input.clientId !== undefined ? { clientId: input.clientId } : {}),
        ...(input.startDate !== undefined ? { startDate: toDate(input.startDate) } : {}),
        ...(input.dueDate !== undefined ? { dueDate: toDate(input.dueDate) } : {}),
      },
      include: { client: { select: { id: true, name: true, company: true } } },
    });
    await recordActivity(userId!, "project.updated", `Project updated: ${project.name}`, "project", project.id);
    return res.json({ success: true, data: { project } });
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthRequest;
    const existing = await prisma.project.findFirst({ where: { id: req.params.id, userId } });
    if (!existing) return res.status(404).json({ success: false, message: "Project not found" });
    await prisma.project.delete({ where: { id: existing.id } });
    await recordActivity(userId!, "project.deleted", `Project deleted: ${existing.name}`);
    return res.json({ success: true, message: "Project deleted" });
  }),
);

export default router;
