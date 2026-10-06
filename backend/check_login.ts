import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function test() {
  const user = await prisma.user.findUnique({ where: { email: "demo@clientflow.io" } });
  console.log("user:", user ? { id: user.id, email: user.email } : "NOT FOUND");
  
  const password = "Demo1234!";
  const ok = await bcrypt.compare(password, user.passwordHash);
  console.log("password check:", ok);
  
  await prisma.$disconnect();
}

test().catch(console.error);