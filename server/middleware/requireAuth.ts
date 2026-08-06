import type { NextFunction, Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { serverConfig } from "../config.js";

export interface AuthenticatedUser {
  /** Google's stable subject identifier. The only safe key for per-user data. */
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

const client = new OAuth2Client(serverConfig.googleClientId);

/**
 * Verifies a Google ID token on every protected request.
 *
 * `verifyIdToken` checks the signature against Google's rotating public keys and
 * validates `iss` and `exp`; passing `audience` makes it reject a token minted for
 * a different OAuth client. Never decode the JWT manually — an unverified payload
 * is attacker-controlled input.
 *
 * The API holds no sessions, so identity is re-derived from the token per request.
 * That is what keeps the backend stateless.
 */
export async function requireAuth(request: Request, response: Response, next: NextFunction) {
  if (!serverConfig.googleClientId) {
    console.error("GOOGLE_CLIENT_ID is not set; refusing to authenticate requests.");
    response.status(500).json({ error: "Authentication is not configured on the server." });
    return;
  }

  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    response.status(401).json({ error: "Sign in to continue." });
    return;
  }

  const idToken = header.slice("Bearer ".length).trim();
  if (!idToken) {
    response.status(401).json({ error: "Sign in to continue." });
    return;
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: serverConfig.googleClientId,
    });

    const payload = ticket.getPayload();
    if (!payload?.sub) {
      response.status(401).json({ error: "Your session is invalid. Sign in again." });
      return;
    }

    request.user = {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };

    next();
  } catch {
    // Covers expiry, bad signature, and wrong audience alike. Do not leak which.
    response.status(401).json({ error: "Your session has expired. Sign in again." });
  }
}
