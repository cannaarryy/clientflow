import { PrismaClient } from "@prisma/client";
import { verifyPassword, hashPassword } from "./src/utils/password.js";
import { signToken, AUTH_COOKIE, cookieOptions } from "./src/utils/jwt.js";

const prisma = new PrismaClient();

async function testLogin() {
  try {
    const email = "demo@clientflow.io";
    const password = "Demo1234!";
    
    const user = await prisma.user.findUnique({ where: { email } });
    console.log("User found:", user ? "YES" : "NO");
    if (!user) return;
    
    console.log("User:", { id: user.id, email: user.email, name: user.name });
    
    const ok = await verifyPassword(password, user.passwordHash);
    console.log("Password check:", ok);
    
    if (!ok) {
      console.log("Password verification failed");
      return;
    }
    
    const token = signToken(user.id, user.tokenVersion);
    console.log("Token generated:", token.substring(0, 20) + "...");
    
    const cookie = cookieOptions();
    console.log("Cookie options:", cookie);
    
    console.log("All good!");
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin().catch(console.error);