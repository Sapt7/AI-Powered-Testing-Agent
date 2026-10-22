import type { AreaReading } from "@/lib/coverage";

interface ManometerBoardProps {
  readings: AreaReading[];
  activeArea: string | null;
  onSelectArea: (areaId: string | null) => void;
}

const TUBE_HEIGHT = 156;

/**
 * A bank of manometer tubes — one per coverage area.
 *
 * Fluid height is the number of cases in that area; the fluid is stacked by
 * severity (red High at the bottom, amber Medium, blue Low on top). A dry tube is
 * a coverage area the run did not reach, which is the most useful thing on the
 * board: gaps are visible before a single case is read.
 *
 * Each tube is a toggle that filters the case list below it.
 */
export function ManometerBoard({ readings, activeArea, onSelectArea }: ManometerBoardProps) {
  const peak = Math.max(4, ...readings.map((reading) => reading.total));
  const gridLines = Array.from({ length: peak + 1 }, (_, index) => index);

  return (
    // min-w-0 lets the inner scroller engage instead of widening the parent grid.
    <div className="relative min-w-0">
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div
          role="group"
          aria-label="Coverage by area. Select a tube to filter the cases."
          className="relative grid min-w-[540px] gap-x-1.5"
          style={{ gridTemplateColumns: `repeat(${readings.length}, minmax(0, 1fr))` }}
        >
          {/* Graduations, drawn once behind the whole bank. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0"
            style={{ top: 22, height: TUBE_HEIGHT }}
          >
            {gridLines.map((line) => (
              <div
                key={line}
                className={`absolute inset-x-0 border-t ${
                  line % 2 === 0 ? "border-flow/[0.10]" : "border-flow/[0.04]"
                }`}
                style={{ bottom: `${(line / peak) * 100}%` }}
              />
            ))}
          </div>

          {readings.map((reading, index) => {
            const active = activeArea === reading.id;
            const dimmed = activeArea !== null && !active;
            const dry = reading.total === 0;
            const fill = (count: number) => `${(count / peak) * 100}%`;

            return (
              <button
                key={reading.id}
                type="button"
                onClick={() => onSelectArea(active ? null : reading.id)}
                aria-pressed={active}
                aria-label={
                  dry
                    ? `${reading.label}: no cases. Coverage gap.`
                    : `${reading.label}: ${reading.total} case${reading.total === 1 ? "" : "s"} — ${reading.high} high, ${reading.medium} medium, ${reading.low} low.`
                }
                className={`group relative flex flex-col items-center rounded-md pb-1 pt-0 outline-none transition-opacity duration-200 focus-visible:ring-2 focus-visible:ring-safety focus-visible:ring-offset-2 focus-visible:ring-offset-graphite ${
                  dimmed ? "opacity-35 hover:opacity-80" : "opacity-100"
                }`}
              >
                <span
                  className={`font-mono-data mb-1.5 h-4 text-[12px] font-medium leading-4 ${
                    dry ? "text-flow-3" : active ? "text-safety" : "text-flow"
                  }`}
                >
                  {reading.total}
                </span>

                {/* The glass. */}
                <span
                  className={`relative block w-full max-w-[34px] overflow-hidden rounded-t-full rounded-b-[10px] border bg-graphite/80 transition-colors ${
                    active
                      ? "border-safety/80"
                      : dry
                        ? "border-flow/[0.12] border-dashed"
                        : "border-flow/20 group-hover:border-flow/40"
                  }`}
                  style={{ height: TUBE_HEIGHT }}
                >
                  {/* The fluid column, stacked by severity, rising on arrival. */}
                  <span
                    className="fluid-rise absolute inset-x-0 bottom-0 flex flex-col-reverse"
                    style={{ height: fill(reading.total), animationDelay: `${index * 45}ms` }}
                  >
                    {reading.high ? (
                      <span className="block w-full bg-fluid-high" style={{ flexGrow: reading.high }} />
                    ) : null}
                    {reading.medium ? (
                      <span className="block w-full bg-fluid-med" style={{ flexGrow: reading.medium }} />
                    ) : null}
                    {reading.low ? (
                      <span className="block w-full bg-fluid-low" style={{ flexGrow: reading.low }} />
                    ) : null}
                  </span>
                  {/* Meniscus highlight on the column's surface. */}
                  {!dry ? (
                    <span
                      aria-hidden
                      className="fluid-rise absolute inset-x-[3px] h-[2px] rounded-full bg-white/50"
                      style={{ bottom: `calc(${fill(reading.total)} - 2px)`, animationDelay: `${index * 45}ms` }}
                    />
                  ) : null}
                  {/* Glass sheen. */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-2 left-[4px] w-[3px] rounded-full bg-white/[0.07]"
                  />
                </span>

                <span
                  className={`placard mt-2.5 h-[86px] [writing-mode:vertical-rl] rotate-180 text-left ${
                    active ? "text-safety" : dry ? "text-flow-3" : "text-flow-2"
                  }`}
                >
                  {reading.short}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-flow/10 pt-3">
        <Legend swatch="bg-fluid-high" label="High" />
        <Legend swatch="bg-fluid-med" label="Medium" />
        <Legend swatch="bg-fluid-low" label="Low" />
        <span className="flex items-center gap-2 text-[12px] text-flow-2">
          <span aria-hidden className="h-3 w-2.5 rounded-t-full rounded-b-sm border border-dashed border-flow/30" />
          Dry tube · coverage gap
        </span>
        {activeArea ? (
          <button
            type="button"
            onClick={() => onSelectArea(null)}
            className="ml-auto rounded-sm text-[12px] font-medium text-safety underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-safety"
          >
            Show all areas
          </button>
        ) : null}
      </div>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="flex items-center gap-2 text-[12px] text-flow-2">
      <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${swatch}`} />
      {label}
    </span>
  );
}
