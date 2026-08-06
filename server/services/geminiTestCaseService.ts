import { GoogleGenAI } from "@google/genai";
import { ZodError, z } from "zod";
import type { GeneratedSuite } from "../../src/lib/testCaseTypes.js";
import { serverConfig } from "../config.js";
import type { ParsedDocument } from "./documentParser.js";

/**
 * The twelve approved coverage areas. Enforced in three places deliberately:
 * the API response schema (so the model cannot emit anything else), the Zod
 * parse (so a schema regression cannot slip a rogue value through to the UI),
 * and the system prompt (so the model knows *why* each area exists).
 */
/**
 * Bump whenever SYSTEM_PROMPT changes in a way that could alter output quality.
 * Stored alongside each run so a suite can be attributed to the prompt that made
 * it. See docs/decisions/0009-data-model-authority.md.
 */
export const PROMPT_VERSION = "2026-08-03.1";

const COVERAGE_AREAS = [
  "Core Functional Flow",
  "Input Validation & Error Handling",
  "Permissions & Access Control",
  "API & Data Integrity",
  "Integrations & External Dependencies",
  "State, Concurrency & Edge Cases",
  "Cross-Module Impact & Regression",
  "Notifications & Messaging",
  "Analytics & Instrumentation",
  "Accessibility",
  "Performance & Load",
  "Security",
] as const;

const generatedSuiteSchema = z.object({
  featureName: z.string().min(3),
  shortSummary: z.string().min(20),
  risks: z.array(z.string().min(5)).min(2),
  assumptions: z.array(z.string().min(5)).min(1),
  sourceHighlights: z.array(z.string().min(5)).min(2),
  cases: z
    .array(
      z.object({
        id: z.string().min(2),
        title: z.string().min(5),
        criticality: z.enum(["Low", "Medium", "High"]),
        rationale: z.string().min(10),
        coverageArea: z.enum(COVERAGE_AREAS),
        steps: z
          .array(
            z.object({
              id: z.string().min(1),
              text: z.string().min(8),
            }),
          )
          .min(3),
      }),
    )
    .min(5),
});

const generatedSuiteJsonSchema = {
  type: "object",
  properties: {
    featureName: { type: "string" },
    shortSummary: { type: "string" },
    risks: { type: "array", items: { type: "string" }, minItems: 2 },
    assumptions: { type: "array", items: { type: "string" }, minItems: 1 },
    sourceHighlights: { type: "array", items: { type: "string" }, minItems: 2 },
    cases: {
      type: "array",
      minItems: 5,
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          criticality: { type: "string", enum: ["Low", "Medium", "High"] },
          rationale: { type: "string" },
          coverageArea: { type: "string", enum: [...COVERAGE_AREAS] },
          steps: {
            type: "array",
            minItems: 3,
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                text: { type: "string" },
              },
              required: ["id", "text"],
            },
          },
        },
        required: ["id", "title", "criticality", "rationale", "coverageArea", "steps"],
      },
    },
  },
  required: ["featureName", "shortSummary", "risks", "assumptions", "sourceHighlights", "cases"],
} as const;

const SYSTEM_PROMPT = `
You are a senior QA architect with 15 years of experience shipping consumer and enterprise software. You have seen releases fail because someone tested the happy path and called it done. Your job is not to summarize the PRD — it is to find the ways this feature will break in production and turn them into test cases a QA engineer can execute today without asking you a follow-up question.

### Your reasoning procedure (do this before writing any JSON)

Work through these passes internally. Do not output your working — only the final JSON.

1. **Requirement inventory.** Extract every discrete, testable requirement from the PRD. Include explicit statements ("users can upload up to 5 files"), implied constraints ("upload" implies file type, size, and failure handling), and stated non-goals (they define negative tests).
2. **Knowledge base reconciliation.** Read the supporting documents for existing system behavior, constraints, prior decisions, and API contracts. Where a knowledge base document conflicts with the PRD, the PRD wins — but record the conflict in \`assumptions\`.
3. **First-principles derivation.** For each requirement, reason from the system's mechanics rather than the document's wording. Ask: What state must exist first? What happens at the boundary of every limit? What happens if two users do this simultaneously? What happens on network failure mid-operation? What does this write to, and who else reads that data? What is the rollback path?
4. **Blast radius analysis.** For every module, screen, table, event, or endpoint this feature touches, identify what else consumes it. Those are your regression tests. Only assert a cross-module impact if the PRD or a knowledge base document gives you grounds for it — do not invent modules.
5. **Gap identification.** List everything the PRD leaves undefined that QA will hit on day one (error copy, empty states, permission matrix holes, undefined limits, missing analytics events). Record these in \`assumptions\`, and where an assumption is load-bearing, write a test case that would expose it if wrong.
6. **Then, and only then**, write the test cases.

### Coverage requirements

Produce **18 to 28 test cases**, distributed across the coverage areas below. Do not stop at a minimum — the count should reflect the actual surface area of the PRD. Prune duplicates rather than padding with trivial variations.

Use exactly these values for \`coverageArea\`:

${COVERAGE_AREAS.map((area) => `- \`${area}\``).join("\n")}

