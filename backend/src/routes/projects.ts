import { Router, type RequestHandler } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth, type AuthRequest, requirePermission } from "../middleware/auth.js";
import { createProjectSchema, updateProjectSchema, shareProjectSchema } from "../schemas/project.js";
import { recordActivity } from "../utils/activity.js";
import { emitEvent } from "../utils/events.js";
import { computeHealth } from "../utils/health.js";

const router = Router();
router.use(requireAuth);

const projectsRead: RequestHandler = requirePermission("projects:read");
const projectsWrite: RequestHandler = requirePermission("projects:write");
const projectsDelete: RequestHandler = requirePermission("projects:delete");

const toDate = (v: unknown): Date | undefined => {
  if (typeof v !== "string" || !v) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
};
const clean = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

function orgWhere(req: AuthRequest, extra: Record<string, unknown> = {}) {
  const base: Record<string, unknown> = { organizationId: req.organizationId };
  return { ...base, ...extra };
}

router.get(
  "/",
  projectsRead,
  asyncHandler(async (req, res) => {
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const status = typeof req.query.status === "string" ? req.query.status : "";
    const where = orgWhere(req);
    if (status && ["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED"].includes(status)) where.status = status;
    if (search) where.name = { contains: search };
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
  projectsWrite,
  asyncHandler(async (req, res) => {
    const { userId, organizationId } = req as AuthRequest;
    const input = createProjectSchema.parse(req.body);
    const client = await prisma.client.findFirst({ where: { id: input.clientId, organizationId } });
    if (!client) return res.status(400).json({ success: false, message: "Client not found" });
    const project = await prisma.project.create({
      data: {
        userId: userId!,
        organizationId,
        clientId: client.id,
        name: input.name.trim(),
        description: (clean(input.description) as string | undefined)?.trim(),
        status: input.status ?? "PLANNING",
        priority: input.priority ?? "MEDIUM",
        startDate: toDate(input.startDate),
        dueDate: toDate(input.dueDate),
        isShared: input.isShared ?? false,
      },
      include: { client: { select: { id: true, name: true, company: true } } },
    });
    await recordActivity(userId!, "project.created", `Project created: ${project.name}`, "project", project.id);
    return res.status(201).json({ success: true, data: { project } });
  }),
);

router.get(
  "/:id",
  projectsRead,
  asyncHandler(async (req, res) => {
    const { organizationId } = req as AuthRequest;
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, organizationId },
      include: {
        client: true,
        tasks: { orderBy: { createdAt: "desc" } },
        notesList: { orderBy: { createdAt: "desc" } },
        comments: { orderBy: { createdAt: "asc" } },
        requests: { orderBy: { createdAt: "desc" }, include: { client: { select: { id: true, name: true } } } },
      },
    });
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });
    const health = computeHealth({ status: project.status, dueDate: project.dueDate, tasks: project.tasks });
    return res.json({ success: true, data: { project, health } });
  }),
);

router.patch(
  "/:id",
  projectsWrite,
  asyncHandler(async (req, res) => {
    const { userId, organizationId } = req as AuthRequest;
    const input = updateProjectSchema.parse(req.body);
    const existing = await prisma.project.findFirst({ where: { id: req.params.id, organizationId } });
    if (!existing) return res.status(404).json({ success: false, message: "Project not found" });
    if (input.clientId) {
      const client = await prisma.client.findFirst({ where: { id: input.clientId, organizationId } });
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
        ...(input.isShared !== undefined ? { isShared: input.isShared } : {}),
      },
      include: { client: { select: { id: true, name: true, company: true } } },
    });
    if (input.status === "COMPLETED" && existing.status !== "COMPLETED") {
      await emitEvent({ userId: userId!, type: "project.completed", message: `Project completed: ${project.name}`, entityType: "project", entityId: project.id, context: { projectId: project.id, clientId: project.clientId, title: project.name } });
    } else {
      await recordActivity(userId!, "project.updated", `Project updated: ${project.name}`, "project", project.id);
    }
    return res.json({ success: true, data: { project } });
  }),
);

// PATCH /api/projects/:id/share — portal visibility toggle
router.patch(
  "/:id/share",
  projectsWrite,
  asyncHandler(async (req, res) => {
    const { userId, organizationId } = req as AuthRequest;
    const input = shareProjectSchema.parse(req.body);
    const existing = await prisma.project.findFirst({ where: { id: req.params.id, organizationId } });
    if (!existing) return res.status(404).json({ success: false, message: "Project not found" });
    const project = await prisma.project.update({ where: { id: existing.id }, data: { isShared: input.isShared } });
    await recordActivity(userId!, input.isShared ? "project.shared" : "project.unshared", `Project ${input.isShared ? "shared with client" : "unshared"}: ${project.name}`, "project", project.id);
    return res.json({ success: true, data: { project } });
  }),
);

router.delete(
  "/:id",
  projectsDelete,
  asyncHandler(async (req, res) => {
    const { userId, organizationId } = req as AuthRequest;
    const existing = await prisma.project.findFirst({ where: { id: req.params.id, organizationId } });
    if (!existing) return res.status(404).json({ success: false, message: "Project not found" });
    await prisma.project.delete({ where: { id: existing.id } });
    await recordActivity(userId!, "project.deleted", `Project deleted: ${existing.name}`);
    return res.json({ success: true, message: "Project deleted" });
  }),
);

export default router;