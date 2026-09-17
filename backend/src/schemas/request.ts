import { z } from "zod";
import { priority } from "./project.js";

export const requestStatus = z.enum(["OPEN", "IN_PROGRESS", "CONVERTED", "DECLINED"]);

const optionalId = z.string().min(1).optional().or(z.literal("")).transform((v) => (v ? v : undefined));

export const createRequestSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(8000).optional().or(z.literal("")),
  clientId: z.string().min(1, "Client is required"),
  projectId: optionalId,
  priority: priority.optional().default("MEDIUM"),
});

export const updateRequestSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(8000).optional().or(z.literal("")),
  priority: priority.optional(),
  status: requestStatus.optional(),
  projectId: optionalId,
});
