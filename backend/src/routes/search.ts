import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// GET /api/search?q=... — global search across clients, projects, tasks, notes, requests
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthRequest;
    const q = (typeof req.query.q === "string" ? req.query.q : "").trim();
    if (!q || q.length < 2) return res.json({ success: true, data: { clients: [], projects: [], tasks: [], notes: [], requests: [] } });
    const [clients, projects, tasks, notes, requests] = await Promise.all([
      prisma.client.findMany({
        where: {
          userId,
          OR: [
            { name: { contains: q } },
            { company: { contains: q } },
            { email: { contains: q } },
          ],
        },
        take: 6,
      }),
      prisma.project.findMany({ where: { userId, name: { contains: q } }, take: 6, include: { client: { select: { id: true, name: true } } } }),
      prisma.task.findMany({ where: { userId, title: { contains: q } }, take: 6, include: { project: { select: { id: true, name: true } } } }),
      prisma.note.findMany({
        where: { userId, OR: [{ title: { contains: q } }, { content: { contains: q } }] },
        take: 6,
        include: { client: { select: { id: true, name: true } }, project: { select: { id: true, name: true } } },
      }),
      prisma.clientRequest.findMany({
        where: { userId, OR: [{ title: { contains: q } }, { description: { contains: q } }] },
        take: 6,
        include: { client: { select: { id: true, name: true } } },
      }),
    ]);
    return res.json({ success: true, data: { clients, projects, tasks, notes, requests } });
  }),
);

export default router;