Rules for distribution:

- Every area that the PRD plausibly touches must have at least one case. Skip an area entirely rather than inventing a case for it.
- No more than 25% of cases may be \`Core Functional Flow\`. Happy paths are the cheapest and least valuable cases you can write.
- Include at least four negative or failure-mode cases (invalid input, denied permission, dependency down, partial failure mid-transaction).
- Include at least two cases derived from first principles that the PRD does not explicitly ask for.
- Accessibility cases must name a specific WCAG 2.1 AA criterion (keyboard operability, focus order, contrast ratio, programmatic name/role/value, error identification).
- Performance cases must name a concrete threshold. If the PRD gives none, propose one and record that proposal in \`assumptions\`.

### Criticality rubric

Assign \`criticality\` using these definitions, not intuition.

**High** — failure blocks release. Any one of: core user journey is unusable; data loss, corruption, or leakage; permission or authentication bypass; incorrect money, billing, or inventory; legal/compliance violation; silent failure with no user-visible error; no workaround exists.

**Medium** — failure degrades the product but the release can proceed. Any one of: a workaround exists; a secondary flow or non-primary persona is affected; recoverable error with poor UX; missing or wrong analytics; accessibility barrier that has an alternate path; performance degradation short of timeout.

**Low** — failure is tolerable. Cosmetic issues, copy and formatting, rare edge cases on low-traffic paths, minor inconsistencies that are trivially recoverable.

Calibration check: if more than roughly 30% of your cases are High, you are inflating. Re-apply the rubric.

### How to write steps (this is where the schema constrains you)

The output schema has **no separate expected-result field**. The expected result must therefore live inside the step text, or the test case is worthless. Structure every case as:

- **Step 1 — Precondition and setup.** State the required user role, environment, feature flag state, and seeded data using concrete values.
- **Steps 2 to N-1 — Actions.** One discrete tester action per step, with the actual data to enter.
- **Final step (and any intermediate checkpoints) — Verification.** Begin with "Verify that" or "Confirm that" and state a single observable, falsifiable outcome.

Requirements for every step:

- 4 to 7 steps per case. Three is the absolute floor and should be rare.
- Use concrete test data, never placeholders. Write \`qa.user+01@example.com\`, \`an 11 MB PDF\`, \`quantity of 0\`, \`a Viewer-role account\` — not "valid credentials" or "invalid input".
- At least one step must contain a verifiable assertion naming what the tester should see: exact expected copy, HTTP status, database state, emitted event name, or UI state.
- Each step must stand alone as an instruction. A tester who has never read the PRD must be able to execute it.

**Reject these anti-patterns in your own output:**

| Bad | Why | Good |
|---|---|---|
| "Test the upload feature" | Not an action | "Click Upload and select \`sample-12mb.pdf\`" |
| "Check that it works" | No oracle | "Verify that the error banner reads 'File exceeds 10 MB limit' and the file is not added to the list" |
| "Enter valid data" | No test data | "Enter \`qa.user+01@example.com\` in the Email field" |
| "Verify the API response" | Unfalsifiable | "Verify that \`POST /v1/uploads\` returns \`413\` with \`error.code = FILE_TOO_LARGE\`" |
| Step that restates the title | Filler | Remove it |

### Other field requirements

- \`id\` — sequential, \`TC-001\` through \`TC-0NN\`. Step ids are \`TC-001-S1\`, \`TC-001-S2\`, and so on.
- \`title\` — a specific, scannable statement of what is being verified. "Upload rejects files above the 10 MB limit", not "File upload test".
- \`rationale\` — one to two sentences on why this matters and what breaks if it fails. Where possible, cite the source: the PRD section or the knowledge base document and heading it derives from. If the case comes from your own first-principles reasoning rather than the documents, say so explicitly.
- \`assumptions\` — every inference, ambiguity, conflict between documents, proposed threshold, and undefined behavior you had to work around. This list is a deliverable in its own right, not an afterthought; a short assumptions list on an ambiguous PRD means you were not reading skeptically.
- If any input document appears truncated mid-sentence, note it in \`assumptions\` and flag which areas may be under-covered as a result.

### Remaining schema fields

These three fields are required by the output schema and are rendered side by side with \`assumptions\` in the reviewing UI. Treat them with the same rigor as everything above.

- \`featureName\` — the name of the capability under test, taken from the PRD. A short noun phrase, not a sentence and not a filename.
- \`shortSummary\` — three to five sentences grounded strictly in the provided documents. No marketing language. Describe what the feature does and what it changes, not why it is valuable.
- \`risks\` — **at least two, and normally five to eight.** The release risks this feature carries if the coverage below misses something: what actually goes wrong in production, stated as consequence rather than as a restatement of a test case. These are business and system risks, not test titles.
- \`sourceHighlights\` — **at least two, and normally five to eight.** Direct, load-bearing statements lifted or closely paraphrased from the input documents that your test cases rest on: stated limits, API contracts, non-goals, rules, and thresholds. This is the evidence trail a reviewer uses to check your work against the source, so prefer specifics over summary.

### Grounding discipline

Do not invent product behavior. Every test case must trace to something in the PRD, something in the knowledge base, or a defensible inference from how software of this kind necessarily works. Inferences are permitted and encouraged — unstated inferences are not. If you cannot ground a case, drop it.

### Output

Return only valid JSON conforming to the provided schema. No markdown fences, no preamble, no commentary.

### Final self-check before you emit

Silently verify each of the following. If any fails, fix it before responding.

1. Case count is between 18 and 28, and no two cases test the same thing.
2. Every \`coverageArea\` value is drawn from the approved list.
3. High-criticality cases are at most ~30% of the total, and each one meets a specific clause of the High rubric.
4. Every case has 4 or more steps, and at least one step per case states a concrete, falsifiable expected outcome.
5. No step contains a placeholder like "valid data", "appropriate value", or "as expected".
6. At least four negative or failure-mode cases are present.
7. Every ambiguity you encountered appears in \`assumptions\`.
8. \`risks\` and \`sourceHighlights\` each carry at least two substantive entries.
9. The output parses as JSON on the first attempt.
`.trim();

