import { Router, type RequestHandler } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth, type AuthRequest, requirePermission } from "../middleware/auth.js";
import { createCommentSchema } from "../schemas/comment.js";

const router = Router();
router.use(requireAuth);

const commentsRead: RequestHandler = requirePermission("comments:read");
const commentsWrite: RequestHandler = requirePermission("comments:write");
const commentsDelete: RequestHandler = requirePermission("comments:delete");

function orgWhere(req: AuthRequest, extra: Record<string, unknown> = {}) {
  const base: Record<string, unknown> = { organizationId: req.organizationId };
  return { ...base, ...extra };
}

async function assertScope(organizationId: string | undefined, input: { projectId?: string; taskId?: string; requestId?: string }) {
  if (!organizationId) throw Object.assign(new Error("No organization"), { statusCode: 400 });
  if (input.projectId) {
    const p = await prisma.project.findFirst({ where: { id: input.projectId, organizationId }, select: { id: true } });
    if (!p) throw Object.assign(new Error("Project not found"), { statusCode: 400 });
  }
  if (input.taskId) {
    const t = await prisma.task.findFirst({ where: { id: input.taskId, organizationId }, select: { id: true } });
    if (!t) throw Object.assign(new Error("Task not found"), { statusCode: 400 });
  }
  if (input.requestId) {
    const r = await prisma.clientRequest.findFirst({ where: { id: input.requestId, organizationId }, select: { id: true } });
    if (!r) throw Object.assign(new Error("Request not found"), { statusCode: 400 });
  }
}

router.get(
  "/",
  commentsRead,
  asyncHandler(async (req, res) => {
    const where = orgWhere(req);
    if (typeof req.query.projectId === "string" && req.query.projectId) where.projectId = req.query.projectId;
    if (typeof req.query.taskId === "string" && req.query.taskId) where.taskId = req.query.taskId;
    if (typeof req.query.requestId === "string" && req.query.requestId) where.requestId = req.query.requestId;
    const comments = await prisma.comment.findMany({ where: where as never, orderBy: { createdAt: "asc" } });
    return res.json({ success: true, data: { comments } });
  }),
);

router.post(
  "/",
  commentsWrite,
  asyncHandler(async (req, res) => {
    const { userId, organizationId } = req as AuthRequest;
    try {
      const input = createCommentSchema.parse(req.body);
      await assertScope(organizationId, input);
      const me = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
      const comment = await prisma.comment.create({
        data: {
          userId: userId!,
          organizationId,
          authorName: me?.name ?? "Professional",
          authorRole: "PRO",
          content: input.content.trim(),
          visibility: input.visibility ?? "INTERNAL",
          projectId: input.projectId,
          taskId: input.taskId,
          requestId: input.requestId,
        },
      });
      return res.status(201).json({ success: true, data: { comment } });
    } catch (err: unknown) {
      const e = err as Error & { statusCode?: number };
      if (e.statusCode) return res.status(e.statusCode).json({ success: false, message: e.message });
      throw err;
    }
  }),
);

router.delete(
  "/:id",
  commentsDelete,
  asyncHandler(async (req, res) => {
    const { organizationId } = req as AuthRequest;
    const existing = await prisma.comment.findFirst({ where: { id: req.params.id, organizationId } });
    if (!existing) return res.status(404).json({ success: false, message: "Comment not found" });
    await prisma.comment.delete({ where: { id: existing.id } });
    return res.json({ success: true, message: "Comment deleted" });
  }),
);

export default router