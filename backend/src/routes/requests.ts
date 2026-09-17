import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { createRequestSchema, updateRequestSchema } from "../schemas/request.js";
import { emitEvent } from "../utils/events.js";

const router = Router();
router.use(requireAuth);

const clean = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthRequest;
    const where: Record<string, unknown> = { userId };
    if (typeof req.query.status === "string" && req.query.status) where.status = req.query.status;
    if (typeof req.query.clientId === "string" && req.query.clientId) where.clientId = req.query.clientId;
    const requests = await prisma.clientRequest.findMany({
      where: where as never,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, name: true, company: true } },
        project: { select: { id: true, name: true } },
      },
    });
    return res.json({ success: true, data: { requests } });
  }),
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthRequest;
    const input = createRequestSchema.parse(req.body);
    const client = await prisma.client.findFirst({ where: { id: input.clientId, userId } });
    if (!client) return res.status(400).json({ success: false, message: "Client not found" });
    let projectId: string | undefined;
    if (input.projectId) {
      const p = await prisma.project.findFirst({ where: { id: input.projectId, userId, clientId: client.id } });
      if (!p) return res.status(400).json({ success: false, message: "Project not found" });
      projectId = p.id;
    }
    const request = await prisma.clientRequest.create({
      data: {
        userId: userId!,
        clientId: client.id,
        projectId,
        title: input.title.trim(),
        description: (clean(input.description) as string | undefined)?.trim(),
        priority: input.priority ?? "MEDIUM",
        createdBy: "PRO",
      },
      include: { client: { select: { id: true, name: true, company: true } } },
    });
    await emitEvent({ userId: userId!, type: "request.created", message: `Request created: ${request.title}`, entityType: "request", entityId: request.id, context: { clientId: client.id, projectId, title: request.title } });
    return res.status(201).json({ success: true, data: { request } });
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthRequest;
    const request = await prisma.clientRequest.findFirst({
      where: { id: req.params.id, userId },
      include: {
        client: { select: { id: true, name: true, company: true } },
        project: { select: { id: true, name: true } },
        comments: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!request) return res.status(404).json({ success: false, message: "Request not found" });
    return res.json({ success: true, data: { request } });
  }),
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthRequest;
    const input = updateRequestSchema.parse(req.body);
    const existing = await prisma.clientRequest.findFirst({ where: { id: req.params.id, userId } });
    if (!existing) return res.status(404).json({ success: false, message: "Request not found" });
    const request = await prisma.clientRequest.update({
      where: { id: existing.id },
      data: {
        ...(input.title !== undefined ? { title: input.title.trim() } : {}),
        ...(input.description !== undefined ? { description: (clean(input.description) as string | undefined)?.trim() ?? null } : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.projectId !== undefined ? { projectId: input.projectId ?? null } : {}),
      },
    });
    return res.json({ success: true, data: { request } });
  }),
);

// POST /api/requests/:id/convert — Request → Task (the core collaboration flow)
router.post(
  "/:id/convert",
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthRequest;
    const existing = await prisma.clientRequest.findFirst({ where: { id: req.params.id, userId } });
    if (!existing) return res.status(404).json({ success: false, message: "Request not found" });
    if (existing.status === "CONVERTED" && existing.taskId) {
      const task = await prisma.task.findFirst({ where: { id: existing.taskId, userId } });
      if (task) return res.json({ success: true, data: { task, request: existing } });
    }
    const task = await prisma.task.create({
      data: {
        userId: userId!,
        title: existing.title,
        description: existing.description,
        priority: existing.priority,
        projectId: existing.projectId,
        clientId: existing.clientId,
      },
    });
    const request = await prisma.clientRequest.update({
      where: { id: existing.id },
      data: { status: "CONVERTED", taskId: task.id },
    });
    await emitEvent({ userId: userId!, type: "request.converted", message: `Request converted to task: ${existing.title}`, entityType: "task", entityId: task.id, context: { clientId: existing.clientId, projectId: existing.projectId ?? undefined } });
    return res.status(201).json({ success: true, data: { task, request } });
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthRequest;
    const existing = await prisma.clientRequest.findFirst({ where: { id: req.params.id, userId } });
    if (!existing) return res.status(404).json({ success: false, message: "Request not found" });
    await prisma.clientRequest.delete({ where: { id: existing.id } });
    return res.json({ success: true, message: "Request deleted" });
  }),
);

export default router;
