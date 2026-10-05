const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

async function test() {
  try {
    console.log('Testing sandbox creation...');
    
    const templateOrg = await prisma.organization.findFirst({ where: { slug: 'demo-org' } });
    console.log('templateOrg:', templateOrg ? templateOrg.id : 'NOT FOUND');
    
    if (!templateOrg) {
      console.log('Template org not found');
      return;
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
    console.log('Template data loaded:', {
      clients: templateClients.length,
      projects: templateProjects.length,
      tasks: templateTasks.length,
      notes: templateNotes.length,
      activities: templateActivities.length,
      requests: templateRequests.length,
      comments: templateComments.length,
      notifications: templateNotifications.length,
      automations: templateAutomations.length,
      memberships: templateMemberships.length,
    });

    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

    const sandboxOrg = await prisma.organization.create({
      data: {
        name: `Demo Sandbox ${crypto.randomBytes(4).toString("hex")}`,
        slug: `sandbox-${crypto.randomBytes(8).toString("hex")}`,
        isDemo: true,
      },
    });
    console.log('sandboxOrg created:', sandboxOrg.id);

    const sandbox = await prisma.demoSandbox.create({
      data: {
        organizationId: sandboxOrg.id,
        visitorId: 'test-visitor-' + Date.now(),
        expiresAt,
      },
    });
    console.log('sandbox created:', sandbox.id);

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
    console.log('Created clients:', createdClients.count);

    const newClients = await prisma.client.findMany({ where: { organizationId: sandboxOrg.id } });
    const clientIdMap = new Map();
    templateClients.forEach((oldClient, index) => {
      if (newClients[index]) clientIdMap.set(oldClient.id, newClients[index].id);
    });

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
    console.log('Created projects');

    const newProjects = await prisma.project.findMany({ where: { organizationId: sandboxOrg.id } });
    const projectIdMap = new Map();
    templateProjects.forEach((oldProject, index) => {
      if (newProjects[index]) projectIdMap.set(oldProject.id, newProjects[index].id);
    });

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
    console.log('Created tasks');

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
    console.log('Created notes');

    const activitiesData = templateActivities.map((a) => ({
      organizationId: sandboxOrg.id,
      userId: a.userId,
      type: a.type,
      message: a.message,
      entityType: a.entityType,
      entityId: a.entityId,
    }));
    await prisma.activity.createMany({ data: activitiesData });
    console.log('Created activities');

    const requestsData = templateRequests.map((r) => ({
      organizationId: sandboxOrg.id,
      userId: r.userId,
      clientId: clientIdMap.get(r.clientId) ?? "",
      projectId: r.projectId ? clientIdMap.get(r.projectId) : null,
      title: r.title,
      description: r.description,
      priority: r.priority,
      status: r.status,
      createdBy: r.createdBy,
      taskId: r.taskId,
    }));
    await prisma.clientRequest.createMany({ data: requestsData });
    console.log('Created requests');

    const commentsData = templateComments.map((c) => ({
      organizationId: sandboxOrg.id,
      userId: c.userId,
      projectId: c.projectId ? clientIdMap.get(c.projectId) : null,
      taskId: c.taskId ? clientIdMap.get(c.taskId) : null,
      requestId: c.requestId,
      authorName: c.authorName,
      authorRole: c.authorRole,
      visibility: c.visibility,
      content: c.content,
    }));
    await prisma.comment.createMany({ data: commentsData });
    console.log('Created comments');

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
    console.log('Created notifications');

    const automationsData = templateAutomations.map((a) => ({
      organizationId: sandboxOrg.id,
      userId: a.userId,
      name: a.name,
      trigger: a.trigger,
      action: a.action,
      config: JSON.stringify(a.config ?? {}),
      enabled: a.enabled,
      lastRunAt: a.lastRunAt,
    }));
    await prisma.automationRule.createMany({ data: automationsData });
    console.log('Created automations');

    const membershipsData = templateMemberships.map((m) => ({
      organizationId: sandboxOrg.id,
      userId: m.userId,
      role: m.role,
    }));
    await prisma.membership.createMany({ data: membershipsData });
    console.log('Created memberships');

    const ownerMembership = await prisma.membership.findFirst({
      where: { organizationId: sandboxOrg.id, role: 'OWNER' },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    console.log('Sandbox created successfully!');
    console.log('Sandbox org:', sandboxOrg.id);
    console.log('Owner:', ownerMembership?.user);
  } catch (e) {
    console.error('Sandbox creation failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

test().catch(console.error);