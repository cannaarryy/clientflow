import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { getProvider } from "../lib/intelligence.js";

const router = Router();
router.use(requireAuth);

// GET /api/intelligence/next-actions — rule-based suggestions from real data.
router.get(
  "/next-actions",
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthRequest;
    const actions = await getProvider().nextActions(userId!);
    return res.json({ success: true, data: { actions, provider: "local-heuristic" } });
  }),
);

// GET /api/intelligence/projects/:id/summary
router.get(
  "/projects/:id/summary",
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthRequest;
    const summary = await getProvider().projectSummary(userId!, req.params.id);
    if (!summary) return res.status(404).json({ success: false, message: "Project not found" });
    return res.json({ success: true, data: { summary, provider: "local-heuristic" } });
  }),
);

export default router;
