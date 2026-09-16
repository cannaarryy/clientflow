import { z } from "zod";
import { priority } from "./project.js";

export const taskStatus = z.enum(["TODO", "IN_PROGRESS", "DONE"]);

const dateInput = z.string().max(40).optional().or(z.literal("")).transform((v) => (v ? v : undefined));
const optionalId = z.string().min(1).optional().or(z.literal("")).transform((v) => (v ? v : undefined));

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(8000).optional().or(z.literal("")),
  status: taskStatus.optional().default("TODO"),
  priority: priority.optional().default("MEDIUM"),
  dueDate: dateInput,
  projectId: optionalId,
  clientId: optionalId,
});

export const updateTaskSchema = createTaskSchema.partial();
