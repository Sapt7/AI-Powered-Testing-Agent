import type { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { SignIn } from "@/components/SignIn";
import { BrandMark } from "@/components/tunnel/BrandMark";

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
      <div className="flex min-h-screen w-full items-center justify-center bg-graphite px-5">
        <div className="flex flex-col items-center gap-4" role="status">
          <BrandMark className="lamp-pulse h-10 w-10" />
          <p className="text-[13px] text-flow-2">Checking your session</p>
        </div>
      </div>
    );
  }

  if (status !== "signed-in") {
    return <SignIn />;
  }

  return <>{children}</>;
}
