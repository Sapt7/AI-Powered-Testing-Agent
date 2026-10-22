import type {
  GenerateTestCasesResponse,
  KnowledgeBaseContextItem,
  ParseDocumentsResponse,
  ParsedDocumentPayload,
} from "@/lib/workspaceTypes";
import { getStoredToken, notifyUnauthorized } from "@/lib/auth";

interface ErrorPayload {
  error?: string;
}

/*
 * Empty by default, which keeps every call same-origin and lets the Vercel
 * rewrite proxy /api/* to the backend — no CORS, no preflight. Set
 * VITE_API_BASE_URL only if you would rather call the backend directly, in
 * which case its CORS_ORIGIN must list this app's origin.
 */
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

function url(path: string) {
  return `${API_BASE_URL}${path}`;
}

function authHeaders(): HeadersInit {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Single entry point for API calls so the token, and the 401 response to a dead
 * one, are handled in exactly one place.
 */
async function request(path: string, init: RequestInit = {}): Promise<Response> {
  const response = await fetch(url(path), {
    ...init,
    headers: { ...authHeaders(), ...(init.headers ?? {}) },
  });

  if (response.status === 401) {
    notifyUnauthorized();
    const payload = (await response.json().catch(() => null)) as ErrorPayload | null;
    throw new Error(payload?.error ?? "Your session has expired. Sign in again.");
  }

  return response;
}

async function readError(response: Response, fallback: string): Promise<never> {
  const payload = (await response.json().catch(() => null)) as ErrorPayload | null;
  throw new Error(payload?.error ?? fallback);
}

/**
 * Extracts text from documents. The server keeps no copy — the caller is
 * responsible for storing what comes back.
 */
export async function parseDocuments(files: File[]): Promise<ParsedDocumentPayload[]> {
  const formData = new FormData();
  for (const file of files) {
    formData.append("documents", file);
  }

  const response = await request("/api/parse", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    await readError(response, "Failed to read the uploaded documents.");
  }

  const payload = (await response.json()) as ParseDocumentsResponse;
  return payload.documents;
}

export async function generateTestCases(
  prd: File,
  knowledgeBase: KnowledgeBaseContextItem[],
): Promise<GenerateTestCasesResponse> {
  const formData = new FormData();
  formData.append("prd", prd);

  // Sent as a JSON field alongside the file; the PRD still needs server-side parsing.
  if (knowledgeBase.length) {
    formData.append("knowledgeBase", JSON.stringify(knowledgeBase));
  }

  const response = await request("/api/generate-test-cases", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    await readError(response, "Failed to generate test cases.");
  }

  return (await response.json()) as GenerateTestCasesResponse;
}

/** Resolves true once the backend answers its health check, false on failure. */
export async function pingHealth(signal?: AbortSignal): Promise<boolean> {
  try {
    const response = await fetch(url("/api/health"), { cache: "no-store", signal });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Fire-and-forget wake-up for the backend. Never awaited on the render path and
 * never surfaces an error: on a cold host this request hangs for the duration of
 * the start-up, which is exactly the wait it exists to overlap with sign-in.
 */
export function warmUpBackend(): void {
  void fetch(url("/api/health"), { method: "GET", cache: "no-store" }).catch(() => {
    /* expected while the service is starting */
  });
}
