import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { createAutomationSchema, updateAutomationSchema } from "../schemas/automation.js";
import { runOverdueCheck, TRIGGERS, ACTIONS } from "../utils/automations.js";

const router = Router();
router.use(requireAuth);

router.get(
  "/meta",
  asyncHandler(async (_req, res) => {
    return res.json({ success: true, data: { triggers: TRIGGERS, actions: ACTIONS } });
  }),
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthRequest;
    const rules = await prisma.automationRule.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
    return res.json({ success: true, data: { rules: rules.map((r: { config: string }) => ({ ...r, config: safeParse(r.config) })) } });
  }),
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthRequest;
    const input = createAutomationSchema.parse(req.body);
    const rule = await prisma.automationRule.create({
      data: {
        userId: userId!,
        name: input.name.trim(),
        trigger: input.trigger,
        action: input.action,
        config: JSON.stringify(input.config ?? {}),
        enabled: input.enabled ?? true,
      },
    });
    return res.status(201).json({ success: true, data: { rule: { ...rule, config: safeParse(rule.config) } } });
  }),
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthRequest;
    const input = updateAutomationSchema.parse(req.body);
    const existing = await prisma.automationRule.findFirst({ where: { id: req.params.id, userId } });
    if (!existing) return res.status(404).json({ success: false, message: "Automation not found" });
    const rule = await prisma.automationRule.update({
      where: { id: existing.id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.trigger !== undefined ? { trigger: input.trigger } : {}),
        ...(input.action !== undefined ? { action: input.action } : {}),
        ...(input.config !== undefined ? { config: JSON.stringify(input.config) } : {}),
        ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
      },
    });
    return res.json({ success: true, data: { rule: { ...rule, config: safeParse(rule.config) } } });
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthRequest;
    const existing = await prisma.automationRule.findFirst({ where: { id: req.params.id, userId } });
    if (!existing) return res.status(404).json({ success: false, message: "Automation not found" });
    await prisma.automationRule.delete({ where: { id: existing.id } });
    return res.json({ success: true, message: "Automation deleted" });
  }),
);

// POST /api/automations/run-overdue — explicit overdue scan (dashboard calls this).
router.post(
  "/run-overdue",
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthRequest;
    const count = await runOverdueCheck(userId!);
    return res.json({ success: true, data: { checked: count } });
  }),
);

function safeParse(raw: string): Record<string, unknown> {
  try {
    const v = JSON.parse(raw) as unknown;
    return typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export default router;
