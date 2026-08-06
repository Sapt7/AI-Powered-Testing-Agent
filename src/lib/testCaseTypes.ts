export type Criticality = "Low" | "Medium" | "High";

export interface TestStep {
  id: string;
  text: string;
}

export interface GeneratedTestCase {
  id: string;
  title: string;
  criticality: Criticality;
  rationale: string;
  coverageArea: string;
  steps: TestStep[];
}

export interface GeneratedSuite {
  featureName: string;
  shortSummary: string;
  risks: string[];
  assumptions: string[];
  sourceHighlights: string[];
  cases: GeneratedTestCase[];
}
