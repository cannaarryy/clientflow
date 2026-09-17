import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { createNoteSchema, updateNoteSchema } from "../schemas/note.js";
import { recordActivity } from "../utils/activity.js";

const router = Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthRequest;
    const where: Record<string, unknown> = { userId };
    if (typeof req.query.clientId === "string" && req.query.clientId) where.clientId = req.query.clientId;
    if (typeof req.query.projectId === "string" && req.query.projectId) where.projectId = req.query.projectId;
    const notes = await prisma.note.findMany({
      where: where as never,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, name: true, company: true } },
        project: { select: { id: true, name: true } },
      },
    });
    return res.json({ success: true, data: { notes } });
  }),
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthRequest;
    const input = createNoteSchema.parse(req.body);
    if (input.clientId) {
      const c = await prisma.client.findFirst({ where: { id: input.clientId, userId } });
      if (!c) return res.status(400).json({ success: false, message: "Client not found" });
    }
    if (input.projectId) {
      const p = await prisma.project.findFirst({ where: { id: input.projectId, userId } });
      if (!p) return res.status(400).json({ success: false, message: "Project not found" });
    }
    const note = await prisma.note.create({
      data: {
        userId: userId!,
        title: input.title?.trim() || null,
        content: input.content.trim(),
        clientId: input.clientId,
        projectId: input.projectId,
        visibility: input.visibility ?? "INTERNAL",
      },
      include: {
        client: { select: { id: true, name: true, company: true } },
        project: { select: { id: true, name: true } },
      },
    });
    await recordActivity(userId!, "note.added", `Note added: ${note.title || "Untitled note"}`, "note", note.id);
    return res.status(201).json({ success: true, data: { note } });
  }),
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthRequest;
    const input = updateNoteSchema.parse(req.body);
    const existing = await prisma.note.findFirst({ where: { id: req.params.id, userId } });
    if (!existing) return res.status(404).json({ success: false, message: "Note not found" });
    const note = await prisma.note.update({
      where: { id: existing.id },
      data: {
        ...(input.title !== undefined ? { title: input.title?.trim() || null } : {}),
        ...(input.content !== undefined ? { content: input.content.trim() } : {}),
        ...(input.visibility !== undefined ? { visibility: input.visibility } : {}),
      },
    });
    return res.json({ success: true, data: { note } });
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthRequest;
    const existing = await prisma.note.findFirst({ where: { id: req.params.id, userId } });
    if (!existing) return res.status(404).json({ success: false, message: "Note not found" });
    await prisma.note.delete({ where: { id: existing.id } });
    return res.json({ success: true, message: "Note deleted" });
  }),
);

export default router;
