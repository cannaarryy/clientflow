import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function test() {
  const user = await prisma.user.findUnique({ where: { email: "demo@clientflow.io" } });
  console.log("user:", user);
  await prisma.$disconnect();
}

test().catch(console.error);