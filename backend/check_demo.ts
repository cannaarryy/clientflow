const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const org = await prisma.organization.findFirst({ where: { slug: 'demo-org' } });
  console.log('demo-org:', org ? org.id : 'NOT FOUND');
  if (org) {
    const clients = await prisma.client.findMany({ where: { organizationId: org.id } });
    console.log('clients:', clients.length);
  }
  await prisma.$disconnect();
}

test().catch(console.error);