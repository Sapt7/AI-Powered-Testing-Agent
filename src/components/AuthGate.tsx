import type { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { SignIn } from "@/components/SignIn";

/**
 * Gates the workspace behind a verified Google identity.
 *
 * This is a UX gate, not the security boundary — the API verifies every request
 * independently. Bypassing this component would show an empty shell, not data.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background px-5">
        <div className="text-center">
          <div aria-hidden className="mx-auto mb-4 h-px w-32 overflow-hidden bg-rule">
            <div className="h-px w-1/3 animate-[sheet-scan_1.4s_ease-in-out_infinite] bg-blue" />
          </div>
          <p className="text-[13px] text-ink-soft">Checking your session</p>
        </div>
      </div>
    );
  }

  if (status !== "signed-in") {
    return <SignIn />;
  }

  return <>{children}</>;
}
