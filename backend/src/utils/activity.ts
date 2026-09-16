import { prisma } from "../lib/prisma.js";

export async function recordActivity(
  userId: string,
  type: string,
  message: string,
  entityType?: string,
  entityId?: string,
) {
  try {
    await prisma.activity.create({ data: { userId, type, message, entityType, entityId } });
  } catch (err) {
    console.error("[activity] failed to record", err);
  }
}