export class GeminiGenerationError extends Error {
  constructor(
    message: string,
    readonly causeDetails?: unknown,
  ) {
    super(message);
    this.name = "GeminiGenerationError";
  }
}

function formatDocumentSection(document: ParsedDocument, heading: string) {
  return [`### ${heading}: ${document.fileName}`, document.text].join("\n");
}

function buildUserMessage(
  prd: ParsedDocument,
  knowledgeBaseDocs: ParsedDocument[],
  truncationNotices: string[],
) {
  const knowledgeBaseBlock = knowledgeBaseDocs.length
    ? knowledgeBaseDocs
        .map((document, index) => formatDocumentSection(document, `Document ${index + 1}`))
        .join("\n\n")
    : "None provided.";

  const truncationBlock = truncationNotices.length
    ? [
        "",
        "## INPUT TRUNCATION NOTICE",
        "",
        "The following inputs were cut short before reaching you. Declare this in `assumptions` and state which coverage areas may be under-covered as a result.",
        ...truncationNotices.map((notice) => `- ${notice}`),
      ].join("\n")
    : "";

  return `
## PRIMARY PRD (authoritative)

${formatDocumentSection(prd, "Document")}

## KNOWLEDGE BASE (supporting context — subordinate to the PRD)

${knowledgeBaseBlock}
${truncationBlock}

## TASK

Generate the QA test plan for the feature described in the PRD above, following your
system instructions. Return only the JSON object.
`.trim();
}

function buildRepairMessage(
  prd: ParsedDocument,
  knowledgeBaseDocs: ParsedDocument[],
  truncationNotices: string[],
  problems: string[],
) {
  return `
Your previous response was rejected. Regenerate the entire JSON response from scratch and fix every issue below.

Issues to fix:
${problems.map((problem) => `- ${problem}`).join("\n")}

Repair rules:
- Do not reuse invalid partial output.
- Do not pad the case list to satisfy a count; fix the specific issues named above.
- Return only JSON matching the schema exactly.

${buildUserMessage(prd, knowledgeBaseDocs, truncationNotices)}
`.trim();
}

async function requestSuite(client: GoogleGenAI, userMessage: string) {
  const response = await client.models.generateContent({
    model: serverConfig.geminiModel,
    contents: userMessage,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: generatedSuiteJsonSchema,
    },
  });

  const rawText = response.text;
  if (!rawText) {
    throw new GeminiGenerationError("Gemini returned an empty response.");
  }

  try {
    return JSON.parse(rawText);
  } catch (error) {
    throw new GeminiGenerationError("Gemini returned malformed JSON.", error);
  }
}

const PLACEHOLDER_PATTERNS = [
  /\bvalid data\b/i,
  /\bvalid input\b/i,
  /\binvalid input\b/i,
  /\bvalid credentials\b/i,
  /\bappropriate value\b/i,
  /\bas expected\b/i,
  /\bworks correctly\b/i,
  /\bcheck that it works\b/i,
];

/**
 * Quality heuristics the JSON schema cannot express. These are advisory: they
 * can trigger the single retry, but they never fail the run on their own, so a
 * regex false positive can't cost the user a generation that is otherwise good.
 */
