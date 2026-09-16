import { z } from "zod";

const optionalId = z.string().min(1).optional().or(z.literal("")).transform((v) => (v ? v : undefined));

export const createNoteSchema = z
  .object({
    title: z.string().max(160).optional().or(z.literal("")),
    content: z.string().min(1, "Content is required").max(10000),
    clientId: optionalId,
    projectId: optionalId,
  })
  .refine((v) => v.clientId || v.projectId, { message: "Attach the note to a client or a project", path: ["clientId"] });

export const updateNoteSchema = z.object({
  title: z.string().max(160).optional().or(z.literal("")),
  content: z.string().min(1).max(10000).optional(),
});
