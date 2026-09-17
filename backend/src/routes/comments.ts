import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { createCommentSchema } from "../schemas/comment.js";

const router = Router();
router.use(requireAuth);

async function assertScope(userId: string, input: { projectId?: string; taskId?: string; requestId?: string }) {
  if (input.projectId) {
    const p = await prisma.project.findFirst({ where: { id: input.projectId, userId }, select: { id: true } });
    if (!p) throw Object.assign(new Error("Project not found"), { statusCode: 400 });
  }
  if (input.taskId) {
    const t = await prisma.task.findFirst({ where: { id: input.taskId, userId }, select: { id: true } });
    if (!t) throw Object.assign(new Error("Task not found"), { statusCode: 400 });
  }
  if (input.requestId) {
    const r = await prisma.clientRequest.findFirst({ where: { id: input.requestId, userId }, select: { id: true } });
    if (!r) throw Object.assign(new Error("Request not found"), { statusCode: 400 });
  }
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthRequest;
    const where: Record<string, unknown> = { userId };
    if (typeof req.query.projectId === "string" && req.query.projectId) where.projectId = req.query.projectId;
    if (typeof req.query.taskId === "string" && req.query.taskId) where.taskId = req.query.taskId;
    if (typeof req.query.requestId === "string" && req.query.requestId) where.requestId = req.query.requestId;
    const comments = await prisma.comment.findMany({ where: where as never, orderBy: { createdAt: "asc" } });
    return res.json({ success: true, data: { comments } });
  }),
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthRequest;
    try {
      const input = createCommentSchema.parse(req.body);
      await assertScope(userId!, input);
      const me = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
      const comment = await prisma.comment.create({
        data: {
          userId: userId!,
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
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthRequest;
    const existing = await prisma.comment.findFirst({ where: { id: req.params.id, userId } });
    if (!existing) return res.status(404).json({ success: false, message: "Comment not found" });
    await prisma.comment.delete({ where: { id: existing.id } });
    return res.json({ success: true, message: "Comment deleted" });
  }),
);

export default router;
