import { z } from "zod";

export const clientStatus = z.enum(["ACTIVE", "INACTIVE", "LEAD"]);

export const createClientSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  company: z.string().max(160).optional().or(z.literal("")),
  email: z.string().email("Enter a valid email").max(160).optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  notes: z.string().max(5000).optional().or(z.literal("")),
  status: clientStatus.optional().default("ACTIVE"),
});

export const updateClientSchema = createClientSchema.partial();

export const clientQuerySchema = z.object({
  search: z.string().max(120).optional(),
  status: z.string().optional(),
});

export const portalSchema = z.object({
  enabled: z.boolean(),
});
