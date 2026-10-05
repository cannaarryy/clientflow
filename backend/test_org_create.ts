const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const org = await prisma.organization.create({
      data: {
        name: 'Test Sandbox',
        slug: 'test-sandbox-' + Date.now(),
        isDemo: true,
      },
    });
    console.log('Created org:', org.id);
    await prisma.organization.delete({ where: { id: org.id } });
    console.log('Deleted org');
  } catch (e) {
    console.error('Error:', e);
  }
  await prisma.$disconnect();
}

test().catch(console.error);