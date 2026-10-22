import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BookOpenText, Compass } from "lucide-react";
import type { Criticality, GeneratedSuite } from "@/lib/testCaseTypes";
import { areaOf, readAreas, shortLabelFor } from "@/lib/coverage";
import { ManometerBoard } from "@/components/tunnel/ManometerBoard";
import { Panel, SeverityMark, TestWindow } from "@/components/tunnel/primitives";

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

  useEffect(() => {
    setActiveArea(null);
    setSeverity("All");
    setSelectedCaseId(suite.cases[0]?.id ?? "");
  }, [suite]);

  const readings = useMemo(() => readAreas(suite.cases), [suite]);
  const dryAreas = readings.filter((reading) => reading.total === 0 && reading.id !== "__other__").length;
  const highCount = suite.cases.filter((testCase) => testCase.criticality === "High").length;

  const visibleCases = useMemo(
    () =>
      suite.cases
        .map((testCase, index) => ({ testCase, number: index + 1 }))
        .filter(({ testCase }) => (activeArea ? areaOf(testCase) === activeArea : true))
        .filter(({ testCase }) => (severity === "All" ? true : testCase.criticality === severity)),
    [suite, activeArea, severity],
  );

  // Keep a visible case selected as filters change.
  useEffect(() => {
    if (!visibleCases.some(({ testCase }) => testCase.id === selectedCaseId)) {
      setSelectedCaseId(visibleCases[0]?.testCase.id ?? "");
    }
  }, [visibleCases, selectedCaseId]);

  const selected = visibleCases.find(({ testCase }) => testCase.id === selectedCaseId) ?? visibleCases[0];

  const readouts = [
    { label: "Document", value: documentName },
    { label: "Generated", value: generatedAt ? new Date(generatedAt).toLocaleDateString() : "—" },
    { label: "Cases", value: String(suite.cases.length) },
    { label: "High", value: String(highCount) },
    { label: "Dry areas", value: String(dryAreas) },
  ];

  return (
    <div className="space-y-5">
      <TestWindow
        placard="Run report"
        readouts={
          <span className="font-mono-data hidden text-[12px] text-flow-3 sm:inline">
            {suite.cases.length} cases · 12 areas
          </span>
        }
        bodyClassName="grid gap-8 p-6 md:p-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,600px)] xl:items-end"
      >
        <div className="min-w-0">
          <h1 className="w-expanded break-words text-[28px] font-extrabold leading-[1.02] tracking-[-0.025em] text-flow md:text-[40px]">
            {suite.featureName}
          </h1>
          <p className="mt-4 max-w-[64ch] text-[14px] leading-relaxed text-flow-2">{suite.shortSummary}</p>

          <dl className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-flow/10 bg-flow/10 sm:grid-cols-4">
            {readouts.map((readout) => (
              <div
                key={readout.label}
                className={`min-w-0 bg-graphite px-3.5 py-3 ${readout.label === "Document" ? "col-span-2 sm:col-span-4" : ""}`}
              >
                <dt className="placard text-flow-3">{readout.label}</dt>
                <dd
                  className={`font-mono-data mt-2 truncate text-[13px] ${
                    readout.label === "High" && highCount
                      ? "text-[hsl(6_90%_72%)]"
                      : readout.label === "Dry areas" && dryAreas
                        ? "text-safety"
                        : "text-flow"
                  }`}
                  title={readout.value}
                >
                  {readout.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <ManometerBoard readings={readings} activeArea={activeArea} onSelectArea={setActiveArea} />
      </TestWindow>

      <div className="grid gap-5 lg:grid-cols-3">
        <EvidencePanel placard="Risk scan" icon={AlertTriangle} items={suite.risks} />
        <EvidencePanel placard="Source context" icon={BookOpenText} items={suite.sourceHighlights} />
        <EvidencePanel placard="Assumptions" icon={Compass} items={suite.assumptions} />
      </div>

      <Panel
        placard={activeArea ? `Coverage · ${shortLabelFor(activeArea)}` : "Coverage"}
        action={
          <div role="radiogroup" aria-label="Filter by severity" className="flex rounded-md border border-line bg-facility p-0.5">
            {SEVERITY_FILTERS.map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={severity === option}
                onClick={() => setSeverity(option)}
                className={`rounded-[3px] px-2.5 py-1 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink ${
                  severity === option ? "bg-ink text-flow" : "text-ink-2 hover:text-ink"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        }
      >
        {visibleCases.length ? (
          <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <ul className="max-h-[720px] divide-y divide-line overflow-y-auto border-b border-line lg:border-b-0 lg:border-r">
              {visibleCases.map(({ testCase, number }) => {
                const active = selected?.testCase.id === testCase.id;
                return (
                  <li key={testCase.id}>
                    <button
                      onClick={() => setSelectedCaseId(testCase.id)}
                      aria-current={active ? "true" : undefined}
                      className={`relative flex w-full items-start gap-3.5 px-5 py-4 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink ${
                        active ? "bg-facility" : "hover:bg-facility/60"
                      }`}
                    >
                      <span
                        className={`font-mono-data mt-px w-12 shrink-0 text-[12px] ${active ? "text-ink" : "text-ink-3"}`}
                      >
                        TC-{String(number).padStart(3, "0")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-semibold leading-snug text-ink">
                          {testCase.title}
                        </span>
                        <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <SeverityMark level={testCase.criticality} />
                          <span className="w-semi-condensed text-[12px] text-ink-3">{testCase.coverageArea}</span>
                        </span>
                      </span>
                      {active ? (
                        <span aria-hidden className="absolute right-3 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-ink" />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>

            {selected ? (
              <article key={selected.testCase.id} className="enter min-w-0 p-6 md:p-7">
                <div className="flex items-center gap-3">
                  <span className="font-mono-data rounded-sm bg-ink px-1.5 py-0.5 text-[12px] text-flow">
                    TC-{String(selected.number).padStart(3, "0")}
                  </span>
                  <SeverityMark level={selected.testCase.criticality} />
                  <span className="w-semi-condensed truncate text-[12px] text-ink-3">
                    {selected.testCase.coverageArea}
                  </span>
                </div>
                <h2 className="w-semi-condensed mt-4 text-[20px] font-bold leading-tight tracking-[-0.01em] text-ink">
                  {selected.testCase.title}
                </h2>
                <p className="mt-3 max-w-[68ch] text-[14px] leading-relaxed text-ink-2">
                  {selected.testCase.rationale}
                </p>

                <div className="mt-7 border-t border-line pt-5">
                  <span className="placard text-ink-3">Procedure</span>
                  <ol className="mt-4 space-y-0">
                    {selected.testCase.steps.map((step, index) => {
                      const isLast = index === selected.testCase.steps.length - 1;
                      return (
                        <li key={step.id} className="relative flex gap-4 pb-5 last:pb-0">
                          {!isLast ? (
                            <span aria-hidden className="absolute left-[13px] top-7 bottom-0 w-px bg-line-strong" />
                          ) : null}
                          <span className="font-mono-data relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line-strong bg-panel text-[12px] font-medium text-ink">
                            {index + 1}
                          </span>
                          <span className="max-w-[66ch] pt-1 text-[14px] leading-relaxed text-ink-2">{step.text}</span>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </article>
            ) : null}
          </div>
        ) : (
          <div className="px-6 py-14 text-center">
            <p className="text-[14px] font-semibold text-ink">No cases match these filters</p>
            <p className="mx-auto mt-1.5 max-w-[48ch] text-[13px] leading-relaxed text-ink-2">
              {activeArea
                ? `This run produced no ${severity === "All" ? "" : `${severity.toLowerCase()}-severity `}cases for ${shortLabelFor(activeArea)}.`
                : "Try a different severity."}
            </p>
            <button
              onClick={() => {
                setActiveArea(null);
                setSeverity("All");
              }}
              className="mt-4 text-[13px] font-semibold text-ink underline underline-offset-4"
            >
              Clear filters
            </button>
          </div>
        )}
      </Panel>
    </div>
  );
}

function EvidencePanel({
  placard,
  icon: Icon,
  items,
}: {
  placard: string;
  icon: typeof AlertTriangle;
  items: string[];
}) {
  return (
    <Panel
      placard={placard}
      action={
        <span className="flex items-center gap-2 text-ink-3">
          <span className="font-mono-data text-[12px]">{items.length}</span>
          <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
        </span>
      }
    >
      <ul className="space-y-3 px-5 py-4">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-[13px] leading-relaxed text-ink-2">
            <span aria-hidden className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-ink-3" />
            <span className="max-w-[68ch]">{item}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
