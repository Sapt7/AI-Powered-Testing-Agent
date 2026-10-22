import { useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import type { Criticality } from "@/lib/testCaseTypes";
import type { TunnelStatus } from "@/hooks/use-tunnel-status";

/** A floating white app window. The bar is chrome: a title plus optional controls. */
export function Window({
  title,
  icon,
  controls,
  children,
  className = "",
  bodyClassName = "",
  style,
}: {
  title?: ReactNode;
  icon?: ReactNode;
  controls?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  style?: CSSProperties;
}) {
  return (
    <section
      style={style}
      className={`rise overflow-hidden rounded-2xl border hairline bg-window shadow-window ${className}`}
    >
      {title ? (
        <header className="flex min-h-12 items-center gap-2.5 border-b hairline px-4">
          {icon ? <span className="text-indigo">{icon}</span> : null}
          <span className="truncate text-[13px] font-semibold text-ink">{title}</span>
          {controls ? <div className="ml-auto flex shrink-0 items-center gap-2">{controls}</div> : null}
        </header>
      ) : null}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

/** A small rounded pill — status, metadata, or a filter. */
export function Pill({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border hairline bg-window/80 px-2.5 py-1 text-[12px] text-ink-2 shadow-raised ${className}`}
    >
      {children}
    </span>
  );
}

/** A keycap. Only ever shown for shortcuts that actually work. */
export function Kbd({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={`font-mono-data inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] border hairline-strong bg-window px-1 text-[11px] font-medium text-ink-2 shadow-[inset_0_-1px_0_hsl(var(--hairline-strong))] ${className}`}
    >
      {children}
    </kbd>
  );
}

const STATUS: Record<TunnelStatus, { dot: string; label: string; live: boolean }> = {
  checking: { dot: "bg-ink-3", label: "Connecting", live: true },
  waking: { dot: "bg-sev-med", label: "Server waking up", live: true },
  online: { dot: "bg-ok", label: "Server online", live: false },
  offline: { dot: "bg-sev-high", label: "Server unreachable", live: false },
};

/** The backend's real state. The free host sleeps; this makes the wake-up visible. */
export function StatusPill({ status }: { status: TunnelStatus }) {
  const s = STATUS[status];
  return (
    <Pill>
      <span role="status" aria-live="polite" className="inline-flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full ${s.dot} ${s.live ? "breathe" : ""}`} />
        {s.label}
      </span>
    </Pill>
  );
}

const SEVERITY: Record<Criticality, { text: string; bg: string; dot: string }> = {
  High: { text: "text-sev-high", bg: "bg-sev-high-bg", dot: "bg-sev-high" },
  Medium: { text: "text-sev-med", bg: "bg-sev-med-bg", dot: "bg-sev-med" },
  Low: { text: "text-sev-low", bg: "bg-sev-low-bg", dot: "bg-sev-low" },
};

/** Severity tag. On a selected (indigo) row it inverts to white. */
export function SeverityTag({ level, inverted = false }: { level: Criticality; inverted?: boolean }) {
  const s = SEVERITY[level];
  if (inverted) {
    return (
      <span className="inline-flex items-center gap-1 rounded-[5px] bg-white/15 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-white">
        <span className="h-1.5 w-1.5 rounded-full bg-white" />
        {level}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-[5px] px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.04em] ${s.bg} ${s.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {level}
    </span>
  );
}

/**
 * The hand-drawn underline. Drawn once on arrival — the page's one flourish,
 * under the one word that carries the promise.
 */
export function Flourish({ children }: { children: ReactNode }) {
  return (
    <span className="relative inline-block whitespace-nowrap">
      {children}
      <svg
        aria-hidden
        viewBox="0 0 220 18"
        preserveAspectRatio="none"
        className="pointer-events-none absolute -bottom-[0.14em] left-[-2%] h-[0.32em] w-[104%] overflow-visible"
      >
        <path
          className="draw"
          pathLength={1}
          d="M2 12 C 40 4, 92 3, 128 7 S 196 15, 218 6"
          fill="none"
          stroke="hsl(var(--indigo))"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

/** Product mark: a checked test row on an indigo tile. */
export function BrandMark({ className = "h-7 w-7" }: { className?: string }) {
  // Unique per instance: a shared id breaks when the first copy sits in a hidden
  // (display:none) subtree, which is exactly what the responsive nav does.
  const gradientId = `bm-${useId().replace(/:/g, "")}`;
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="hsl(237 60% 54%)" />
          <stop offset="1" stopColor="hsl(237 55% 33%)" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={`url(#${gradientId})`} />
      <path d="M8.5 16.5 l3.4 3.4 6.6-7.6" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 13h3.5M21 19h3.5" stroke="#fff" strokeOpacity="0.6" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * A selection highlight that glides between rows instead of jumping —
 * the native list behaviour. Returns a style for an absolutely positioned
 * indicator inside `containerRef`, tracking the row marked data-selected.
 */
export function useGlidingSelection(
  containerRef: RefObject<HTMLElement>,
  dependency: unknown,
): CSSProperties {
  const [box, setBox] = useState<{ top: number; height: number } | null>(null);
  const measured = useRef(false);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function measure() {
      const selected = container?.querySelector<HTMLElement>("[data-selected='true']");
      if (!selected || !container) {
        setBox(null);
        return;
      }
      setBox({ top: selected.offsetTop, height: selected.offsetHeight });
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef, dependency]);

  if (!box) return { opacity: 0 };
  const style: CSSProperties = {
    transform: `translateY(${box.top}px)`,
    height: box.height,
    opacity: 1,
    // Skip the glide on first placement so it doesn't fly in from the top.
    transition: measured.current ? undefined : "none",
  };
  measured.current = true;
  return style;
}
