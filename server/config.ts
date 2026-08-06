function numberFromEnv(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function listFromEnv(name: string) {
  return (process.env[name] ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export const serverConfig = {
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
  /*
   * Public value — it identifies the OAuth client, it does not authorize anything.
   * Used as the required `aud` claim when verifying inbound ID tokens.
   */
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  port: Number(process.env.PORT ?? 8787),

  /*
   * Browser origins allowed to call this API directly. Empty means "allow any",
   * which is right for local development and wrong for production.
   *
   * Note this is not a security control: CORS is enforced by browsers, so it does
   * nothing against a non-browser client. Authentication is what protects the API.
   */
  corsOrigins: listFromEnv("CORS_ORIGIN"),

  maxUploadSizeBytes: 15 * 1024 * 1024,
  maxKnowledgeBaseFiles: 10,
  /*
   * Raised from 18k. The old cap was ~4.5k tokens, which silently truncated any
   * real PRD. These are safety bounds against a pathological upload, not budgets:
   * the PRD is never truncated ahead of the knowledge base, and any truncation
   * that does happen is declared to the model so it can flag it in assumptions.
   */
  maxDocumentChars: 200_000,
  maxCombinedChars: 600_000,
  /*
   * Knowledge-base context arrives as a JSON form field. Multer's 1 MB default
   * field limit sits below the combined character budget once JSON escaping is
   * accounted for, so it is raised here with headroom.
   */
  maxKnowledgeBaseFieldBytes: 4 * 1024 * 1024,

  /*
   * Spend controls. Every value is env-overridable so the caps can be tuned on a
   * running deployment without a code change — the first thing you want when a
   * legitimate user hits a limit. See docs/decisions/0004-open-signup.md.
   */
  generationsPerUserPerHour: numberFromEnv("GENERATIONS_PER_USER_PER_HOUR", 5),
  generationsGlobalPerDay: numberFromEnv("GENERATIONS_GLOBAL_PER_DAY", 100),
  parsesPerUserPerHour: numberFromEnv("PARSES_PER_USER_PER_HOUR", 40),
};
