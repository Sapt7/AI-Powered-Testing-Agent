import { useMemo } from "react";

interface StreamlineFieldProps {
  /** A PRD is mounted at the centre; streamlines deflect around it. */
  mounted?: boolean;
  /** A generation is in progress; the flow runs faster and denser. */
  running?: boolean;
  /** Number of streamlines. */
  density?: number;
  /** Draw the bluff body itself (used where no PRD card sits on top). */
  showBody?: boolean;
  className?: string;
}

const W = 1200;
const H = 420;
const CX = W / 2;
const CY = H / 2;

/**
 * Smoke-rake streamlines in a wind-tunnel test section.
 *
 * Each line is sampled across the section and pushed away from the model with a
 * Gaussian deflection that decays with distance from the centreline — a cheap
 * approximation of potential flow around a bluff body. Behind the model, lines
 * close to the centreline pick up a decaying oscillation: the wake. When nothing
 * is mounted the flow is nearly laminar.
 *
 * Purely decorative to assistive tech; the surrounding surface carries the meaning.
 */
export function StreamlineField({
  mounted = false,
  running = false,
  density = 26,
  showBody = false,
  className = "",
}: StreamlineFieldProps) {
  const lines = useMemo(() => {
    const result: { d: string; dur: number; dash: string; opacity: number; width: number; delay: number }[] = [];
    const rx = 190;
    const ry = 78;
    const sigma = 150;
    const steps = 72;

    for (let i = 0; i < density; i += 1) {
      const t = (i + 0.5) / density;
      const y0 = 18 + t * (H - 36);
      const dy = y0 - CY;
      const side = Math.abs(dy) < 0.5 ? (i % 2 === 0 ? 1 : -1) : Math.sign(dy);
      const nearness = Math.exp(-Math.abs(dy) / (ry * 1.45));

      const points: string[] = [];
      for (let s = 0; s <= steps; s += 1) {
        const x = (s / steps) * W;
        const dx = x - CX;
        let y = y0;

        if (mounted) {
          // Smooth displacement around the body: dy' = sign * sqrt(dy^2 + H^2 * g(dx)).
          // Continuous everywhere, parts the centreline cleanly, and decays as
          // H^2 g / 2|dy| for distant lines — no kinks where lines meet the body.
          const g = Math.exp(-(dx * dx) / (2 * sigma * sigma));
          const H = ry * 1.18;
          y = CY + side * Math.sqrt(dy * dy + H * H * g);

          // Wake: a decaying oscillation downstream, strongest near the centreline.
          if (dx > rx * 0.5) {
            const downstream = (dx - rx * 0.5) / (W - CX);
            const amp = 12 * nearness * Math.exp(-downstream * 2.4) * Math.min(1, (dx - rx * 0.5) / 120);
            y += amp * Math.sin(dx / 38 + i * 0.9);
          }
        } else {
          // Near-laminar: a whisper of undulation so the field reads as air, not ruling.
          y += 2.2 * Math.sin(x / 140 + i * 1.7);
        }

        points.push(`${s === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`);
      }

      const seed = (i * 37) % 11;
      // Every dash period is exactly 200 so the -400 keyframe offset loops seamlessly.
      const dashLength = 46 + seed * 6;
      result.push({
        d: points.join(" "),
        dur: 11 + seed * 0.9,
        dash: `${dashLength} ${200 - dashLength}`,
        opacity: 0.18 + nearness * 0.5,
        width: 0.8 + nearness * 0.7,
        // Golden-ratio phase spread: pulses scatter instead of lining up in columns.
        delay: -(((i * 0.618034) % 1) * (11 + seed * 0.9)),
      });
    }

    return result;
  }, [mounted, density]);

  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={className}
      style={{ ["--flow-speed" as string]: running ? 3.2 : 1 }}
    >
      <defs>
        <linearGradient id="stream-fade" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="hsl(var(--flow))" stopOpacity="0" />
          <stop offset="0.08" stopColor="hsl(var(--flow))" stopOpacity="1" />
          <stop offset="0.92" stopColor="hsl(var(--flow))" stopOpacity="1" />
          <stop offset="1" stopColor="hsl(var(--flow))" stopOpacity="0" />
        </linearGradient>
      </defs>
      {showBody ? (
        <ellipse
          cx={CX}
          cy={CY}
          rx={150}
          ry={58}
          fill="hsl(var(--graphite-3))"
          stroke="hsl(var(--flow) / 0.22)"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      {/* Static guide: the time-averaged field, faint. */}
      <g stroke="url(#stream-fade)" fill="none">
        {lines.map((line, index) => (
          <path
            key={`base-${index}`}
            d={line.d}
            strokeWidth={line.width * 0.6}
            strokeOpacity={line.opacity * 0.35}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>
      {/* Moving smoke pulses riding the same paths. */}
      <g stroke="url(#stream-fade)" fill="none" strokeLinecap="round">
        {lines.map((line, index) => (
          <path
            key={`pulse-${index}`}
            className="streamline"
            d={line.d}
            strokeWidth={line.width}
            strokeOpacity={Math.min(1, line.opacity * (running ? 1.5 : mounted ? 1.15 : 0.7))}
            strokeDasharray={line.dash}
            vectorEffect="non-scaling-stroke"
            style={{ ["--dur" as string]: `${line.dur}s`, animationDelay: `${line.delay}s` }}
          />
        ))}
      </g>
    </svg>
  );
}
