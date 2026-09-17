import { z } from "zod";

export const TRIGGER_IDS = ["project.completed", "task.completed", "task.overdue", "request.created"] as const;
export const ACTION_IDS = ["create_task", "create_activity", "create_notification"] as const;

export const triggerSchema = z.enum(TRIGGER_IDS);
export const actionSchema = z.enum(ACTION_IDS);

const configSchema = z.record(z.string(), z.unknown()).optional().default({});

export const createAutomationSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  trigger: triggerSchema,
  action: actionSchema,
  config: configSchema,
  enabled: z.boolean().optional().default(true),
});

export const updateAutomationSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  trigger: triggerSchema.optional(),
  action: actionSchema.optional(),
  config: configSchema.optional(),
  enabled: z.boolean().optional(),
});
