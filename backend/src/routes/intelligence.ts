import { Router, type RequestHandler } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth, type AuthRequest, requirePermission } from "../middleware/auth.js";
import { getProvider } from "../lib/intelligence.js";

const router = Router();
router.use(requireAuth);

const intelligenceRead: RequestHandler = requirePermission("projects:read");

// GET /api/intelligence/next-actions — rule-based suggestions from real data.
router.get(
  "/next-actions",
  intelligenceRead,
  asyncHandler(async (req, res) => {
    const actions = await getProvider().nextActions((req as AuthRequest).userId!);
    return res.json({ success: true, data: { actions, provider: "local-heuristic" } });
  }),
);

// GET /api/intelligence/projects/:id/summary
router.get(
  "/projects/:id/summary",
  intelligenceRead,
  asyncHandler(async (req, res) => {
    const summary = await getProvider().projectSummary((req as AuthRequest).userId!, req.params.id);
    if (!summary) return res.status(404).json({ success: false, message: "Project not found" });
    return res.json({ success: true, data: { summary, provider: "local-heuristic" } });
  }),
);

export default router