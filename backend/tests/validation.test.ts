import { describe, expect, it } from "vitest";
import { registerSchema, loginSchema } from "../src/schemas/auth.js";
import { createClientSchema } from "../src/schemas/client.js";
import { createProjectSchema } from "../src/schemas/project.js";
import { createTaskSchema } from "../src/schemas/task.js";
import { createNoteSchema } from "../src/schemas/note.js";

describe("validation schemas", () => {
  it("rejects invalid register input", () => {
    expect(() => registerSchema.parse({ name: "A", email: "nope", password: "short" })).toThrow();
    expect(registerSchema.parse({ name: "Alex", email: "alex@mail.com", password: "secret123" })).toBeTruthy();
  });

  it("rejects invalid login input", () => {
    expect(() => loginSchema.parse({ email: "bad", password: "" })).toThrow();
  });

  it("validates client creation", () => {
    expect(() => createClientSchema.parse({ name: "" })).toThrow();
    expect(createClientSchema.parse({ name: "Acme", status: "LEAD" }).status).toBe("LEAD");
  });

  it("requires project client", () => {
    expect(() => createProjectSchema.parse({ name: "P" })).toThrow();
  });

  it("requires task title", () => {
    expect(() => createTaskSchema.parse({ title: "" })).toThrow();
  });

  it("requires note attachment", () => {
    expect(() => createNoteSchema.parse({ content: "hello" })).toThrow();
    expect(createNoteSchema.parse({ content: "hello", clientId: "c1" })).toBeTruthy();
  });
});
