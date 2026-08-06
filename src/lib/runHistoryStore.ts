import type { SavedTestRun } from "@/lib/workspaceTypes";

/**
 * Run history for v1: localStorage, keyed per Google account.
 *
 * localStorage is adequate here where it is not for knowledge-base text — a run
 * record is tens of kilobytes, not hundreds. History is capped so a long-lived
 * workspace cannot silently exhaust the origin quota and start throwing on write.
 * See docs/decisions/0001-browser-scoped-persistence.md.
 */

const KEY_PREFIX = "tcg.runs.";
const MAX_RUNS = 50;

function keyFor(userSub: string) {
  return `${KEY_PREFIX}${userSub}`;
}

export function loadRuns(userSub: string): SavedTestRun[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(keyFor(userSub));
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as SavedTestRun[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Corrupt or unreadable history must not brick the workspace.
    return [];
  }
}

function persist(userSub: string, runs: SavedTestRun[]) {
  window.localStorage.setItem(keyFor(userSub), JSON.stringify(runs));
}

/** Returns the new history, newest first. Throws only if storage is exhausted. */
export function saveRun(userSub: string, run: SavedTestRun): SavedTestRun[] {
  const next = [run, ...loadRuns(userSub).filter((existing) => existing.id !== run.id)].slice(
    0,
    MAX_RUNS,
  );

  try {
    persist(userSub, next);
  } catch {
    // Quota exceeded: drop the oldest half and try once more rather than losing
    // the run the user just waited minutes for.
    const trimmed = next.slice(0, Math.max(1, Math.floor(next.length / 2)));
    persist(userSub, trimmed);
    return trimmed;
  }

  return next;
}

export function clearRuns(userSub: string): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(keyFor(userSub));
  }
}
