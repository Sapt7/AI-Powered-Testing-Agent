import { useEffect, useRef } from "react";
import { SquareStack } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function SignIn() {
  const { status, error, renderSignInButton } = useAuth();
  const buttonSlot = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (buttonSlot.current) {
      renderSignInButton(buttonSlot.current);
    }
  }, [renderSignInButton, status]);

  const unavailable = status === "unavailable";

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-5 py-10">
      <div className="sheet-in w-full max-w-[420px] rounded-lg border border-rule bg-paper shadow-sheet">
        <div className="border-b border-rule px-6 py-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-ink text-paper">
              <SquareStack className="h-3.5 w-3.5" strokeWidth={1.75} />
            </span>
            <h1 className="text-[17px] font-semibold leading-tight tracking-tight text-ink">
              Test Case Generator
            </h1>
          </div>
          <p className="mt-3 max-w-[52ch] text-[13px] leading-relaxed text-ink-soft">
            Turn a product requirements document into a reviewed QA coverage draft, grounded in
            your own retained product context.
          </p>
        </div>

        <div className="flex items-center gap-3 border-b border-rule px-6 py-3">
          <span aria-hidden className="h-2.5 w-[3px] rounded-sm bg-blue" />
          <span className="label-spec">Sign in</span>
        </div>

        <div className="px-6 py-6">
          {unavailable ? (
            <p className="text-[13px] leading-relaxed text-ink-soft">
              Sign-in is unavailable right now.{" "}
              {error ?? "The identity service could not be reached."}
            </p>
          ) : (
            <>
              <p className="mb-5 max-w-[52ch] text-[13px] leading-relaxed text-ink-soft">
                Continue with your Google account. We read your name and email address only, to
                identify your workspace.
              </p>

              <div ref={buttonSlot} className="flex min-h-[44px] justify-start" />

              {error ? (
                <p role="alert" className="mt-4 text-[12px] leading-relaxed text-destructive">
                  {error}
                </p>
              ) : null}
            </>
          )}
        </div>

        <div className="border-t border-rule bg-paper-sunk px-6 py-3.5">
          <p className="text-[12px] leading-relaxed text-ink-faint">
            Generated suites are first drafts for human review.
          </p>
        </div>
      </div>
    </div>
  );
}
