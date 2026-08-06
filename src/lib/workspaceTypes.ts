import type { GeneratedSuite } from "./testCaseTypes.js";

/**
 * A knowledge-base document as the workspace holds it.
 *
 * `extractedText` is the parser output the model actually reads. It is stored in
 * the browser (IndexedDB) rather than on the server — see
 * docs/decisions/0001-browser-scoped-persistence.md.
 */
export interface SavedKnowledgeBaseDoc {
  id: string;
  name: string;
  excerpt: string;
  extractedText: string;
  addedAt: string;
  /** True when the parser cut the document at its character cap. */
  truncated: boolean;
}

export interface SavedTestRun {
  id: string;
  prdName: string;
  prdExcerpt: string;
  generatedAt: string;
  totalCases: number;
  suite: GeneratedSuite;
  /*
   * Traceability. Nothing reads these yet, but they are impossible to backfill
   * and without them a suite cannot be attributed to the prompt that produced it.
   * See docs/decisions/0009-data-model-authority.md.
   */
  modelName: string;
  promptVersion: string;
}

/** One parsed document returned by POST /api/parse. The server keeps no copy. */
export interface ParsedDocumentPayload {
  fileName: string;
  text: string;
  excerpt: string;
  truncated: boolean;
}

export interface ParseDocumentsResponse {
  documents: ParsedDocumentPayload[];
}

/** Knowledge-base context sent back up at generation time. */
export interface KnowledgeBaseContextItem {
  fileName: string;
  text: string;
}

export interface GenerationMeta {
  prdName: string;
  prdExcerpt: string;
  prdTruncated: boolean;
  generatedAt: string;
  modelName: string;
  promptVersion: string;
}

export interface GenerateTestCasesResponse {
  suite: GeneratedSuite;
  meta: GenerationMeta;
}
