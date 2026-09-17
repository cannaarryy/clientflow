import { prisma } from "../lib/prisma.js";
import { recordActivity } from "./activity.js";
import { evaluateAutomations, type TriggerId } from "./automations.js";

export interface DomainEvent {
  userId: string;
  /** e.g. "project.completed" | "task.completed" | "request.created" | ... */
  type: string;
  message: string;
  entityType?: string;
  entityId?: string;
  /** Extra context forwarded to automation actions (ids, titles...). */
  context?: Record<string, unknown>;
}

/**
 * Central event pipeline (monolith-appropriate, no message bus):
 *
 *   entity changed → event → activity (+ notification) → automations
 *
 * Failures in side-effects never break the main request.
 */
export async function emitEvent(event: DomainEvent): Promise<void> {
  try {
    await recordActivity(event.userId, event.type, event.message, event.entityType, event.entityId);
  } catch (err) {
    console.error("[events] activity failed", err);
  }

  // In-app notification for collaboration-relevant events.
  const NOTIFY: Record<string, boolean> = {
    "request.created": true,
    "request.converted": true,
    "comment.client": true,
    "task.overdue": true,
    "project.at_risk": true,
  };
  if (NOTIFY[event.type]) {
    try {
      const exists = await prisma.notification.findFirst({
        where: { userId: event.userId, type: event.type, entityId: event.entityId ?? undefined, readAt: null },
      });
      if (!exists) {
        await prisma.notification.create({
          data: {
            userId: event.userId,
            type: event.type,
            message: event.message,
            entityType: event.entityType,
            entityId: event.entityId,
          },
        });
      }
    } catch (err) {
      console.error("[events] notification failed", err);
    }
  }

  // Automation engine (fire-and-forget).
  const trigger = event.type as TriggerId;
  void evaluateAutomations(event.userId, trigger, {
    entityId: event.entityId,
    entityType: event.entityType,
    message: event.message,
    ...(event.context ?? {}),
  }).catch((err) => console.error("[events] automations failed", err));
}
