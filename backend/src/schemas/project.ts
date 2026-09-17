import { z } from "zod";

export const projectStatus = z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED"]);
export const priority = z.enum(["LOW", "MEDIUM", "HIGH"]);

const dateInput = z
  .string()
  .max(40)
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? v : undefined));

export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(160),
  description: z.string().max(8000).optional().or(z.literal("")),
  clientId: z.string().min(1, "Client is required"),
  status: projectStatus.optional().default("PLANNING"),
  priority: priority.optional().default("MEDIUM"),
  startDate: dateInput,
  dueDate: dateInput,
  isShared: z.boolean().optional().default(false),
});

export const updateProjectSchema = createProjectSchema.partial().omit({ clientId: true }).extend({
  clientId: z.string().min(1).optional(),
});

export const shareProjectSchema = z.object({
  isShared: z.boolean(),
});
