import type { ReactNode } from "react";
import type { Criticality } from "@/lib/testCaseTypes";
import type { TunnelStatus } from "@/hooks/use-tunnel-status";

/**
 * A graphite test-section window. The top bar is instrument chrome — a placard
 * naming the section plus live readouts — separated from the content by a rule.
 * It is not a kicker above a heading.
 */
export function TestWindow({
  placard,
  readouts,
  children,
  className = "",
  bodyClassName = "",
}: {
  placard: string;
  readouts?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={`enter relative overflow-hidden rounded-2xl border border-graphite-line bg-graphite text-flow shadow-window ${className}`}
    >
      <div className="relative z-10 flex min-h-11 items-center gap-4 border-b border-flow/[0.08] px-5">
        <span className="placard text-flow-3">{placard}</span>
        {readouts ? (
          <div className="ml-auto flex items-center gap-4 text-[12px] text-flow-2">{readouts}</div>
        ) : null}
      </div>
      <div className={`relative ${bodyClassName}`}>{children}</div>
    </section>
  );
}

/** A daylight working panel on the facility ground. */
export function Panel({
  placard,
  action,
  children,
  className = "",
}: {
  placard?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`enter overflow-hidden rounded-xl border border-line bg-panel shadow-panel ${className}`}
    >
      {placard ? (
        <div className="flex min-h-11 items-center gap-3 border-b border-line px-5">
          <span className="placard text-ink-3">{placard}</span>
          {action ? <div className="ml-auto flex items-center gap-2">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

const LAMP: Record<TunnelStatus, { dot: string; label: string; pulse: boolean }> = {
  checking: { dot: "bg-flow-3", label: "Checking tunnel", pulse: true },
  waking: { dot: "bg-safety", label: "Tunnel spinning up", pulse: true },
  online: { dot: "bg-[hsl(146_62%_46%)]", label: "Tunnel online", pulse: false },
  offline: { dot: "bg-fluid-high", label: "Tunnel unreachable", pulse: false },
};

/** Facility status lamp for the backend's cold-start state. */
export function TunnelLamp({ status, tone = "dark" }: { status: TunnelStatus; tone?: "dark" | "light" }) {
  const lamp = LAMP[status];
  return (
    <span
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-2 text-[12px] ${tone === "dark" ? "text-flow-2" : "text-ink-2"}`}
    >
      <span className="relative flex h-2 w-2">
        <span className={`h-2 w-2 rounded-full ${lamp.dot} ${lamp.pulse ? "lamp-pulse" : ""}`} />
        {status === "online" ? (
          <span
            aria-hidden
            className="absolute -inset-1 rounded-full bg-[hsl(146_62%_46%/0.25)] blur-[3px]"
          />
        ) : null}
      </span>
      {lamp.label}
    </span>
  );
}

const SEVERITY: Record<
  Criticality,
  { fluid: string; text: string; textOnDark: string; fill: number }
> = {
  High: { fluid: "bg-fluid-high", text: "text-fluid-high-text", textOnDark: "text-[hsl(6_90%_72%)]", fill: 1 },
  Medium: { fluid: "bg-fluid-med", text: "text-fluid-med-text", textOnDark: "text-[hsl(38_95%_68%)]", fill: 0.62 },
  Low: { fluid: "bg-fluid-low", text: "text-fluid-low-text", textOnDark: "text-[hsl(211_90%_76%)]", fill: 0.3 },
};

/**
 * Severity as a miniature manometer vial: hue names the level, fill height
 * repeats it — so the mark still reads in greyscale and to colour-blind users.
 */
export function SeverityMark({
  level,
  tone = "light",
  showLabel = true,
}: {
  level: Criticality;
  tone?: "light" | "dark";
  showLabel?: boolean;
}) {
  const severity = SEVERITY[level];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden
        className={`relative h-3.5 w-2 overflow-hidden rounded-t-full rounded-b-[3px] border ${
          tone === "dark" ? "border-flow/30 bg-graphite" : "border-ink/25 bg-panel"
        }`}
      >
        <span
          className={`absolute inset-x-0 bottom-0 ${severity.fluid}`}
          style={{ height: `${severity.fill * 100}%` }}
        />
      </span>
      {showLabel ? (
        <span
          className={`w-semi-condensed text-[11px] font-semibold uppercase tracking-[0.05em] ${
            tone === "dark" ? severity.textOnDark : severity.text
          }`}
        >
          {level}
        </span>
      ) : (
        <span className="sr-only">{level} severity</span>
      )}
    </span>
  );
}
