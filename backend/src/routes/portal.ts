import { Router } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { portalAuth, type PortalRequest } from "../middleware/portalAuth.js";
import { priority } from "../schemas/project.js";
import { emitEvent } from "../utils/events.js";
import { computeHealth } from "../utils/health.js";

/**
 * Client Portal API (public, token-scoped).
 * Every handler is constrained by req.portal = { userId (owner), clientId }.
 * Only SHARED content is ever returned: shared projects, shared tasks of
 * shared projects, SHARED notes/comments, portal-visible requests.
 * Internal notes, private tasks and other clients are unreachable by design.
 */
const router = Router();
const portalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false });
router.use(portalLimiter);
router.use(portalAuth);

const portalRequestSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(8000).optional().or(z.literal("")),
  projectId: z.string().min(1).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  priority: priority.optional().default("MEDIUM"),
});

const portalCommentSchema = z.object({
  content: z.string().min(1, "Content is required").max(5000),
  projectId: z.string().min(1).optional(),
  requestId: z.string().min(1).optional(),
}).refine((v) => v.projectId || v.requestId, { message: "Attach the comment to a project or request" });

// GET /api/portal/:token — whole portal context in one call
router.get(
  "/:token",
  asyncHandler(async (req, res) => {
    const { userId, clientId } = (req as PortalRequest).portal!;
    const client = await prisma.client.findFirst({
      where: { id: clientId, userId },
      select: { id: true, name: true, company: true, email: true, status: true },
    });
    if (!client) return res.status(404).json({ success: false, message: "Not found" });

    const owner = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    const projects = await prisma.project.findMany({
      where: { userId, clientId, isShared: true },
      orderBy: { updatedAt: "desc" },
      include: { tasks: { where: { isShared: true }, orderBy: { createdAt: "asc" } } },
    });
    const sharedProjectIds = projects.map((p: { id: string }) => p.id);
    const [notes, comments, requests, activity] = await Promise.all([
      prisma.note.findMany({
        where: { userId, clientId, visibility: "SHARED", OR: [{ projectId: null }, { projectId: { in: sharedProjectIds } }] },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.comment.findMany({
        where: {
          userId,
          visibility: "SHARED",
          OR: [{ projectId: { in: sharedProjectIds } }, { requestId: { not: null } }],
        },
        orderBy: { createdAt: "asc" },
        take: 100,
      }),
      prisma.clientRequest.findMany({
        where: { userId, clientId },
        orderBy: { createdAt: "desc" },
        include: { project: { select: { id: true, name: true } } },
      }),
      prisma.activity.findMany({
        where: { 
          userId, 
          type: { in: ["project.created", "project.updated", "task.completed", "request.converted", "note.added"] },
          OR: [
            { entityType: "client", entityId: clientId },
            { entityType: "project", entityId: { in: sharedProjectIds } },
            { entityType: "task", entityId: { in: sharedProjectIds } },
            { entityType: "request", entityId: { in: sharedProjectIds } },
          ]
        },
        orderBy: { createdAt: "desc" },
        take: 15,
      }),
    ]);

    const projectsWithHealth = projects.map((p: { id: string; status: string; dueDate?: Date | null; tasks: Array<{ status: string; priority?: string | null; dueDate?: Date | string | null }> }) => ({
      ...p,
      health: computeHealth({ status: p.status, dueDate: p.dueDate, tasks: p.tasks }),
    }));

    // Comments on requests of this client only (the query above may include
    // shared request comments workspace-wide — scope them down).
    const requestIds = new Set(requests.map((r: { id: string }) => r.id));
    const scopedComments = comments.filter((c: { requestId?: string | null }) => (c.requestId ? requestIds.has(c.requestId) : true));

    return res.json({
      success: true,
      data: {
        client,
        professional: { name: owner?.name ?? "Your professional" },
        projects: projectsWithHealth,
        notes,
        comments: scopedComments,
        requests,
        activity,
      },
    });
  }),
);

// POST /api/portal/:token/requests — client creates a request
router.post(
  "/:token/requests",
  asyncHandler(async (req, res) => {
    const { userId, clientId, clientName } = (req as PortalRequest).portal!;
    const input = portalRequestSchema.parse(req.body);
    let projectId: string | undefined;
    if (input.projectId) {
      const p = await prisma.project.findFirst({ where: { id: input.projectId, userId, clientId, isShared: true }, select: { id: true } });
      if (!p) return res.status(400).json({ success: false, message: "Project not found" });
      projectId = p.id;
    }
    const request = await prisma.clientRequest.create({
      data: {
        userId,
        clientId,
        projectId,
        title: input.title.trim(),
        description: typeof input.description === "string" && input.description.trim() ? input.description.trim() : undefined,
        priority: input.priority ?? "MEDIUM",
        createdBy: "CLIENT",
      },
    });
    await emitEvent({
      userId,
      type: "request.created",
      message: `New request from ${clientName}: ${request.title}`,
      entityType: "request",
      entityId: request.id,
      context: { clientId, projectId, title: request.title },
    });
    return res.status(201).json({ success: true, data: { request } });
  }),
);

// POST /api/portal/:token/comments — client comments on shared project/request
router.post(
  "/:token/comments",
  asyncHandler(async (req, res) => {
    const { userId, clientId, clientName } = (req as PortalRequest).portal!;
    const input = portalCommentSchema.parse(req.body);
    if (input.projectId) {
      const p = await prisma.project.findFirst({ where: { id: input.projectId, userId, clientId, isShared: true }, select: { id: true } });
      if (!p) return res.status(400).json({ success: false, message: "Project not found" });
    }
    if (input.requestId) {
      const r = await prisma.clientRequest.findFirst({ where: { id: input.requestId, userId, clientId }, select: { id: true } });
      if (!r) return res.status(400).json({ success: false, message: "Request not found" });
    }
    const comment = await prisma.comment.create({
      data: {
        userId,
        authorName: clientName,
        authorRole: "CLIENT",
        content: input.content.trim(),
        visibility: "SHARED",
        projectId: input.projectId,
        requestId: input.requestId,
      },
    });
    await emitEvent({
      userId,
      type: "comment.client",
      message: `${clientName} commented: ${input.content.trim().slice(0, 80)}`,
      entityType: input.projectId ? "project" : "request",
      entityId: input.projectId ?? input.requestId,
    });
    return res.status(201).json({ success: true, data: { comment } });
  }),
);

export default router;
