import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";
import { MSG } from "../../frontend/src/i18n/translations.js";

const SRC = join(__dirname, "..", "..", "frontend", "src");

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (full.endsWith(".tsx") || full.endsWith(".ts")) yield full;
  }
}

function usedLiteralKeys(): string[] {
  const keys = new Set<string>();
  for (const file of walk(SRC)) {
    if (file.endsWith("translations.ts")) continue;
    const src = readFileSync(file, "utf8");
    // t("key") / t('key') with optional { vars }
    const re = /\bt\(\s*["']([A-Za-z0-9_.]+)["']/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src)) !== null) keys.add(m[1]);
  }
  return [...keys];
}

describe("i18n dictionary parity", () => {
  it("every key has non-empty en + es", () => {
    const bad: string[] = [];
    for (const [k, v] of Object.entries(MSG)) {
      if (!v.en?.trim() || !v.es?.trim()) bad.push(k);
    }
    expect(bad).toEqual([]);
  });

  it("every literal t() key used in code exists in the dictionary", () => {
    const missing = usedLiteralKeys().filter((k) => !MSG[k]);
    expect(missing).toEqual([]);
  });

  it("dynamic status/health/visibility/automation keys exist", () => {
    const statuses = ["ACTIVE", "INACTIVE", "LEAD", "PLANNING", "ON_HOLD", "COMPLETED", "TODO", "IN_PROGRESS", "DONE", "LOW", "MEDIUM", "HIGH", "OPEN", "IN_PROGRESS", "CONVERTED", "DECLINED"];
    for (const s of statuses) expect(MSG[`st.${s}`], `st.${s}`).toBeTruthy();
    for (const h of ["HEALTHY", "AT_RISK", "BLOCKED", "COMPLETED"]) expect(MSG[`health.${h}`], `health.${h}`).toBeTruthy();
    for (const v of ["INTERNAL", "SHARED"]) expect(MSG[`vis.${v}`], `vis.${v}`).toBeTruthy();
    for (const tg of ["project.completed", "task.completed", "task.overdue", "request.created"]) {
      expect(MSG[`auto.trigger_${tg}`], `auto.trigger_${tg}`).toBeTruthy();
    }
    for (const a of ["create_task", "create_activity", "create_notification"]) {
      expect(MSG[`auto.action_${a}`], `auto.action_${a}`).toBeTruthy();
    }
  });
});
