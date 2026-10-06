import { Router, type RequestHandler } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth, type AuthRequest, requirePermission } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

const orgRead: RequestHandler = requirePermission("users:read");
const orgWrite: RequestHandler = requirePermission("users:write");
const orgDelete: RequestHandler = requirePermission("users:delete");

const roleSchema = z.object({
  role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]),
});

// GET /api/org — current organization with memberships
router.get(
  "/",
  asyncHandler(async (req: AuthRequest, res) => {
    const organizationId = req.organizationId!;
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true, slug: true, isDemo: true, createdAt: true },
    });
    if (!organization) return res.status(404).json({ success: false, message: "Organization not found" });
    const memberships = await prisma.membership.findMany({
      where: { organizationId },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { id: true, email: true, name: true, createdAt: true } } },
    });
    const members = memberships.map((m) => ({
      id: m.id,
      role: m.role,
      createdAt: m.createdAt,
      user: m.user,
      isYou: m.userId === req.userId,
    }));
    return res.json({ success: true, data: { organization, members, myRole: memberships.find((m) => m.userId === req.userId)?.role ?? null } });
  }),
);

// PATCH /api/org/members/:id — change a member's role (OWNER/ADMIN only via users:write)
router.patch(
  "/members/:id",
  orgWrite,
  asyncHandler(async (req: AuthRequest, res) => {
    const organizationId = req.organizationId!;
    const input = roleSchema.parse(req.body);
    const membership = await prisma.membership.findFirst({ where: { id: req.params.id, organizationId } });
    if (!membership) return res.status(404).json({ success: false, message: "Member not found" });
    if (membership.userId === req.userId) {
      return res.status(400).json({ success: false, message: "You cannot change your own role" });
    }
    // Never leave the org without an OWNER
    if (membership.role === "OWNER" && input.role !== "OWNER") {
      const owners = await prisma.membership.count({ where: { organizationId, role: "OWNER" } });
      if (owners <= 1) {
        return res.status(400).json({ success: false, message: "The organization needs at least one owner" });
      }
    }
    const updated = await prisma.membership.update({
      where: { id: membership.id },
      data: { role: input.role },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
    return res.json({ success: true, data: { member: updated } });
  }),
);

// DELETE /api/org/members/:id — remove a member (OWNER/ADMIN via users:delete)
router.delete(
  "/members/:id",
  orgDelete,
  asyncHandler(async (req: AuthRequest, res) => {
    const organizationId = req.organizationId!;
    const membership = await prisma.membership.findFirst({ where: { id: req.params.id, organizationId } });
    if (!membership) return res.status(404).json({ success: false, message: "Member not found" });
    if (membership.userId === req.userId) {
      return res.status(400).json({ success: false, message: "You cannot remove yourself" });
    }
    if (membership.role === "OWNER") {
      const owners = await prisma.membership.count({ where: { organizationId, role: "OWNER" } });
      if (owners <= 1) {
        return res.status(400).json({ success: false, message: "The organization needs at least one owner" });
      }
    }
    await prisma.membership.delete({ where: { id: membership.id } });
    return res.json({ success: true, message: "Member removed" });
  }),
);

export default router;
