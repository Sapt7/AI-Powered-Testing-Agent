import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { serverConfig } from "../config.js";

export interface ParsedDocument {
  fileName: string;
  mimeType: string;
  text: string;
  excerpt: string;
  /** True when `text` was cut at the character cap, so the model can declare it. */
  truncated: boolean;
}

function normalizeWhitespace(value: string) {
  return value.split("\0").join(" ").replace(/\s+/g, " ").trim();
}

function toExcerpt(value: string) {
  const normalized = normalizeWhitespace(value);
  return normalized.slice(0, 320);
}

function limitDocument(value: string) {
  return normalizeWhitespace(value).slice(0, serverConfig.maxDocumentChars);
}

function stripRtfSyntax(value: string) {
  return value
    .replace(/\\'[0-9a-fA-F]{2}/g, " ")
    .replace(/\\[a-z]+-?\d* ?/g, " ")
    .replace(/[{}]/g, " ");
}

async function parsePdf(buffer: Buffer) {
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();
  return result.text;
}

async function parseDocx(buffer: Buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

function parsePlainText(buffer: Buffer, fileName: string) {
  const raw = buffer.toString("utf8");
  if (fileName.toLowerCase().endsWith(".rtf")) {
    return stripRtfSyntax(raw);
  }

  return raw;
}

export async function parseUploadedDocument(file: Express.Multer.File): Promise<ParsedDocument> {
  const fileName = file.originalname;
  const lowerName = fileName.toLowerCase();
  const mimeType = file.mimetype.toLowerCase();

  let text = "";

  if (lowerName.endsWith(".pdf") || mimeType === "application/pdf") {
    text = await parsePdf(file.buffer);
  } else if (
    lowerName.endsWith(".docx") ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    text = await parseDocx(file.buffer);
  } else if (
    lowerName.endsWith(".txt") ||
    lowerName.endsWith(".md") ||
    lowerName.endsWith(".json") ||
    lowerName.endsWith(".csv") ||
    lowerName.endsWith(".rtf") ||
    mimeType.startsWith("text/")
  ) {
    text = parsePlainText(file.buffer, fileName);
  } else {
    throw new Error(`Unsupported document type for ${fileName}. Please upload PDF, DOCX, TXT, MD, CSV, JSON, or RTF.`);
  }

  const full = normalizeWhitespace(text);
  const normalized = limitDocument(text);

  if (!normalized) {
    throw new Error(`No readable text could be extracted from ${fileName}.`);
  }

  return {
    fileName,
    mimeType: file.mimetype,
    text: normalized,
    excerpt: toExcerpt(normalized),
    truncated: full.length > normalized.length,
  };
}
