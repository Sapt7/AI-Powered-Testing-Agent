import { useEffect, useRef, useState } from "react";
import { ListChecks, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTunnelStatus } from "@/hooks/use-tunnel-status";
import type { Criticality } from "@/lib/testCaseTypes";
import { BrandMark, Flourish, Pill, SeverityTag, StatusPill, useGlidingSelection } from "@/components/bench/ui";

/** Illustrative only — labelled "Sample output" in the window. */
const SAMPLE: { title: string; area: string; level: Criticality; line: string }[] = [
  { title: "Duplicate payment is rejected", area: "Data", level: "High", line: "POST /payments twice with ref BD-0001 → 409" },
  { title: "Expired session cannot post", area: "Access", level: "High", line: "Sign out, replay request → 401, no ledger write" },
  { title: "Amount with 3 decimals fails", area: "Validation", level: "Medium", line: "Enter ₹1,240.005 → error PAY-102 shown" },
  { title: "Timeout mid-post leaves no partial", area: "Edge cases", level: "High", line: "Drop network at commit → balance unchanged" },
  { title: "Receipt email names the card", area: "Notifications", level: "Low", line: "Verify subject reads “Card •4821 paid”" },
];

export function SignIn() {
  const { status, error, renderSignInButton } = useAuth();
  const tunnel = useTunnelStatus();
  const buttonSlot = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const [active, setActive] = useState(0);
  const glide = useGlidingSelection(listRef, active);

  useEffect(() => {
    if (buttonSlot.current) renderSignInButton(buttonSlot.current);
  }, [renderSignInButton, status]);

  // The preview walks its own selection, like a list being reviewed.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setActive((i) => (i + 1) % SAMPLE.length), 2200);
    return () => window.clearInterval(timer);
  }, []);

  const unavailable = status === "unavailable";

  return (
    <div className="min-h-screen w-full">
      <header className="fade mx-auto flex max-w-[1120px] items-center gap-2.5 px-5 pt-5 md:px-6 md:pt-7">
        <BrandMark className="h-8 w-8" />
        <span className="text-[15px] font-semibold tracking-[-0.01em] text-ink">AI Powered Testing Agent</span>
        <span className="ml-auto hidden sm:block">
          <StatusPill status={tunnel} />
        </span>
      </header>

      <main className="mx-auto grid max-w-[1120px] items-center gap-12 px-5 pb-14 pt-10 md:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14 lg:pt-20">
        <div className="rise">
          <Pill>
            <span className="h-1.5 w-1.5 rounded-full bg-ok" />
            Free while in beta · PRD to QA coverage
          </Pill>
          <h1 className="font-display mt-6 text-balance text-[44px] font-bold leading-[1.02] tracking-[-0.04em] text-ink sm:text-[56px] lg:text-[72px]">
            Any PRD, one run <Flourish>away.</Flourish>
          </h1>
          <p className="mt-6 max-w-[46ch] text-[16px] leading-relaxed text-ink-2 md:text-[18px]">
            Stop rebuilding coverage plans by hand. Attach a PRD and get executable test cases across twelve
            coverage areas — grounded in your team's own references.
          </p>

          <div className="mt-8 max-w-[400px] rounded-2xl border hairline bg-window p-4 shadow-window">
            {unavailable ? (
              <p className="text-[14px] leading-relaxed text-ink-2">
                Sign-in is unavailable right now. {error ?? "The identity service could not be reached."}
              </p>
            ) : (
              <>
                <div ref={buttonSlot} className="flex min-h-[44px] justify-center" />
                {error ? (
                  <p role="alert" className="mt-3 text-[13px] leading-relaxed text-sev-high">
                    {error}
                  </p>
                ) : null}
              </>
            )}
            <p className="mt-3 text-center text-[12px] text-ink-3">We read your name and email only.</p>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Pill>
              <Lock className="h-3 w-3" strokeWidth={2.2} /> References stay in your browser
            </Pill>
            <Pill>
              <ShieldCheck className="h-3 w-3" strokeWidth={2.2} /> Drafts for human review
            </Pill>
          </div>
        </div>

        {/* Live preview */}
        <div className="rise relative" style={{ animationDelay: "120ms" }} aria-hidden>
          <div className="pointer-events-none absolute -inset-8 -z-10 rounded-[40px] bg-[radial-gradient(closest-side,hsl(var(--indigo)/0.14),transparent)]" />
          <div className="overflow-hidden rounded-2xl border hairline bg-window shadow-window lg:rotate-[0.6deg]">
            <div className="flex items-center gap-2 border-b hairline px-4 py-3">
              <Sparkles className="h-4 w-4 text-indigo" strokeWidth={2} />
              <span className="text-[13px] font-semibold text-ink">Payment Posting API</span>
              <span className="ml-auto rounded-md bg-window-sunk px-2 py-0.5 text-[11px] font-medium text-ink-3 ring-1 ring-ink/[0.06]">
                Sample output
              </span>
            </div>
            <div className="flex gap-2 border-b hairline px-4 py-2.5">
              {["All", "High", "Medium", "Low"].map((label, index) => (
                <span
                  key={label}
                  className={`rounded-md px-2.5 py-1 text-[12px] font-medium ${index === 0 ? "bg-window text-ink shadow-raised ring-1 ring-ink/[0.06]" : "text-ink-3"}`}
                >
                  {label}
                </span>
              ))}
              <span className="ml-auto flex items-center gap-1 text-[12px] text-ink-3">
                <ListChecks className="h-3.5 w-3.5" strokeWidth={2} /> 23 cases
              </span>
            </div>
            <ul ref={listRef} className="relative p-2.5">
              <li className="glide pointer-events-none absolute inset-x-2.5 top-0 rounded-xl bg-indigo shadow-select" style={glide} />
              {SAMPLE.map((row, index) => {
                const on = index === active;
                return (
                  <li
                    key={row.title}
                    data-selected={on}
                    className={`rise relative z-10 rounded-xl px-3.5 py-3 transition-colors duration-300 ${on ? "text-white" : "text-ink"}`}
                    style={{ animationDelay: `${200 + index * 70}ms` }}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="text-[14px] font-semibold">{row.title}</span>
                      <SeverityTag level={row.level} inverted={on} />
                    </span>
                    <span className={`font-mono-data mt-1 block truncate text-[12px] ${on ? "text-white/75" : "text-ink-3"}`}>
                      {row.line}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
