import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { createQuota } from "../../server/middleware/rateLimit.js";

function makeContext(sub: string | undefined) {
  const request = { user: sub ? { sub } : undefined } as unknown as Request;

  const response = {
    statusCode: 0,
    body: null as unknown,
    headers: {} as Record<string, string>,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
    setHeader(name: string, value: string) {
      this.headers[name] = value;
    },
  };

  const next = vi.fn() as unknown as NextFunction;
  return { request, response: response as unknown as Response & typeof response, next };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("createQuota", () => {
  it("allows requests up to the per-user limit", () => {
    const quota = createQuota({ perUser: 2, windowMs: 60_000, userMessage: "slow down" });

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const { request, response, next } = makeContext("user-a");
      quota(request, response, next);
      expect(next).toHaveBeenCalledOnce();
    }
  });

  it("rejects with 429 and Retry-After once the per-user limit is exceeded", () => {
    const quota = createQuota({ perUser: 1, windowMs: 60_000, userMessage: "slow down" });

    const first = makeContext("user-a");
    quota(first.request, first.response, first.next);

    const second = makeContext("user-a");
    quota(second.request, second.response, second.next);

    expect(second.next).not.toHaveBeenCalled();
    expect(second.response.statusCode).toBe(429);
    expect(second.response.body).toEqual({ error: "slow down" });
    expect(Number(second.response.headers["Retry-After"])).toBeGreaterThan(0);
  });

  it("meters each user separately", () => {
    const quota = createQuota({ perUser: 1, windowMs: 60_000, userMessage: "slow down" });

    const a = makeContext("user-a");
    quota(a.request, a.response, a.next);

    const b = makeContext("user-b");
    quota(b.request, b.response, b.next);

    expect(b.next).toHaveBeenCalledOnce();
    expect(b.response.statusCode).toBe(0);
  });

  it("lets a user through again once their window has passed", () => {
    const quota = createQuota({ perUser: 1, windowMs: 60_000, userMessage: "slow down" });

    const first = makeContext("user-a");
    quota(first.request, first.response, first.next);

    vi.advanceTimersByTime(60_001);

    const later = makeContext("user-a");
    quota(later.request, later.response, later.next);
    expect(later.next).toHaveBeenCalledOnce();
  });

  it("enforces the global daily cap across different users", () => {
    const quota = createQuota({
      perUser: 10,
      windowMs: 60_000,
      globalPerDay: 2,
      userMessage: "slow down",
      globalMessage: "daily limit reached",
    });

    for (const sub of ["user-a", "user-b"]) {
      const context = makeContext(sub);
      quota(context.request, context.response, context.next);
      expect(context.next).toHaveBeenCalledOnce();
    }

    const blocked = makeContext("user-c");
    quota(blocked.request, blocked.response, blocked.next);

    expect(blocked.next).not.toHaveBeenCalled();
    expect(blocked.response.statusCode).toBe(429);
    expect(blocked.response.body).toEqual({ error: "daily limit reached" });
  });

  it("fails closed when no identity is present", () => {
    const quota = createQuota({ perUser: 5, windowMs: 60_000, userMessage: "slow down" });

    const { request, response, next } = makeContext(undefined);
    quota(request, response, next);

    expect(next).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(401);
  });

  it("does not retain buckets for users whose window has expired", () => {
    const quota = createQuota({ perUser: 1, windowMs: 1_000, userMessage: "slow down" });

    const first = makeContext("user-a");
    quota(first.request, first.response, first.next);
    expect(quota.inspect().users).toBe(1);

    vi.advanceTimersByTime(2_000);

    const other = makeContext("user-b");
    quota(other.request, other.response, other.next);

    // user-a's expired bucket was swept rather than accumulating forever.
    expect(quota.inspect().users).toBe(1);
  });
});
