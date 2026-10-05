import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import crypto from "crypto";

const router = Router();

// POST /api/demo/sandbox — create ephemeral sandbox for visitor (no auth required)
router.post(
  "/sandbox",
  asyncHandler(async (req, res) => {
    const visitorFingerprint = (req.headers["x-visitor-id"] as string) || 
      (req.headers["x-forwarded-for"] as string) || 
      req.ip || "anonymous";
    const visitorId = crypto.createHash("sha256").update(visitorFingerprint).digest("hex").slice(0, 32);

    // Check if sandbox already exists and is valid
    const existing = await prisma.demoSandbox.findUnique({
      where: { visitorId },
      include: { organization: true },
    });

    if (existing && existing.expiresAt > new Date()) {
      const org = existing.organization;
      const membership = await prisma.membership.findFirst({
        where: { organizationId: org.id, role: "OWNER" },
        include: { user: { select: { id: true, email: true, name: true } } },
      });

      await prisma.demoSandbox.update({
        where: { id: existing.id },
        data: { expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000) },
      });

      return res.json({
        success: true,
        data: {
          sandboxId: existing.id,
          organization: { id: org.id, name: org.name, slug: org.slug },
          owner: membership?.user,
          token: crypto.randomBytes(32).toString("hex"),
          expiresAt: existing.expiresAt,
        },
      });
    }

    // Fetch template data separately (avoid Prisma include typing issues)
    const templateOrg = await prisma.organization.findFirst({ where: { slug: "demo-org" } });
    if (!templateOrg) {
      return res.status(500).json({ success: false, message: "Demo template not found. Run seed first." });
    }

    const [templateClients, templateProjects, templateTasks, templateNotes, templateActivities,
           templateRequests, templateComments, templateNotifications, templateAutomations, templateMemberships] = 
      await Promise.all([
        prisma.client.findMany({ where: { organizationId: templateOrg.id } }),
        prisma.project.findMany({ where: { organizationId: templateOrg.id } }),
        prisma.task.findMany({ where: { organizationId: templateOrg.id } }),
        prisma.note.findMany({ where: { organizationId: templateOrg.id } }),
        prisma.activity.findMany({ where: { organizationId: templateOrg.id } }),
        prisma.clientRequest.findMany({ where: { organizationId: templateOrg.id } }),
        prisma.comment.findMany({ where: { organizationId: templateOrg.id } }),
        prisma.notification.findMany({ where: { organizationId: templateOrg.id } }),
        prisma.automationRule.findMany({ where: { organizationId: templateOrg.id } }),
        prisma.membership.findMany({ where: { organizationId: templateOrg.id }, include: { user: { select: { id: true, email: true, name: true } } } }),
      ]);

    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

    // Create new organization as copy
    const sandboxOrg = await prisma.organization.create({
      data: {
        name: `Demo Sandbox ${crypto.randomBytes(4).toString("hex")}`,
        slug: `sandbox-${crypto.randomBytes(8).toString("hex")}`,
        isDemo: true,
        sandboxes: { create: { visitorId: "temp", expiresAt } }, // placeholder, will update after
      },
    });

    // Create sandbox record
    const sandbox = await prisma.demoSandbox.create({
      data: {
        organizationId: sandboxOrg.id,
        visitorId,
        expiresAt,
      },
    });

    // Update the sandbox record in the org (remove the placeholder)
    await prisma.organization.update({
      where: { id: sandboxOrg.id },
      data: { sandboxes: { deleteMany: {} } },
    });

    // Create clients
    const createdClients = await prisma.client.createMany({
      data: templateClients.map((c) => ({
        organizationId: sandboxOrg.id,
        userId: c.userId,
        name: c.name,
        company: c.company,
        email: c.email,
        phone: c.phone,
        notes: c.notes,
        status: c.status,
        portalEnabled: c.portalEnabled,
        portalToken: c.portalToken ? `sandbox-${crypto.randomBytes(8).toString("hex")}` : null,
      })),
    });

    // Map old client IDs to new ones
    const newClients = await prisma.client.findMany({ where: { organizationId: sandboxOrg.id } });
    const clientIdMap = new Map<string, string>();
    templateClients.forEach((oldClient, index) => {
      if (newClients[index]) clientIdMap.set(oldClient.id, newClients[index].id);
    });

    // Create projects with mapped clientIds
    const projectsData = templateProjects.map((p) => ({
      organizationId: sandboxOrg.id,
      userId: p.userId,
      clientId: clientIdMap.get(p.clientId) ?? "",
      name: p.name,
      description: p.description,
      status: p.status,
      priority: p.priority,
      startDate: p.startDate,
      dueDate: p.dueDate,
      isShared: p.isShared,
    }));
    await prisma.project.createMany({ data: projectsData });

    const newProjects = await prisma.project.findMany({ where: { organizationId: sandboxOrg.id } });
    const projectIdMap = new Map<string, string>();
    templateProjects.forEach((oldProject, index) => {
      if (newProjects[index]) projectIdMap.set(oldProject.id, newProjects[index].id);
    });

    // Create tasks
    const tasksData = templateTasks.map((t) => ({
      organizationId: sandboxOrg.id,
      userId: t.userId,
      projectId: t.projectId ? projectIdMap.get(t.projectId) : null,
      clientId: t.clientId ? clientIdMap.get(t.clientId) : null,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      isShared: t.isShared,
    }));
    await prisma.task.createMany({ data: tasksData });

    // Create notes
    const notesData = templateNotes.map((n) => ({
      organizationId: sandboxOrg.id,
      userId: n.userId,
      clientId: n.clientId ? clientIdMap.get(n.clientId) : null,
      projectId: n.projectId ? projectIdMap.get(n.projectId) : null,
      title: n.title,
      content: n.content,
      visibility: n.visibility,
    }));
    await prisma.note.createMany({ data: notesData });

    // Create activities
    const activitiesData = templateActivities.map((a) => ({
      organizationId: sandboxOrg.id,
      userId: a.userId,
      type: a.type,
      message: a.message,
      entityType: a.entityType,
      entityId: a.entityId,
    }));
    await prisma.activity.createMany({ data: activitiesData });

    // Create clientRequests
    const requestsData = templateRequests.map((r) => ({
      organizationId: sandboxOrg.id,
      userId: r.userId,
      clientId: clientIdMap.get(r.clientId) ?? "",
      projectId: r.projectId ? projectIdMap.get(r.projectId) : null,
      title: r.title,
      description: r.description,
      priority: r.priority,
      status: r.status,
      createdBy: r.createdBy,
      taskId: r.taskId,
    }));
    await prisma.clientRequest.createMany({ data: requestsData });

    // Create comments
    const commentsData = templateComments.map((c) => ({
      organizationId: sandboxOrg.id,
      userId: c.userId,
      projectId: c.projectId ? projectIdMap.get(c.projectId) : null,
      taskId: c.taskId ? projectIdMap.get(c.taskId) : null, // rough mapping
      requestId: c.requestId,
      authorName: c.authorName,
      authorRole: c.authorRole,
      visibility: c.visibility,
      content: c.content,
    }));
    await prisma.comment.createMany({ data: commentsData });

    // Create notifications
    const notificationsData = templateNotifications.map((n) => ({
      organizationId: sandboxOrg.id,
      userId: n.userId,
      type: n.type,
      message: n.message,
      entityType: n.entityType,
      entityId: n.entityId,
      readAt: n.readAt,
    }));
    await prisma.notification.createMany({ data: notificationsData });

    // Create automations
    const automationsData = templateAutomations.map((a) => ({
      organizationId: sandboxOrg.id,
      userId: a.userId,
      name: a.name,
      trigger: a.trigger,
      action: a.action,
      config: a.config,
      enabled: a.enabled,
      lastRunAt: a.lastRunAt,
    }));
    await prisma.automationRule.createMany({ data: automationsData });

    // Create memberships
    const membershipsData = templateMemberships.map((m) => ({
      organizationId: sandboxOrg.id,
      userId: m.userId,
      role: m.role,
    }));
    await prisma.membership.createMany({ data: membershipsData });

    // Update sandbox with correct organizationId
    await prisma.demoSandbox.update({
      where: { id: sandbox.id },
      data: { organizationId: sandboxOrg.id },
    });

    // Find owner
    const ownerMembership = await prisma.membership.findFirst({
      where: { organizationId: sandboxOrg.id, role: "OWNER" },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    const token = crypto.randomBytes(32).toString("hex");

    return res.status(201).json({
      success: true,
      data: {
        sandboxId: sandbox.id,
        organization: { id: sandboxOrg.id, name: sandboxOrg.name, slug: sandboxOrg.slug },
        owner: ownerMembership?.user,
        token,
        expiresAt,
      },
    });
  }),
);

// GET /api/demo/sandbox/status — check sandbox status
router.get(
  "/sandbox/status",
  asyncHandler(async (req, res) => {
    const visitorFingerprint = (req.headers["x-visitor-id"] as string) || 
      (req.headers["x-forwarded-for"] as string) || 
      req.ip || "anonymous";
    const visitorId = crypto.createHash("sha256").update(visitorFingerprint).digest("hex").slice(0, 32);

    const existing = await prisma.demoSandbox.findUnique({
      where: { visitorId },
      include: { organization: true },
    });

    if (!existing) {
      return res.json({ success: true, data: { exists: false } });
    }

    if (existing.expiresAt <= new Date()) {
      await prisma.demoSandbox.delete({ where: { id: existing.id } });
      return res.json({ success: true, data: { exists: false, expired: true } });
    }

    return res.json({
      success: true,
      data: {
        exists: true,
        sandboxId: existing.id,
        organization: { id: existing.organization.id, name: existing.organization.name, slug: existing.organization.slug },
        expiresAt: existing.expiresAt,
      },
    });
  }),
);

// Cleanup endpoint (called by cron)
router.delete(
  "/sandbox/cleanup",
  asyncHandler(async (req, res) => {
    const deleted = await prisma.demoSandbox.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    const demoOrgs = await prisma.organization.deleteMany({
      where: { isDemo: true, slug: { startsWith: "sandbox-" } },
    });
    return res.json({ success: true, data: { deletedSandboxes: deleted.count, deletedOrgs: demoOrgs.count } });
  }),
);

export default router