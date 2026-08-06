import { Router } from "express";
import multer from "multer";
import { serverConfig } from "../config.js";
import { parseUploadedDocument } from "../services/documentParser.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: serverConfig.maxUploadSizeBytes,
    files: serverConfig.maxKnowledgeBaseFiles,
  },
});

export const parseDocumentsRouter = Router();

/**
 * Extracts text from uploaded documents and hands it straight back.
 *
 * The server keeps nothing. The browser stores the returned text and sends it
 * back as context at generation time, which is what lets the API stay stateless
 * while the knowledge base still accumulates.
 * See docs/decisions/0001-browser-scoped-persistence.md.
 */
parseDocumentsRouter.post(
  "/parse",
  upload.array("documents", serverConfig.maxKnowledgeBaseFiles),
  async (request, response) => {
    try {
      const files = (request.files as Express.Multer.File[] | undefined) ?? [];
      if (!files.length) {
        response.status(400).json({ error: "At least one document is required." });
        return;
      }

      const documents = await Promise.all(
        files.map(async (file) => {
          const parsed = await parseUploadedDocument(file);
          return {
            fileName: parsed.fileName,
            text: parsed.text,
            excerpt: parsed.excerpt,
            truncated: parsed.truncated,
          };
        }),
      );

      response.json({ documents });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected server error.";
      response.status(400).json({ error: message });
    }
  },
);
