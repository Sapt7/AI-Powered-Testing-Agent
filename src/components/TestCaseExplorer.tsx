import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, BookOpenText, Check, Compass, ListChecks } from "lucide-react";
import type { Criticality, GeneratedSuite } from "@/lib/testCaseTypes";
import { areaOf, readAreas, shortLabelFor } from "@/lib/coverage";
import { Kbd, Pill, SeverityTag, Window, useGlidingSelection } from "@/components/bench/ui";

interface TestCaseExplorerProps {
  suite: GeneratedSuite;
  documentName: string;
  generatedAt: string | null;
}

type SeverityFilter = "All" | Criticality;
const SEVERITY_FILTERS: SeverityFilter[] = ["All", "High", "Medium", "Low"];

export function TestCaseExplorer({ suite, documentName, generatedAt }: TestCaseExplorerProps) {
  const [activeArea, setActiveArea] = useState<string | null>(null);
  const [severity, setSeverity] = useState<SeverityFilter>("All");
  const [selectedCaseId, setSelectedCaseId] = useState(suite.cases[0]?.id ?? "");
  const [sheetOpen, setSheetOpen] = useState(false);
  const listRef = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    setActiveArea(null);
    setSeverity("All");
    setSelectedCaseId(suite.cases[0]?.id ?? "");
  }, [suite]);

  const readings = useMemo(() => readAreas(suite.cases), [suite]);
  const gaps = readings.filter((reading) => reading.total === 0 && reading.id !== "__other__");
  const highCount = suite.cases.filter((testCase) => testCase.criticality === "High").length;

  const visibleCases = useMemo(
    () =>
      suite.cases
        .map((testCase, index) => ({ testCase, number: index + 1 }))
        .filter(({ testCase }) => (activeArea ? areaOf(testCase) === activeArea : true))
        .filter(({ testCase }) => (severity === "All" ? true : testCase.criticality === severity)),
    [suite, activeArea, severity],
  );

  useEffect(() => {
    if (!visibleCases.some(({ testCase }) => testCase.id === selectedCaseId)) {
      setSelectedCaseId(visibleCases[0]?.testCase.id ?? "");
    }
  }, [visibleCases, selectedCaseId]);

  const selectedIndex = visibleCases.findIndex(({ testCase }) => testCase.id === selectedCaseId);
  const selected = visibleCases[selectedIndex] ?? visibleCases[0];
  const glide = useGlidingSelection(listRef, `${selectedCaseId}|${activeArea}|${severity}|${visibleCases.length}`);

  // ↑/↓ and j/k move through cases, as in any native list.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && /INPUT|TEXTAREA|SELECT/.test(target.tagName)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const delta = event.key === "ArrowDown" || event.key === "j" ? 1 : event.key === "ArrowUp" || event.key === "k" ? -1 : 0;
      if (!delta || !visibleCases.length) return;
      event.preventDefault();
      const next = Math.min(visibleCases.length - 1, Math.max(0, (selectedIndex < 0 ? 0 : selectedIndex) + delta));
      setSelectedCaseId(visibleCases[next].testCase.id);
      listRef.current
        ?.querySelector<HTMLElement>(`[data-case-id="${visibleCases[next].testCase.id}"]`)
        ?.scrollIntoView({ block: "nearest" });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visibleCases, selectedIndex]);

  // Lock page scroll while the phone sheet is open.
  useEffect(() => {
    if (!sheetOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSheetOpen(false);
    };
    window.addEventListener("keydown", onEscape);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onEscape);
    };
  }, [sheetOpen]);

  function openCase(id: string) {
    setSelectedCaseId(id);
    if (window.matchMedia("(max-width: 1023px)").matches) setSheetOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="rise space-y-4">
        <h1 className="font-display text-balance text-[32px] font-bold leading-[1.05] tracking-[-0.025em] text-ink md:text-[44px]">
          {suite.featureName}
        </h1>
        <p className="max-w-[68ch] text-[15px] leading-relaxed text-ink-2">{suite.shortSummary}</p>
        <div className="flex flex-wrap gap-2">
          <Pill>
            <ListChecks className="h-3.5 w-3.5 text-indigo" strokeWidth={2} />
            <span className="font-mono-data text-ink">{suite.cases.length}</span> cases
          </Pill>
          <Pill>
            <span className="h-1.5 w-1.5 rounded-full bg-sev-high" />
            <span className="font-mono-data text-ink">{highCount}</span> high
          </Pill>
          <Pill className={gaps.length ? "border-sev-med/30 text-sev-med" : ""}>
            <span className="font-mono-data">{gaps.length}</span> coverage {gaps.length === 1 ? "gap" : "gaps"}
          </Pill>
          <Pill className="max-w-full">
            <span className="truncate">{documentName}</span>
          </Pill>
          {generatedAt ? (
            <Pill>
              <span className="font-mono-data">{new Date(generatedAt).toLocaleDateString()}</span>
            </Pill>
          ) : null}
        </div>
      </header>

      {/* The library window */}
      <Window
        title="Coverage"
        icon={<ListChecks className="h-4 w-4" strokeWidth={2} />}
        controls={
          <>
            <span className="hidden items-center gap-1 text-[12px] text-ink-3 lg:flex">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
              <span className="ml-1">to move</span>
            </span>
            <div role="radiogroup" aria-label="Filter by severity" className="flex rounded-lg bg-window-sunk p-0.5 ring-1 ring-ink/[0.06]">
              {SEVERITY_FILTERS.map((option) => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={severity === option}
                  onClick={() => setSeverity(option)}
                  className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo ${
                    severity === option ? "bg-window text-ink shadow-raised" : "text-ink-3 hover:text-ink"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </>
        }
        style={{ animationDelay: "80ms" }}
      >
        {/* Phone: areas as a horizontal chip rail */}
        <div className="flex gap-2 overflow-x-auto border-b hairline px-4 py-3 lg:hidden [scrollbar-width:none]">
          <AreaChip label="All areas" count={suite.cases.length} active={!activeArea} onClick={() => setActiveArea(null)} />
          {readings.map((reading) => (
            <AreaChip
              key={reading.id}
              label={reading.short}
              count={reading.total}
              active={activeArea === reading.id}
              gap={reading.total === 0}
              onClick={() => setActiveArea(activeArea === reading.id ? null : reading.id)}
            />
          ))}
        </div>

        <div className="grid lg:grid-cols-[220px_minmax(0,1fr)_minmax(0,1.15fr)]">
          {/* Desktop: area sidebar */}
          <aside className="hidden border-r hairline bg-window-sunk/60 p-2.5 lg:block">
            <p className="px-2 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">Areas</p>
            <AreaRow label="All areas" count={suite.cases.length} active={!activeArea} onClick={() => setActiveArea(null)} />
            {readings.map((reading) => (
              <AreaRow
                key={reading.id}
                label={reading.short}
                count={reading.total}
                high={reading.high}
                active={activeArea === reading.id}
                gap={reading.total === 0}
                onClick={() => setActiveArea(activeArea === reading.id ? null : reading.id)}
              />
            ))}
          </aside>

          {/* Case list with a gliding selection */}
          <div className="min-w-0 lg:max-h-[640px] lg:overflow-y-auto lg:border-r lg:hairline">
            {visibleCases.length ? (
              <ul ref={listRef} className="relative p-2.5" aria-label="Test cases">
                <li aria-hidden className="glide pointer-events-none absolute inset-x-2.5 top-0 rounded-xl bg-indigo shadow-select" style={glide} />
                {visibleCases.map(({ testCase, number }, index) => {
                  const active = selected?.testCase.id === testCase.id;
                  return (
                    <li
                      key={testCase.id}
                      data-case-id={testCase.id}
                      data-selected={active}
                      className="rise relative"
                      style={{ animationDelay: `${Math.min(index, 12) * 28}ms` }}
                    >
                      <button
                        onClick={() => openCase(testCase.id)}
                        aria-current={active ? "true" : undefined}
                        className={`relative z-10 w-full rounded-xl px-3.5 py-3 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo ${
                          active ? "text-white" : "hover:bg-ink/[0.035]"
                        }`}
                      >
                        <span className="flex items-start justify-between gap-3">
                          <span className="text-[14px] font-semibold leading-snug">{testCase.title}</span>
                          <span
                            className={`font-mono-data mt-0.5 shrink-0 text-[11px] ${active ? "text-white/70" : "text-ink-3"}`}
                          >
                            TC-{String(number).padStart(3, "0")}
                          </span>
                        </span>
                        <span className="mt-2 flex flex-wrap items-center gap-2">
                          <SeverityTag level={testCase.criticality} inverted={active} />
                          <span className={`text-[12px] ${active ? "text-white/80" : "text-ink-3"}`}>
                            {shortLabelFor(areaOf(testCase))}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="px-6 py-16 text-center">
                <p className="text-[14px] font-semibold text-ink">No cases match</p>
                <p className="mx-auto mt-1.5 max-w-[40ch] text-[13px] text-ink-3">
                  {activeArea && readings.find((r) => r.id === activeArea)?.total === 0
                    ? `The run produced nothing for ${shortLabelFor(activeArea)} — a coverage gap worth checking by hand.`
                    : "Try another severity or area."}
                </p>
                <button
                  onClick={() => {
                    setActiveArea(null);
                    setSeverity("All");
                  }}
                  className="mt-4 text-[13px] font-semibold text-indigo hover:underline"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>

          {/* Desktop detail pane */}
          <div className="hidden min-w-0 lg:block lg:max-h-[640px] lg:overflow-y-auto">
            {selected ? <CaseDetail key={selected.testCase.id} testCase={selected.testCase} number={selected.number} /> : null}
          </div>
        </div>
      </Window>

      {/* Evidence */}
      <div className="grid gap-4 md:grid-cols-3">
        <EvidenceCard title="Risk scan" icon={AlertTriangle} items={suite.risks} delay={140} />
        <EvidenceCard title="Source context" icon={BookOpenText} items={suite.sourceHighlights} delay={190} />
        <EvidenceCard title="Assumptions" icon={Compass} items={suite.assumptions} delay={240} />
      </div>

      {/* Phone detail sheet */}
      {sheetOpen && selected ? (
        <div role="dialog" aria-modal="true" aria-label={selected.testCase.title} className="fixed inset-0 z-50 lg:hidden">
          <div className="fade absolute inset-0 bg-ink/30" onClick={() => setSheetOpen(false)} />
          <div className="pop absolute inset-x-0 bottom-0 top-10 flex flex-col overflow-hidden rounded-t-3xl bg-window shadow-window">
            <div className="flex items-center gap-2 border-b hairline px-3 py-2">
              <button
                onClick={() => setSheetOpen(false)}
                className="flex h-10 items-center gap-1 rounded-xl px-2 text-[15px] font-medium text-indigo active:bg-indigo-soft"
              >
                <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2} />
                Cases
              </button>
              <span className="font-mono-data ml-auto pr-2 text-[12px] text-ink-3">
                {selectedIndex + 1} / {visibleCases.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto pb-safe">
              <CaseDetail key={selected.testCase.id} testCase={selected.testCase} number={selected.number} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CaseDetail({ testCase, number }: { testCase: GeneratedSuite["cases"][number]; number: number }) {
  return (
    <article className="fade p-5 md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono-data rounded-md bg-indigo-soft px-1.5 py-0.5 text-[12px] font-medium text-indigo-deep">
          TC-{String(number).padStart(3, "0")}
        </span>
        <SeverityTag level={testCase.criticality} />
        <span className="text-[12px] text-ink-3">{testCase.coverageArea}</span>
      </div>
      <h2 className="font-display mt-3.5 text-[20px] font-bold leading-tight tracking-[-0.015em] text-ink">{testCase.title}</h2>
      <p className="mt-2.5 max-w-[66ch] text-[14px] leading-relaxed text-ink-2">{testCase.rationale}</p>

      <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">Procedure</p>
      <ol className="mt-3">
        {testCase.steps.map((step, index) => {
          const last = index === testCase.steps.length - 1;
          return (
            <li key={step.id} className="rise relative flex gap-3.5 pb-4 last:pb-0" style={{ animationDelay: `${index * 50}ms` }}>
              {!last ? <span aria-hidden className="absolute left-[13px] top-8 bottom-0 w-px bg-indigo-line" /> : null}
              <span className="font-mono-data relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-indigo-line bg-window text-[12px] font-medium text-indigo">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1 rounded-xl border hairline bg-window-sunk/70 px-3.5 py-2.5 text-[14px] leading-relaxed text-ink-2">
                {step.text}
              </span>
            </li>
          );
        })}
      </ol>
    </article>
  );
}

function AreaRow({
  label,
  count,
  high = 0,
  active,
  gap = false,
  onClick,
}: {
  label: string;
  count: number;
  high?: number;
  active: boolean;
  gap?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo ${
        active ? "bg-window font-semibold text-ink shadow-raised" : gap ? "text-ink-3 hover:bg-window/70" : "text-ink-2 hover:bg-window/70"
      }`}
    >
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {gap ? (
        <span className="rounded-[5px] bg-sev-med-bg px-1.5 text-[10px] font-semibold uppercase leading-[18px] tracking-[0.04em] text-sev-med">
          Gap
        </span>
      ) : (
        <span className="flex items-center gap-1.5">
          {high ? <span className="h-1.5 w-1.5 rounded-full bg-sev-high" aria-label={`${high} high`} /> : null}
          <span className="font-mono-data text-[11px] text-ink-3">{count}</span>
        </span>
      )}
    </button>
  );
}

function AreaChip({
  label,
  count,
  active,
  gap = false,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  gap?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors ${
        active
          ? "border-indigo bg-indigo text-white"
          : gap
            ? "border-sev-med/30 bg-sev-med-bg text-sev-med"
            : "hairline bg-window text-ink-2"
      }`}
    >
      {label}
      <span className={`font-mono-data text-[11px] ${active ? "text-white/75" : ""}`}>{gap ? "gap" : count}</span>
    </button>
  );
}

function EvidenceCard({
  title,
  icon: Icon,
  items,
  delay,
}: {
  title: string;
  icon: typeof AlertTriangle;
  items: string[];
  delay: number;
}) {
  return (
    <Window
      title={title}
      icon={<Icon className="h-4 w-4" strokeWidth={2} />}
      controls={<span className="font-mono-data text-[12px] text-ink-3">{items.length}</span>}
      style={{ animationDelay: `${delay}ms` }}
    >
      <ul className="space-y-2.5 p-4">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 text-[13px] leading-relaxed text-ink-2">
            <span className="mt-[3px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-soft text-indigo">
              <Check className="h-2.5 w-2.5" strokeWidth={3} />
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </Window>
  );
}
