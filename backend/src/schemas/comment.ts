import { z } from "zod";

export const visibility = z.enum(["INTERNAL", "SHARED"]);

const optionalId = z.string().min(1).optional().or(z.literal("")).transform((v) => (v ? v : undefined));

export const createCommentSchema = z
  .object({
    content: z.string().min(1, "Content is required").max(5000),
    projectId: optionalId,
    taskId: optionalId,
    requestId: optionalId,
    visibility: visibility.optional().default("INTERNAL"),
  })
  .refine((v) => v.projectId || v.taskId || v.requestId, {
    message: "Attach the comment to a project, task or request",
    path: ["projectId"],
  });
