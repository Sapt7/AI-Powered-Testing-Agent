/**
 * Google Identity Services wrapper.
 *
 * The ID token is a signed JWT the backend verifies on every request, so there is
 * no session to keep in sync — the token *is* the session. Claims are read locally
 * only to render the signed-in user and to know when the token has expired; the
 * server never trusts anything decoded here.
 */

export interface AuthUser {
  sub: string;
  email: string;
  name: string;
  picture: string;
}

interface IdTokenClaims {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
  exp: number;
}

const TOKEN_KEY = "tcg.auth.idToken";
const GSI_SRC = "https://accounts.google.com/gsi/client";

/** Treat a token as expired slightly early so it can't die mid-request. */
const EXPIRY_SKEW_SECONDS = 60;

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

/** Fired when the API rejects our token, so the app can drop back to signed-out. */
export const UNAUTHORIZED_EVENT = "tcg:unauthorized";

let scriptPromise: Promise<void> | null = null;

export function loadGoogleIdentityServices(): Promise<void> {
  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise<void>((resolve, reject) => {
    if (typeof document === "undefined") {
      reject(new Error("Google Identity Services requires a browser."));
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Google sign-in.")));
      if (window.google?.accounts?.id) {
        resolve();
      }
      return;
    }

    const script = document.createElement("script");
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google sign-in."));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

function decodeClaims(token: string): IdTokenClaims | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) {
      return null;
    }

    // base64url → base64, then decode as UTF-8 so non-ASCII names survive.
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "="));
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);

    const claims = JSON.parse(json) as IdTokenClaims;
    return claims.sub && typeof claims.exp === "number" ? claims : null;
  } catch {
    return null;
  }
}

function isExpired(claims: IdTokenClaims) {
  return claims.exp - EXPIRY_SKEW_SECONDS <= Math.floor(Date.now() / 1000);
}

export function toAuthUser(claims: IdTokenClaims): AuthUser {
  return {
    sub: claims.sub,
    email: claims.email ?? "",
    name: claims.name ?? claims.email ?? "Signed in",
    picture: claims.picture ?? "",
  };
}

/** Returns the stored token only while it is still valid; clears it otherwise. */
export function getStoredToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const token = window.localStorage.getItem(TOKEN_KEY);
  if (!token) {
    return null;
  }

  const claims = decodeClaims(token);
  if (!claims || isExpired(claims)) {
    window.localStorage.removeItem(TOKEN_KEY);
    return null;
  }

  return token;
}

export function getStoredUser(): AuthUser | null {
  const token = getStoredToken();
  if (!token) {
    return null;
  }

  const claims = decodeClaims(token);
  return claims ? toAuthUser(claims) : null;
}

export function storeToken(token: string): AuthUser | null {
  const claims = decodeClaims(token);
  if (!claims || isExpired(claims)) {
    return null;
  }

  window.localStorage.setItem(TOKEN_KEY, token);
  return toAuthUser(claims);
}

export function clearToken() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(TOKEN_KEY);
  }
}

export function notifyUnauthorized() {
  clearToken();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  }
}

export function signOut() {
  clearToken();
  window.google?.accounts?.id?.disableAutoSelect();
}

/** Milliseconds until the stored token expires, floored at zero. */
export function millisecondsUntilExpiry(): number {
  const token = typeof window !== "undefined" ? window.localStorage.getItem(TOKEN_KEY) : null;
  const claims = token ? decodeClaims(token) : null;
  if (!claims) {
    return 0;
  }

  return Math.max((claims.exp - EXPIRY_SKEW_SECONDS) * 1000 - Date.now(), 0);
}
