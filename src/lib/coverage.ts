import type { Criticality, GeneratedTestCase } from "@/lib/testCaseTypes";

/**
 * The twelve coverage areas, in board order, with the short label a manometer
 * tube can carry. Must stay in step with COVERAGE_AREAS in
 * server/services/geminiTestCaseService.ts — the server enum is the authority.
 */
export const COVERAGE_AREAS = [
  { id: "Core Functional Flow", short: "Core flow" },
  { id: "Input Validation & Error Handling", short: "Validation" },
  { id: "Permissions & Access Control", short: "Access" },
  { id: "API & Data Integrity", short: "Data" },
  { id: "Integrations & External Dependencies", short: "Integrations" },
  { id: "State, Concurrency & Edge Cases", short: "Edge cases" },
  { id: "Cross-Module Impact & Regression", short: "Regression" },
  { id: "Notifications & Messaging", short: "Notifications" },
  { id: "Analytics & Instrumentation", short: "Analytics" },
  { id: "Accessibility", short: "Accessibility" },
  { id: "Performance & Load", short: "Performance" },
  { id: "Security", short: "Security" },
] as const;

/** Runs generated before the enum existed carry free-text areas; they pool here. */
export const OTHER_AREA = { id: "__other__", short: "Other" } as const;

export interface AreaReading {
  id: string;
  label: string;
  short: string;
  total: number;
  high: number;
  medium: number;
  low: number;
}

const KNOWN = new Set<string>(COVERAGE_AREAS.map((area) => area.id));

export function areaOf(testCase: GeneratedTestCase): string {
  return KNOWN.has(testCase.coverageArea) ? testCase.coverageArea : OTHER_AREA.id;
}

export function shortLabelFor(areaId: string): string {
  return COVERAGE_AREAS.find((area) => area.id === areaId)?.short ?? OTHER_AREA.short;
}

export function readAreas(cases: GeneratedTestCase[]): AreaReading[] {
  const readings: AreaReading[] = COVERAGE_AREAS.map((area) => ({
    id: area.id,
    label: area.id,
    short: area.short,
    total: 0,
    high: 0,
    medium: 0,
    low: 0,
  }));
  const other: AreaReading = {
    id: OTHER_AREA.id,
    label: "Other (pre-enum runs)",
    short: OTHER_AREA.short,
    total: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const testCase of cases) {
    const target = readings.find((reading) => reading.id === testCase.coverageArea) ?? other;
    target.total += 1;
    const key: Record<Criticality, "high" | "medium" | "low"> = {
      High: "high",
      Medium: "medium",
      Low: "low",
    };
    target[key[testCase.criticality]] += 1;
  }

  return other.total ? [...readings, other] : readings;
}
