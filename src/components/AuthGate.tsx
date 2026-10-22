import type { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { SignIn } from "@/components/SignIn";
import { BrandMark } from "@/components/bench/ui";

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
      <div className="flex min-h-screen w-full items-center justify-center px-5">
        <div className="pop flex flex-col items-center gap-4" role="status">
          <BrandMark className="breathe h-11 w-11" />
          <p className="text-[13px] text-ink-3">Checking your session</p>
        </div>
      </div>
    );
  }

  if (status !== "signed-in") {
    return <SignIn />;
  }

  return <>{children}</>;
}
