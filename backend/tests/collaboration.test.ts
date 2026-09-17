import { describe, expect, it } from "vitest";
import { createRequestSchema } from "../src/schemas/request.js";
import { createCommentSchema } from "../src/schemas/comment.js";
import { createAutomationSchema } from "../src/schemas/automation.js";

describe("collaboration schemas", () => {
  it("validates requests", () => {
    expect(() => createRequestSchema.parse({ title: "", clientId: "c1" })).toThrow();
    const r = createRequestSchema.parse({ title: "Fix hero", clientId: "c1" });
    expect(r.priority).toBe("MEDIUM");
  });

  it("requires comment attachment", () => {
    expect(() => createCommentSchema.parse({ content: "hi" })).toThrow();
    expect(createCommentSchema.parse({ content: "hi", projectId: "p1" }).visibility).toBe("INTERNAL");
  });

  it("restricts automation triggers/actions to known ids", () => {
    expect(() => createAutomationSchema.parse({ name: "x", trigger: "nope", action: "create_task" })).toThrow();
    expect(() => createAutomationSchema.parse({ name: "x", trigger: "task.overdue", action: "nope" })).toThrow();
    const a = createAutomationSchema.parse({ name: "Follow up", trigger: "project.completed", action: "create_task", config: { title: "Review" } });
    expect(a.config).toEqual({ title: "Review" });
  });
});
