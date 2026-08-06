import cors from "cors";
import express from "express";
import helmet from "helmet";
import { serverConfig } from "./config.js";
import { requireAuth } from "./middleware/requireAuth.js";
import { createQuota } from "./middleware/rateLimit.js";
import { generateTestCasesRouter } from "./routes/generateTestCases.js";
import { parseDocumentsRouter } from "./routes/parseDocuments.js";

const HOUR_MS = 60 * 60 * 1000;

export function createApp() {
  const app = express();

  // The API serves JSON to a separate origin; it renders no HTML of its own.
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));

  if (serverConfig.corsOrigins.length) {
    app.use(cors({ origin: serverConfig.corsOrigins }));
  } else {
    console.warn("CORS_ORIGIN is not set — allowing any origin. Set it in production.");
    app.use(cors());
  }

  app.use(express.json({ limit: "1mb" }));

  /*
   * Deliberately unauthenticated and unmetered: this is the warm-up target the
   * client pings on landing to start the host's cold start before the user signs
   * in. Requiring auth here would defeat it, since the ping happens before any
   * token exists. It exposes nothing but liveness.
   */
  app.get("/api/health", (_request, response) => {
    response.json({
      status: "ok",
    });
  });

  // Everything past this point requires a verified Google identity.
  app.use("/api", requireAuth);

  /*
   * Parsing is CPU- and memory-bound rather than paid, so it gets a looser limit
   * than generation — but it is still limited, because a large PDF is the most
   * likely way to exhaust a small instance.
   */
  const parseQuota = createQuota({
    perUser: serverConfig.parsesPerUserPerHour,
    windowMs: HOUR_MS,
    userMessage: "You have uploaded a lot of documents in a short time. Try again shortly.",
  });

  const generateQuota = createQuota({
    perUser: serverConfig.generationsPerUserPerHour,
    windowMs: HOUR_MS,
    globalPerDay: serverConfig.generationsGlobalPerDay,
    userMessage:
      "You have reached your hourly generation limit. Try again later, or reuse a previous run.",
    globalMessage:
      "This service has reached its daily generation limit. Please try again tomorrow.",
  });

  app.use("/api/parse", parseQuota);
  app.use("/api/generate-test-cases", generateQuota);

  app.use("/api", parseDocumentsRouter);
  app.use("/api", generateTestCasesRouter);

  return app;
}
