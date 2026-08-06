import { useEffect, useState } from "react";
import type { Criticality, GeneratedSuite } from "@/lib/testCaseTypes";

/**
 * Severity is encoded by fill weight, not hue: solid, half, hollow.
 * The palette carries one accent, so priority reads as ink density —
 * which also means it survives a colourblind reader and a mono print.
 */
function Severity({ level, className = "" }: { level: Criticality; className?: string }) {
  const mark =
    level === "High"
      ? "bg-blue border-blue"
      : level === "Medium"
        ? "bg-blue/40 border-blue/60"
        : "bg-transparent border-rule-strong";

  const text = level === "High" ? "text-blue" : level === "Medium" ? "text-ink-soft" : "text-ink-faint";

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span aria-hidden className={`h-2 w-2 shrink-0 rounded-[1px] border ${mark}`} />
      <span className={`text-[11px] font-medium uppercase tracking-wider ${text}`}>{level}</span>
    </span>
  );
}

function EvidenceColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="px-6 py-5">
      <p className="label-spec">{title}</p>
      <ul className="mt-3 space-y-2.5">
        {items.map((item) => (
          <li
            key={item}
            className="max-w-[68ch] border-l border-rule pl-3 text-[12px] leading-relaxed text-ink-soft"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

interface TestCaseExplorerProps {
  suite: GeneratedSuite;
}

export function TestCaseExplorer({ suite }: TestCaseExplorerProps) {
  const [selectedCaseId, setSelectedCaseId] = useState(suite.cases[0]?.id ?? "");

  useEffect(() => {
    setSelectedCaseId(suite.cases[0]?.id ?? "");
  }, [suite]);

  const selectedCase = suite.cases.find((testCase) => testCase.id === selectedCaseId) ?? suite.cases[0];
  const selectedIndex = suite.cases.findIndex((testCase) => testCase.id === selectedCase?.id);

  return (
    <div className="space-y-4">
      <div className="sheet-in rounded-lg border border-rule bg-paper shadow-sheet">
        <div className="grid divide-y divide-rule lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          <EvidenceColumn title="Risk scan" items={suite.risks} />
          <EvidenceColumn title="Source context" items={suite.sourceHighlights} />
          <EvidenceColumn title="Assumptions" items={suite.assumptions} />
        </div>
      </div>

      <div className="sheet-in rounded-lg border border-rule bg-paper shadow-sheet">
        <div className="flex items-center gap-3 border-b border-rule px-6 py-3">
          <span aria-hidden className="h-2.5 w-[3px] rounded-sm bg-blue" />
          <span className="label-spec">Coverage</span>
          <span data-numeric className="ml-auto text-[11px] text-ink-faint">
            {suite.cases.length} cases
          </span>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:divide-x lg:divide-rule">
          <ul className="divide-y divide-rule border-b border-rule lg:border-b-0">
            {suite.cases.map((testCase, index) => {
              const active = selectedCase?.id === testCase.id;
              return (
                <li key={testCase.id}>
                  <button
                    onClick={() => setSelectedCaseId(testCase.id)}
                    aria-current={active ? "true" : undefined}
                    className={`flex w-full items-start gap-3 px-6 py-3.5 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue ${
                      active ? "bg-blue-wash" : "hover:bg-paper-sunk"
                    }`}
                  >
                    <span
                      data-numeric
                      className={`mt-px w-6 shrink-0 text-[12px] font-medium ${
                        active ? "text-blue" : "text-ink-faint"
                      }`}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium leading-snug text-ink">
                        {testCase.title}
                      </span>
                      <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <Severity level={testCase.criticality} />
                        <span className="text-[11px] text-ink-faint">{testCase.coverageArea}</span>
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {selectedCase ? (
            <div className="min-w-0">
              <div className="border-b border-rule px-6 py-5">
                <div className="flex items-baseline gap-3">
                  <span data-numeric className="text-[12px] font-medium text-ink-faint">
                    {String(selectedIndex + 1).padStart(2, "0")}
                  </span>
                  <h3 className="min-w-0 flex-1 text-[17px] font-semibold leading-snug tracking-tight text-ink">
                    {selectedCase.title}
                  </h3>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 pl-[27px]">
                  <Severity level={selectedCase.criticality} />
                  <span className="text-[11px] text-ink-faint">{selectedCase.coverageArea}</span>
                </div>
                <p className="mt-3 max-w-[68ch] pl-[27px] text-[13px] leading-relaxed text-ink-soft">
                  {selectedCase.rationale}
                </p>
              </div>

              <div className="px-6 py-5">
                <p className="label-spec">Procedure</p>
                <ol className="mt-3.5 space-y-3">
                  {selectedCase.steps.map((step, index) => (
                    <li key={step.id} className="flex gap-3">
                      <span
                        data-numeric
                        className="mt-px w-6 shrink-0 text-[12px] font-medium text-blue"
                      >
                        {index + 1}.
                      </span>
                      <span className="max-w-[68ch] text-[13px] leading-relaxed text-ink-soft">
                        {step.text}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
