import { describe, expect, it } from "vitest";
import { computeHealth } from "../src/utils/health.js";

describe("computeHealth", () => {
  it("is completed when status is COMPLETED", () => {
    const h = computeHealth({ status: "COMPLETED", tasks: [{ status: "DONE" }] });
    expect(h.health).toBe("COMPLETED");
    expect(h.progress).toBe(100);
  });

  it("computes real progress (7/10 → 70%)", () => {
    const tasks = [...Array(7)].map(() => ({ status: "DONE" as const })).concat([...Array(3)].map(() => ({ status: "TODO" as const })));
    const h = computeHealth({ status: "ACTIVE", tasks });
    expect(h.progress).toBe(70);
    expect(h.health).toBe("HEALTHY");
  });

  it("flags overdue work as at_risk", () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    const h = computeHealth({ status: "ACTIVE", tasks: [{ status: "TODO", dueDate: past, priority: "LOW" }] });
    expect(h.health).toBe("AT_RISK");
    expect(h.overdue).toBe(1);
  });

  it("escalates overdue HIGH priority to blocked", () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    const h = computeHealth({ status: "ACTIVE", tasks: [{ status: "IN_PROGRESS", dueDate: past, priority: "HIGH" }] });
    expect(h.health).toBe("BLOCKED");
  });

  it("marks ON_HOLD as blocked", () => {
    const h = computeHealth({ status: "ON_HOLD", tasks: [] });
    expect(h.health).toBe("BLOCKED");
    expect(h.progress).toBe(0);
  });

  it("flags passed project deadline with open tasks", () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    const h = computeHealth({ status: "ACTIVE", dueDate: past, tasks: [{ status: "TODO" }] });
    expect(h.health).toBe("AT_RISK");
  });
});
