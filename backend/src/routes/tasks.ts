import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { createTaskSchema, updateTaskSchema } from "../schemas/task.js";
import { recordActivity } from "../utils/activity.js";

const router = Router();
router.use(requireAuth);

const toDate = (v: unknown): Date | undefined => {
  if (typeof v !== "string" || !v) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
};
const clean = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

async function resolveScope(userId: string, projectId?: string, clientId?: string) {
  let project: { id: string; clientId: string } | null = null;
  if (projectId) {
    project = await prisma.project.findFirst({ where: { id: projectId, userId }, select: { id: true, clientId: true } });
    if (!project) throw Object.assign(new Error("Project not found"), { statusCode: 400 });
  }
  let client: { id: string } | null = null;
  if (clientId) {
    client = await prisma.client.findFirst({ where: { id: clientId, userId }, select: { id: true } });
    if (!client) throw Object.assign(new Error("Client not found"), { statusCode: 400 });
  }
  const finalClientId = client?.id ?? project?.clientId;
  return { projectId: project?.id, clientId: finalClientId };
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthRequest;
    const status = typeof req.query.status === "string" ? req.query.status : "";
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const where: Record<string, unknown> = { userId };
    if (status && ["TODO", "IN_PROGRESS", "DONE"].includes(status)) where.status = status;
    if (search) where.title = { contains: search, mode: "insensitive" };
    if (typeof req.query.projectId === "string" && req.query.projectId) where.projectId = req.query.projectId;
    if (typeof req.query.clientId === "string" && req.query.clientId) where.clientId = req.query.clientId;
    const tasks = await prisma.task.findMany({
      where: where as never,
      orderBy: { updatedAt: "desc" },
      include: {
        project: { select: { id: true, name: true } },
        client: { select: { id: true, name: true, company: true } },
      },
    });
    return res.json({ success: true, data: { tasks } });
  }),
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthRequest;
    try {
      const input = createTaskSchema.parse(req.body);
      const scope = await resolveScope(userId!, input.projectId, input.clientId);
      const task = await prisma.task.create({
        data: {
          userId: userId!,
          title: input.title.trim(),
          description: (clean(input.description) as string | undefined)?.trim(),
          status: input.status ?? "TODO",
          priority: input.priority ?? "MEDIUM",
          dueDate: toDate(input.dueDate),
          projectId: scope.projectId,
          clientId: scope.clientId,
        },
        include: {
          project: { select: { id: true, name: true } },
          client: { select: { id: true, name: true, company: true } },
        },
      });
      await recordActivity(userId!, "task.created", `Task created: ${task.title}`, "task", task.id);
      return res.status(201).json({ success: true, data: { task } });
    } catch (err: unknown) {
      const e = err as Error & { statusCode?: number };
      if (e.statusCode) return res.status(e.statusCode).json({ success: false, message: e.message });
      throw err;
    }
  }),
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthRequest;
    const input = updateTaskSchema.parse(req.body);
    const existing = await prisma.task.findFirst({ where: { id: req.params.id, userId } });
    if (!existing) return res.status(404).json({ success: false, message: "Task not found" });
    const wasDone = existing.status === "DONE";
    const scope =
      input.projectId !== undefined || input.clientId !== undefined
        ? await resolveScope(userId!, input.projectId ?? existing.projectId ?? undefined, input.clientId ?? existing.clientId ?? undefined).catch((err: unknown) => {
            const e = err as Error & { statusCode?: number };
            res.status(e.statusCode ?? 400).json({ success: false, message: e.message });
            return null;
          })
        : null;
    if ((input.projectId !== undefined || input.clientId !== undefined) && !scope) return;
    const task = await prisma.task.update({
      where: { id: existing.id },
      data: {
        ...(input.title !== undefined ? { title: input.title.trim() } : {}),
        ...(input.description !== undefined ? { description: (clean(input.description) as string | undefined)?.trim() ?? null } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
        ...(input.dueDate !== undefined ? { dueDate: toDate(input.dueDate) } : {}),
        ...(scope ? { projectId: scope.projectId ?? null, clientId: scope.clientId ?? null } : {}),
      },
      include: {
        project: { select: { id: true, name: true } },
        client: { select: { id: true, name: true, company: true } },
      },
    });
    if (input.status === "DONE" && !wasDone) await recordActivity(userId!, "task.completed", `Task completed: ${task.title}`, "task", task.id);
    else if (input.status !== undefined) await recordActivity(userId!, "task.updated", `Task updated: ${task.title}`, "task", task.id);
    return res.json({ success: true, data: { task } });
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthRequest;
    const existing = await prisma.task.findFirst({ where: { id: req.params.id, userId } });
    if (!existing) return res.status(404).json({ success: false, message: "Task not found" });
    await prisma.task.delete({ where: { id: existing.id } });
    await recordActivity(userId!, "task.deleted", `Task deleted: ${existing.title}`);
    return res.json({ success: true, message: "Task deleted" });
  }),
);

export default router;
