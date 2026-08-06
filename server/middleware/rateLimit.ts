import type { NextFunction, Request, Response } from "express";

/**
 * Spend controls for an openly-signup-able API backed by a paid model.
 *
 * Signup is open (docs/decisions/0004-open-signup.md), so authentication supplies
 * identity but not a spend ceiling — anyone can create a Google account. Two limits
 * therefore matter, and they protect different things:
 *
 *   - the per-user limit keeps one account from monopolising the service;
 *   - the global daily cap is the only thing standing between an abuse incident
 *     and an unbounded bill. It is the real protection.
 *
 * Counters live in process memory and reset on restart or spin-down, which on a
 * free host happens often. That is a known and accepted weakness: these limits are
 * a speed bump, and the billing budget alert on the Google Cloud project is the
 * backstop. Durable counters need the datastore v1 deliberately does not have.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

/*
 * Declared locally rather than relying on the ambient Express augmentation in
 * requireAuth.ts, so this module type-checks standalone — including from the
 * frontend test project, which does not load the server's global declarations.
 */
type RequestWithUser = Request & { user?: { sub: string } };

export interface QuotaOptions {
  /** Requests allowed per user within the window. */
  perUser: number;
  /** Window length in milliseconds. */
  windowMs: number;
  /** Requests allowed across all users per day. Omit for no global cap. */
  globalPerDay?: number;
  /** Shown to the user when the per-user limit is hit. */
  userMessage: string;
  /** Shown to the user when the global cap is hit. */
  globalMessage?: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function nextDailyReset(now: number) {
  // Fixed UTC day boundary, so the cap is predictable rather than rolling.
  return Math.floor(now / DAY_MS) * DAY_MS + DAY_MS;
}

export function createQuota(options: QuotaOptions) {
  const userBuckets = new Map<string, Bucket>();
  let globalBucket: Bucket = { count: 0, resetAt: nextDailyReset(Date.now()) };

  function sweep(now: number) {
    // Bounded memory: drop expired buckets rather than growing forever.
    for (const [key, bucket] of userBuckets) {
      if (bucket.resetAt <= now) {
        userBuckets.delete(key);
      }
    }
  }

  function middleware(request: Request, response: Response, next: NextFunction) {
    const key = (request as RequestWithUser).user?.sub;
    if (!key) {
      // Unreachable behind requireAuth; fail closed rather than unmetered.
      response.status(401).json({ error: "Sign in to continue." });
      return;
    }

    const now = Date.now();
    sweep(now);

    if (globalBucket.resetAt <= now) {
      globalBucket = { count: 0, resetAt: nextDailyReset(now) };
    }

    const userBucket = userBuckets.get(key);
    const activeUserBucket =
      userBucket && userBucket.resetAt > now
        ? userBucket
        : { count: 0, resetAt: now + options.windowMs };

    if (activeUserBucket.count >= options.perUser) {
      const retryAfter = Math.ceil((activeUserBucket.resetAt - now) / 1000);
      response.setHeader("Retry-After", String(retryAfter));
      response.status(429).json({ error: options.userMessage });
      return;
    }

    if (options.globalPerDay !== undefined && globalBucket.count >= options.globalPerDay) {
      const retryAfter = Math.ceil((globalBucket.resetAt - now) / 1000);
      response.setHeader("Retry-After", String(retryAfter));
      response.status(429).json({
        error:
          options.globalMessage ??
          "This service has reached its daily limit. Please try again tomorrow.",
      });
      return;
    }

    activeUserBucket.count += 1;
    userBuckets.set(key, activeUserBucket);
    globalBucket.count += 1;

    next();
  }

  /** Exposed for tests and for a future status endpoint. */
  middleware.inspect = () => ({
    users: userBuckets.size,
    globalCount: globalBucket.count,
    globalResetAt: globalBucket.resetAt,
  });

  return middleware;
}
