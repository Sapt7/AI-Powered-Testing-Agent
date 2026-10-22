import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { StreamlineField } from "@/components/tunnel/StreamlineField";
import { BrandMark } from "@/components/tunnel/BrandMark";
import { TunnelLamp } from "@/components/tunnel/primitives";
import { useTunnelStatus } from "@/hooks/use-tunnel-status";

const AREAS = [
  "Core flow",
  "Validation",
  "Access",
  "Data",
  "Integrations",
  "Edge cases",
  "Regression",
  "Notifications",
  "Analytics",
  "Accessibility",
  "Performance",
  "Security",
];

export function SignIn() {
  const { status, error, renderSignInButton } = useAuth();
  const tunnel = useTunnelStatus();
  const buttonSlot = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (buttonSlot.current) {
      renderSignInButton(buttonSlot.current);
    }
  }, [renderSignInButton, status]);

  const unavailable = status === "unavailable";

  return (
    <div className="grid min-h-screen w-full bg-graphite lg:grid-cols-[minmax(0,1.25fr)_minmax(420px,0.75fr)]">
      {/* The test section: the product's world, running before you sign in. */}
      <section className="relative flex min-h-[420px] flex-col overflow-hidden text-flow lg:min-h-screen">
        <StreamlineField mounted showBody density={34} className="absolute inset-0 h-full w-full" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_55%,transparent_30%,hsl(var(--graphite))_95%)]"
        />

        <div className="relative z-10 flex items-center gap-3 px-6 pt-6 md:px-10 md:pt-8">
          <BrandMark className="h-9 w-9" />
          <span className="placard text-flow-3">Test section 01</span>
          <span className="ml-auto">
            <TunnelLamp status={tunnel} />
          </span>
        </div>

        <div className="relative z-10 mt-auto px-6 pb-8 md:px-10 md:pb-12">
          <h1 className="w-ultra max-w-[12ch] text-[40px] font-extrabold leading-[0.9] tracking-[-0.04em] text-flow md:text-[72px]">
            AI Powered Testing Agent
          </h1>
          <p className="mt-5 max-w-[48ch] text-[16px] leading-relaxed text-flow-2">
            Mount a PRD, run it against your team's own references, and see where the coverage
            separates — across twelve areas, in minutes.
          </p>
          <ul className="mt-7 flex max-w-[640px] flex-wrap gap-1.5" aria-label="Coverage areas">
            {AREAS.map((area) => (
              <li
                key={area}
                className="placard rounded-sm border border-flow/15 bg-graphite/70 px-2 py-1.5 text-flow-2"
              >
                {area}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* The sign-in panel: daylight facility. */}
      <section className="facility-ground flex items-center justify-center px-6 py-12 md:px-12">
        <div className="enter w-full max-w-[380px]">
          <h2 className="w-expanded text-[28px] font-extrabold leading-tight tracking-[-0.02em] text-ink">
            Sign in to the facility
          </h2>
          <p className="mt-3 text-[14px] leading-relaxed text-ink-2">
            Continue with your Google account. We read your name and email address only, to keep
            your workspace yours.
          </p>

          <div className="mt-8 rounded-xl border border-line bg-panel p-5 shadow-panel">
            {unavailable ? (
              <p className="text-[14px] leading-relaxed text-ink-2">
                Sign-in is unavailable right now. {error ?? "The identity service could not be reached."}
              </p>
            ) : (
              <>
                <div ref={buttonSlot} className="flex min-h-[44px] justify-center" />
                {error ? (
                  <p role="alert" className="mt-4 text-[13px] leading-relaxed text-destructive">
                    {error}
                  </p>
                ) : null}
              </>
            )}
          </div>

          <dl className="mt-8 space-y-3 border-t border-line pt-6">
            {[
              ["Your references stay yours", "Knowledge-base text is kept in this browser, keyed to your account."],
              ["Drafts, not verdicts", "Every suite is a first draft for a tester to review."],
            ].map(([term, detail]) => (
              <div key={term}>
                <dt className="text-[13px] font-semibold text-ink">{term}</dt>
                <dd className="mt-0.5 text-[13px] leading-relaxed text-ink-3">{detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  );
}
