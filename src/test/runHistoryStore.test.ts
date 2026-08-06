import { afterEach, describe, expect, it, vi } from "vitest";
import { clearRuns, loadRuns, saveRun } from "@/lib/runHistoryStore";
import type { SavedTestRun } from "@/lib/workspaceTypes";

function makeRun(id: string): SavedTestRun {
  return {
    id,
    prdName: `${id}.pdf`,
    prdExcerpt: "excerpt",
    generatedAt: new Date().toISOString(),
    totalCases: 1,
    suite: {
      featureName: "Feature",
      shortSummary: "Summary long enough to be plausible.",
      risks: ["risk one", "risk two"],
      assumptions: ["assumption"],
      sourceHighlights: ["highlight one", "highlight two"],
      cases: [],
    },
    modelName: "gemini-2.5-flash",
    promptVersion: "test",
  };
}

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("runHistoryStore", () => {
  it("round-trips a run", () => {
    saveRun("user-a", makeRun("run-1"));
    const runs = loadRuns("user-a");

    expect(runs).toHaveLength(1);
    expect(runs[0].id).toBe("run-1");
    expect(runs[0].promptVersion).toBe("test");
  });

  it("keeps each Google account's history separate", () => {
    saveRun("user-a", makeRun("run-a"));
    saveRun("user-b", makeRun("run-b"));

    expect(loadRuns("user-a").map((run) => run.id)).toEqual(["run-a"]);
    expect(loadRuns("user-b").map((run) => run.id)).toEqual(["run-b"]);
  });

  it("puts the newest run first and de-duplicates by id", () => {
    saveRun("user-a", makeRun("run-1"));
    saveRun("user-a", makeRun("run-2"));
    saveRun("user-a", makeRun("run-1"));

    expect(loadRuns("user-a").map((run) => run.id)).toEqual(["run-1", "run-2"]);
  });

  it("clears only the requested account", () => {
    saveRun("user-a", makeRun("run-a"));
    saveRun("user-b", makeRun("run-b"));

    clearRuns("user-a");

    expect(loadRuns("user-a")).toHaveLength(0);
    expect(loadRuns("user-b")).toHaveLength(1);
  });

  it("survives corrupt stored history instead of throwing", () => {
    window.localStorage.setItem("tcg.runs.user-a", "{not json");
    expect(loadRuns("user-a")).toEqual([]);
  });

  it("recovers from a quota error by trimming rather than losing the new run", () => {
    saveRun("user-a", makeRun("older"));

    const original = window.localStorage.setItem.bind(window.localStorage);
    let firstWrite = true;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation((key: string, value: string) => {
      if (firstWrite) {
        firstWrite = false;
        throw new DOMException("quota", "QuotaExceededError");
      }
      original(key, value);
    });

    const result = saveRun("user-a", makeRun("newest"));

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].id).toBe("newest");
  });
});
