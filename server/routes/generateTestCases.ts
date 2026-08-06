import { Router } from "express";
import multer from "multer";
import type { ParsedDocument } from "../services/documentParser.js";
import { serverConfig } from "../config.js";
import { parseUploadedDocument } from "../services/documentParser.js";
import {
  GeminiGenerationError,
  PROMPT_VERSION,
  generateTestSuiteWithGemini,
} from "../services/geminiTestCaseService.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: serverConfig.maxUploadSizeBytes,
    files: 1,
    /*
     * The knowledge base now arrives as a JSON text field rather than from a
     * database, so the field limit — not the file limit — is what would truncate
     * it. Multer's 1 MB default is below the combined context budget.
     */
    fieldSize: serverConfig.maxKnowledgeBaseFieldBytes,
  },
});

interface IncomingKnowledgeBaseItem {
  fileName?: unknown;
  text?: unknown;
}

/**
 * Accepts knowledge-base context supplied by the browser.
 *
 * This is client-controlled input, so it is re-validated and re-capped here.
 * The client enforcing a budget is a convenience; the server enforcing it is
 * what stops a crafted request from running up an unbounded model bill.
 */
function readKnowledgeBaseContext(raw: unknown): ParsedDocument[] {
  if (typeof raw !== "string" || !raw.trim()) {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Knowledge-base context was not valid JSON.");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Knowledge-base context must be an array.");
  }

  const documents: ParsedDocument[] = [];
  let runningTotal = 0;

  for (const entry of parsed.slice(0, serverConfig.maxKnowledgeBaseFiles)) {
    const item = entry as IncomingKnowledgeBaseItem;
    if (typeof item.text !== "string" || !item.text.trim()) {
      continue;
    }

    const remaining = Math.max(serverConfig.maxCombinedChars - runningTotal, 0);
    if (remaining === 0) {
      break;
    }

    const text = item.text.slice(0, remaining);
    runningTotal += text.length;

    documents.push({
      fileName: typeof item.fileName === "string" && item.fileName ? item.fileName : "Untitled document",
      mimeType: "text/plain",
      text,
      excerpt: "",
      truncated: text.length < item.text.length,
    });
  }

  return documents;
}

export const generateTestCasesRouter = Router();

generateTestCasesRouter.post(
  "/generate-test-cases",
  upload.single("prd"),
  async (request, response) => {
    try {
      const prdFile = request.file;
      if (!prdFile) {
        response.status(400).json({
          error: "A PRD file is required.",
        });
        return;
      }

      const parsedPrd = await parseUploadedDocument(prdFile);
      const knowledgeBaseDocs = readKnowledgeBaseContext(request.body?.knowledgeBase);

      const suite = await generateTestSuiteWithGemini(parsedPrd, knowledgeBaseDocs);

      response.json({
        suite,
        meta: {
          prdName: parsedPrd.fileName,
          prdExcerpt: parsedPrd.excerpt || "Preview unavailable in-browser for this file type.",
          prdTruncated: parsedPrd.truncated,
          generatedAt: new Date().toISOString(),
          modelName: serverConfig.geminiModel,
          promptVersion: PROMPT_VERSION,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected server error.";
      const lowered = message.toLowerCase();
      const statusCode =
        lowered.includes("unsupported") || lowered.includes("required") || lowered.includes("knowledge-base context")
          ? 400
          : 500;

      if (error instanceof GeminiGenerationError && error.causeDetails) {
        console.error("Gemini generation failure details:", JSON.stringify(error.causeDetails, null, 2));
      }

      response.status(statusCode).json({
        error: message,
      });
    }
  },
);
