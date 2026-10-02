import { Router, type RequestHandler } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth, type AuthRequest, requirePermission } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

const searchRead: RequestHandler = requirePermission("clients:read");

function orgWhere(req: AuthRequest, extra: Record<string, unknown> = {}) {
  const base: Record<string, unknown> = { organizationId: req.organizationId };
  return { ...base, ...extra };
}

// GET /api/search?q=... — global search across clients, projects, tasks, notes, requests
router.get(
  "/",
  searchRead,
  asyncHandler(async (req: AuthRequest, res) => {
    const q = (typeof req.query.q === "string" ? req.query.q : "").trim();
    if (!q || q.length < 2) return res.json({ success: true, data: { clients: [], projects: [], tasks: [], notes: [], requests: [] } });
    const [clients, projects, tasks, notes, requests] = await Promise.all([
      prisma.client.findMany({
        where: {
          organizationId: req.organizationId,
          OR: [
            { name: { contains: q } },
            { company: { contains: q } },
            { email: { contains: q } },
          ],
        },
        take: 6,
      }),
      prisma.project.findMany({ where: orgWhere(req, { name: { contains: q } }), take: 6, include: { client: { select: { id: true, name: true } } } }),
      prisma.task.findMany({ where: orgWhere(req, { title: { contains: q } }), take: 6, include: { project: { select: { id: true, name: true } } } }),
      prisma.note.findMany({
        where: orgWhere(req, { OR: [{ title: { contains: q } }, { content: { contains: q } }] }),
        take: 6,
        include: { client: { select: { id: true, name: true } }, project: { select: { id: true, name: true } } },
      }),
      prisma.clientRequest.findMany({
        where: orgWhere(req, { OR: [{ title: { contains: q } }, { description: { contains: q } }] }),
        take: 6,
        include: { client: { select: { id: true, name: true } } },
      }),
    ]);
    return res.json({ success: true, data: { clients, projects, tasks, notes, requests } });
  }),
);

export default router