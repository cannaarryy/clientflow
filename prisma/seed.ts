import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Demo seed data — clearly marked as DEMO.
 * Run with: npm run db:seed (from backend/)
 *
 * Creates demo@clientflow.io / Demo1234! with:
 * 4 clients, 4 projects, ~12 tasks, notes + activity.
 */
async function main() {
  const email = "demo@clientflow.io";
  const passwordHash = await bcrypt.hash("Demo1234!", 10);

  // ── Organization & Membership ──────────────────────────
  const org = await prisma.organization.upsert({
    where: { slug: "demo-org" },
    update: {},
    create: {
      name: "Demo Organization",
      slug: "demo-org",
      isDemo: true,
    },
  });

  const user = await prisma.user.upsert({
    where: { email },
    update: { organizationId: org.id },
    create: { email, name: "Alex Rivera", passwordHash, organizationId: org.id },
  });

  await prisma.membership.upsert({
    where: { userId_organizationId: { userId: user.id, organizationId: org.id } },
    update: { role: "OWNER" },
    create: { userId: user.id, organizationId: org.id, role: "OWNER" },
  });

  // Clean previous demo data for idempotent seeds
  await prisma.activity.deleteMany({ where: { organizationId: org.id } });
  await prisma.notification.deleteMany({ where: { organizationId: org.id } });
  await prisma.automationRule.deleteMany({ where: { organizationId: org.id } });
  await prisma.comment.deleteMany({ where: { organizationId: org.id } });
  await prisma.clientRequest.deleteMany({ where: { organizationId: org.id } });
  await prisma.task.deleteMany({ where: { organizationId: org.id } });
  await prisma.note.deleteMany({ where: { organizationId: org.id } });
  await prisma.project.deleteMany({ where: { organizationId: org.id } });
  await prisma.client.deleteMany({ where: { organizationId: org.id } });

  const log = async (type: string, message: string, entityType?: string, entityId?: string) => {
    await prisma.activity.create({ data: { userId: user.id, organizationId: org.id, type, message, entityType, entityId } });
  };

  // ── Clients ──────────────────────────────────────────
  const nova = await prisma.client.create({
    data: {
      userId: user.id, organizationId: org.id, name: "Sofia Bennett", company: "Nova Studio",
      email: "sofia@novastudio.co", phone: "+1 415 555 0132",
      status: "ACTIVE", notes: "Brand + web client. Prefers async updates on Fridays.",
    },
  });
  await log("client.created", `Client created: ${nova.name} (Nova Studio)`, "client", nova.id);

  const lumen = await prisma.client.create({
    data: {
      userId: user.id, organizationId: org.id, name: "Marcus Chen", company: "Lumen Analytics",
      email: "m.chen@lumenanalytics.io", phone: "+1 212 555 0188",
      status: "ACTIVE", notes: "SaaS dashboard project. Wants weekly demos.",
    },
  });
  await log("client.created", `Client created: ${lumen.name} (Lumen Analytics)`, "client", lumen.id);

  const atlas = await prisma.client.create({
    data: {
      userId: user.id, organizationId: org.id, name: "Elena Petrova", company: "Atlas Legal",
      email: "elena@atlaslegal.com", phone: "+34 600 123 456",
      status: "LEAD", notes: "Discovery call done. Waiting for proposal approval.",
    },
  });
  await log("client.created", `Client created: ${atlas.name} (Atlas Legal)`, "client", atlas.id);

  const verde = await prisma.client.create({
    data: {
      userId: user.id, organizationId: org.id, name: "Diego Fuentes", company: "Verde Coffee Co.",
      email: "diego@verdecoffee.com", phone: "+52 55 1234 5678",
      status: "INACTIVE", notes: "One-off menu redesign. Paused until Q4.",
    },
  });
  await log("client.created", `Client created: ${verde.name} (Verde Coffee Co.)`, "client", verde.id);

  // ── Projects ─────────────────────────────────────────
  const p1 = await prisma.project.create({
    data: {
      userId: user.id, organizationId: org.id, clientId: nova.id, name: "Nova Studio — Website Redesign",
      description: "Full marketing site redesign: IA, UI kit, Webflow-ready handoff.",
      status: "ACTIVE", priority: "HIGH",
      startDate: new Date("2026-08-10"), dueDate: new Date("2026-10-15"),
    },
  });
  await log("project.created", `Project created: ${p1.name}`, "project", p1.id);

  const p2 = await prisma.project.create({
    data: {
      userId: user.id, organizationId: org.id, clientId: lumen.id, name: "Lumen — Analytics Dashboard",
      description: "Customer-facing analytics dashboard: charts, filters, exports.",
      status: "ACTIVE", priority: "HIGH",
      startDate: new Date("2026-08-25"), dueDate: new Date("2026-11-01"),
    },
  });
  await log("project.created", `Project created: ${p2.name}`, "project", p2.id);

  const p3 = await prisma.project.create({
    data: {
      userId: user.id, organizationId: org.id, clientId: atlas.id, name: "Atlas — Proposal & Discovery",
      description: "Scope the client portal: requirements, estimate, proposal doc.",
      status: "PLANNING", priority: "MEDIUM",
      startDate: new Date("2026-09-05"), dueDate: new Date("2026-09-30"),
    },
  });
  await log("project.created", `Project created: ${p3.name}`, "project", p3.id);

  const p4 = await prisma.project.create({
    data: {
      userId: user.id, organizationId: org.id, clientId: verde.id, name: "Verde — Menu Redesign",
      description: "Print + digital menu refresh. On hold until Q4.",
      status: "ON_HOLD", priority: "LOW",
      startDate: new Date("2026-06-01"), dueDate: new Date("2026-12-01"),
    },
  });
  await log("project.created", `Project created: ${p4.name}`, "project", p4.id);

  // ── Tasks ────────────────────────────────────────────
  const tasks: Array<{ title: string; projectId?: string; clientId: string; status: "TODO" | "IN_PROGRESS" | "DONE"; priority: "LOW" | "MEDIUM" | "HIGH"; dueInDays: number; description?: string }> = [
    { title: "Draft homepage wireframes", projectId: p1.id, clientId: nova.id, status: "DONE", priority: "HIGH", dueInDays: -6, description: "3 directions for hero + services." },
    { title: "Design UI kit (dark)", projectId: p1.id, clientId: nova.id, status: "IN_PROGRESS", priority: "HIGH", dueInDays: 3 },
    { title: "Copy review with Sofia", projectId: p1.id, clientId: nova.id, status: "TODO", priority: "MEDIUM", dueInDays: 6 },
    { title: "API contract for metrics", projectId: p2.id, clientId: lumen.id, status: "DONE", priority: "HIGH", dueInDays: -4 },
    { title: "Build chart components", projectId: p2.id, clientId: lumen.id, status: "IN_PROGRESS", priority: "HIGH", dueInDays: 4 },
    { title: "CSV export feature", projectId: p2.id, clientId: lumen.id, status: "TODO", priority: "MEDIUM", dueInDays: 9 },
    { title: "Write proposal doc", projectId: p3.id, clientId: atlas.id, status: "IN_PROGRESS", priority: "MEDIUM", dueInDays: 2 },
    { title: "Estimate portal phases", projectId: p3.id, clientId: atlas.id, status: "TODO", priority: "MEDIUM", dueInDays: 5 },
    { title: "Follow up on approval", projectId: undefined, clientId: atlas.id, status: "TODO", priority: "HIGH", dueInDays: 1, description: "Ping Elena if no reply by Thursday." },
    { title: "Archive Verde assets", projectId: p4.id, clientId: verde.id, status: "DONE", priority: "LOW", dueInDays: -20 },
    { title: "Send Friday update to Sofia", projectId: undefined, clientId: nova.id, status: "TODO", priority: "MEDIUM", dueInDays: 0 },
    { title: "Prep Lumen demo", projectId: p2.id, clientId: lumen.id, status: "TODO", priority: "HIGH", dueInDays: 2 },
  ];

  for (const t of tasks) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + t.dueInDays);
    const created = await prisma.task.create({
      data: {
        userId: user.id, organizationId: org.id, title: t.title, description: t.description,
        status: t.status, priority: t.priority, dueDate,
        projectId: t.projectId, clientId: t.clientId,
      },
    });
    if (t.status === "DONE") await log("task.completed", `Task completed: ${t.title}`, "task", created.id);
    else await log("task.created", `Task created: ${t.title}`, "task", created.id);
  }

  // ── Notes ────────────────────────────────────────────
  await prisma.note.create({
    data: { userId: user.id, organizationId: org.id, clientId: nova.id, projectId: p1.id, title: "Kickoff takeaways", content: "Sofia wants a calm, premium feel. Avoid gradients. Keep the existing logo. Decision maker: Sofia + Leo (CTO).", visibility: "SHARED" },
  });
  await prisma.note.create({
    data: { userId: user.id, organizationId: org.id, clientId: lumen.id, projectId: p2.id, title: "Demo notes", content: "Marcus loved the filter bar. Asked for CSV export + saved views. Next demo: Friday 11:00." },
  });
  await prisma.note.create({
    data: { userId: user.id, organizationId: org.id, clientId: atlas.id, title: "Discovery call", content: "Elena needs a client portal for case tracking. Budget approved for phase 1. Send proposal before month-end." },
  });
  await prisma.activity.create({ data: { userId: user.id, organizationId: org.id, type: "note.added", message: "Note added: Kickoff takeaways" } });
  await prisma.activity.create({ data: { userId: user.id, organizationId: org.id, type: "note.added", message: "Note added: Demo notes" } });

  // ── v0.2 collaboration demo ──────────────────────────
  // Portal enabled for Nova Studio with a FIXED demo token (DEMO ONLY —
  // real invites use random tokens). Portal URL:
  // http://localhost:5173/portal/demo-portal-nova-001
  await prisma.client.updateMany({
    where: { portalToken: "demo-portal-nova-001" },
    data: { portalToken: null },
  });
  await prisma.client.update({
    where: { id: nova.id },
    data: { portalEnabled: true, portalToken: "demo-portal-nova-001" },
  });
  await prisma.project.update({ where: { id: p1.id }, data: { isShared: true } });
  const sharedTask = await prisma.task.findFirst({ where: { userId: user.id, organizationId: org.id, projectId: p1.id, status: "IN_PROGRESS" } });
  if (sharedTask) await prisma.task.update({ where: { id: sharedTask.id }, data: { isShared: true } });

  const req1 = await prisma.clientRequest.create({
    data: { userId: user.id, organizationId: org.id, clientId: nova.id, projectId: p1.id, title: "Homepage hero spacing", description: "Increase hero padding and update the CTA copy before Friday.", priority: "MEDIUM", status: "OPEN", createdBy: "CLIENT" },
  });
  await prisma.activity.create({ data: { userId: user.id, organizationId: org.id, type: "request.created", message: `New request from Sofia Bennett: ${req1.title}`, entityType: "request", entityId: req1.id } });
  await prisma.notification.create({ data: { userId: user.id, organizationId: org.id, type: "request.created", message: `New request from Sofia Bennett: ${req1.title}`, entityType: "request", entityId: req1.id } });

  await prisma.comment.create({
    data: { userId: user.id, organizationId: org.id, projectId: p1.id, authorName: "Alex Rivera", authorRole: "PRO", visibility: "SHARED", content: "First homepage direction is ready — Sofia, take a look when you can." },
  });
  await prisma.comment.create({
    data: { userId: user.id, organizationId: org.id, projectId: p1.id, authorName: "Sofia Bennett", authorRole: "CLIENT", visibility: "SHARED", content: "Love direction 2! Can we try it with the darker background?" },
  });

  await prisma.automationRule.create({
    data: { userId: user.id, organizationId: org.id, name: "Delivery review on completion", trigger: "project.completed", action: "create_task", config: JSON.stringify({ title: "Send delivery review & ask for testimonial", priority: "MEDIUM" }), enabled: true },
  });

  console.log(`Seed complete. Demo user: ${email} / Demo1234!`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());