function findQualityProblems(suite: GeneratedSuite) {
  const problems: string[] = [];

  const titles = suite.cases.map((testCase) => testCase.title.trim().toLowerCase());
  const duplicates = [...new Set(titles.filter((title, index) => titles.indexOf(title) !== index))];
  if (duplicates.length) {
    problems.push(`Duplicate test case titles: ${duplicates.join("; ")}. Every case must test something different.`);
  }

  for (const testCase of suite.cases) {
    for (const step of testCase.steps) {
      const hit = PLACEHOLDER_PATTERNS.find((pattern) => pattern.test(step.text));
      if (hit) {
        problems.push(
          `Case ${testCase.id} step ${step.id} contains a placeholder instead of concrete test data: "${step.text}"`,
        );
      }
    }
  }

  const thinCases = suite.cases.filter((testCase) => testCase.steps.length < 4);
  if (thinCases.length > suite.cases.length / 2) {
    problems.push(
      `${thinCases.length} of ${suite.cases.length} cases have fewer than 4 steps. Three is the absolute floor and should be rare.`,
    );
  }

  return problems;
}

function describeZodIssues(error: ZodError) {
  return error.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`);
}

function truncateKnowledgeBaseDocs(documents: ParsedDocument[]) {
  let runningTotal = 0;
  const notices: string[] = [];
  const kept: ParsedDocument[] = [];

  for (const document of documents) {
    const remaining = Math.max(serverConfig.maxCombinedChars - runningTotal, 0);

    if (remaining === 0) {
      notices.push(`Knowledge base document "${document.fileName}" was omitted entirely (combined size limit reached).`);
      continue;
    }

    const nextText = document.text.slice(0, remaining);
    runningTotal += nextText.length;

    if (nextText.length < document.text.length) {
      notices.push(`Knowledge base document "${document.fileName}" was cut short at the combined size limit.`);
    }
    if (document.truncated) {
      notices.push(`Knowledge base document "${document.fileName}" was already truncated when parsed.`);
    }

    kept.push({ ...document, text: nextText });
  }

  return { documents: kept, notices };
}

export async function generateTestSuiteWithGemini(
  prd: ParsedDocument,
  knowledgeBaseDocs: ParsedDocument[],
): Promise<GeneratedSuite> {
  if (!serverConfig.geminiApiKey) {
    throw new Error("Missing GEMINI_API_KEY. Add it to your environment before generating test cases.");
  }

  const client = new GoogleGenAI({ apiKey: serverConfig.geminiApiKey });

  // The PRD is authoritative and is never truncated to make room for context.
  const { documents: limitedKnowledgeBaseDocs, notices } = truncateKnowledgeBaseDocs(knowledgeBaseDocs);
  const truncationNotices = prd.truncated
    ? [`The primary PRD "${prd.fileName}" was cut short at the parser's size limit.`, ...notices]
    : notices;

  const firstPayload = await requestSuite(client, buildUserMessage(prd, limitedKnowledgeBaseDocs, truncationNotices));
  const firstAttempt = generatedSuiteSchema.safeParse(firstPayload);

  if (firstAttempt.success) {
    const qualityProblems = findQualityProblems(firstAttempt.data);
    if (!qualityProblems.length) {
      return firstAttempt.data;
    }

    console.warn("Gemini response passed schema but failed quality checks; retrying:", qualityProblems);

    try {
      const repaired = await requestSuite(
        client,
        buildRepairMessage(prd, limitedKnowledgeBaseDocs, truncationNotices, qualityProblems),
      );
      const repairedAttempt = generatedSuiteSchema.safeParse(repaired);
      if (repairedAttempt.success) {
        return repairedAttempt.data;
      }
      console.warn("Quality retry failed schema validation; keeping the first valid suite.");
    } catch (error) {
      console.warn("Quality retry failed; keeping the first valid suite.", error);
    }

    // Quality checks are advisory — a schema-valid suite still ships.
    return firstAttempt.data;
  }

  const schemaProblems = describeZodIssues(firstAttempt.error);
  console.error("Gemini response failed validation on first attempt:", schemaProblems);

  const retryPayload = await requestSuite(
    client,
    buildRepairMessage(prd, limitedKnowledgeBaseDocs, truncationNotices, schemaProblems),
  );
  const retryAttempt = generatedSuiteSchema.safeParse(retryPayload);
  if (retryAttempt.success) {
    return retryAttempt.data;
  }

  console.error("Gemini response failed validation after retry:", describeZodIssues(retryAttempt.error));

  throw new GeminiGenerationError(
    "The AI generated an incomplete test suite twice. Please retry with a more explicit PRD or add clearer supporting documents.",
    retryAttempt.error.issues,
  );
}
