import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  GOOGLE_CLIENT_ID,
  UNAUTHORIZED_EVENT,
  getStoredUser,
  loadGoogleIdentityServices,
  millisecondsUntilExpiry,
  signOut as clearGoogleSession,
  storeToken,
  type AuthUser,
} from "@/lib/auth";

type AuthStatus = "loading" | "signed-out" | "signed-in" | "unavailable";

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  error: string | null;
  /** Renders the Google button into a container the sign-in surface owns. */
  renderSignInButton: (container: HTMLElement) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);
  const pendingContainer = useRef<HTMLElement | null>(null);

  const handleCredential = useCallback((credential: string) => {
    const nextUser = storeToken(credential);
    if (!nextUser) {
      setError("That sign-in could not be verified. Try again.");
      setStatus("signed-out");
      return;
    }

    setError(null);
    setUser(nextUser);
    setStatus("signed-in");
  }, []);

  // Boot: restore an unexpired session, then initialize Google Identity Services.
  useEffect(() => {
    if (initialized.current) {
      return;
    }
    initialized.current = true;

    if (!GOOGLE_CLIENT_ID) {
      console.error("VITE_GOOGLE_CLIENT_ID is not set; sign-in cannot be offered.");
      setStatus("unavailable");
      return;
    }

    const restored = getStoredUser();
    if (restored) {
      setUser(restored);
      setStatus("signed-in");
    }

    let cancelled = false;

    loadGoogleIdentityServices()
      .then(() => {
        if (cancelled) {
          return;
        }

        window.google?.accounts?.id?.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => handleCredential(response.credential),
          auto_select: true,
          cancel_on_tap_outside: false,
          itp_support: true,
        });

        if (pendingContainer.current) {
          renderButtonInto(pendingContainer.current);
          pendingContainer.current = null;
        }

        setStatus((current) => (current === "signed-in" ? current : "signed-out"));
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        setError("Google sign-in could not be loaded. Check your connection and reload.");
        setStatus((current) => (current === "signed-in" ? current : "unavailable"));
      });

    return () => {
      cancelled = true;
    };
  }, [handleCredential]);

  // The API rejected our token; drop to signed-out rather than looping on 401s.
  useEffect(() => {
    function onUnauthorized() {
      setUser(null);
      setStatus("signed-out");
      setError("Your session expired. Sign in again to continue.");
    }

    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  // Expire the session in-app at the same moment the token dies, so the user is
  // told to sign in again rather than discovering it through a failed generation.
  useEffect(() => {
    if (status !== "signed-in") {
      return;
    }

    const remaining = millisecondsUntilExpiry();
    if (remaining <= 0) {
      setUser(null);
      setStatus("signed-out");
      return;
    }

    const timer = window.setTimeout(() => {
      setUser(null);
      setStatus("signed-out");
      setError("Your session expired. Sign in again to continue.");
    }, remaining);

    return () => window.clearTimeout(timer);
  }, [status]);

  function renderButtonInto(container: HTMLElement) {
    container.replaceChildren();
    window.google?.accounts?.id?.renderButton(container, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "continue_with",
      shape: "rectangular",
      logo_alignment: "center",
      width: 280,
    });
  }

  const renderSignInButton = useCallback((container: HTMLElement) => {
    if (window.google?.accounts?.id) {
      renderButtonInto(container);
      return;
    }
    // Script still loading — render as soon as it lands.
    pendingContainer.current = container;
  }, []);

  const handleSignOut = useCallback(() => {
    clearGoogleSession();
    setUser(null);
    setError(null);
    setStatus("signed-out");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, error, renderSignInButton, signOut: handleSignOut }),
    [status, user, error, renderSignInButton, handleSignOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider.");
  }
  return context;
}
