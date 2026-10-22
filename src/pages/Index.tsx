import { useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TestCaseExplorer } from "@/components/TestCaseExplorer";
import { StreamlineField } from "@/components/tunnel/StreamlineField";
import { Panel, TestWindow, TunnelLamp } from "@/components/tunnel/primitives";
import { generateTestCases, parseDocuments } from "@/lib/api";
import { readAreas } from "@/lib/coverage";
import {
  addKnowledgeBaseDocs,
  clearKnowledgeBase,
  deleteKnowledgeBaseDoc,
  listKnowledgeBaseDocs,
} from "@/lib/knowledgeBaseStore";
import { clearRuns, loadRuns, saveRun } from "@/lib/runHistoryStore";
import type { GeneratedSuite } from "@/lib/testCaseTypes";
import type { SavedKnowledgeBaseDoc, SavedTestRun } from "@/lib/workspaceTypes";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useTunnelStatus } from "@/hooks/use-tunnel-status";
import { ArrowLeft, FileText, Paperclip, Plus, Upload, X } from "lucide-react";

interface AttachedPrd {
  file: File;
  excerpt: string;
}

type WorkspaceView = "new" | "results" | "history" | "knowledge-base";

const PRD_EXTENSIONS = [".pdf", ".docx", ".md", ".txt", ".rtf"];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function extensionOf(name: string) {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot).toLowerCase() : "";
}

function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Page title in expanded wall lettering, with its lede beside it. */
function PageHead({ title, lede }: { title: string; lede: string }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-10">
      <h1 className="w-ultra text-[40px] font-extrabold leading-[0.92] tracking-[-0.035em] text-ink md:text-[56px]">
        {title}
      </h1>
      <p className="max-w-[46ch] pb-1 text-[14px] leading-relaxed text-ink-2">{lede}</p>
    </div>
  );
}

/** History row fingerprint: twelve hairline tubes showing where the run put its cases. */
function CoverageFingerprint({ run }: { run: SavedTestRun }) {
  const readings = readAreas(run.suite.cases).slice(0, 12);
  const peak = Math.max(3, ...readings.map((reading) => reading.total));
  return (
    <span aria-hidden className="flex h-6 items-end gap-[3px]">
      {readings.map((reading) => (
        <span
          key={reading.id}
          className="flex w-[4px] flex-col-reverse overflow-hidden rounded-t-full bg-facility-deep"
          style={{ height: "100%" }}
        >
          <span className="flex flex-col-reverse" style={{ height: `${(reading.total / peak) * 100}%` }}>
            {reading.high ? <span className="bg-fluid-high" style={{ flexGrow: reading.high }} /> : null}
            {reading.medium ? <span className="bg-fluid-med" style={{ flexGrow: reading.medium }} /> : null}
            {reading.low ? <span className="bg-fluid-low" style={{ flexGrow: reading.low }} /> : null}
          </span>
        </span>
      ))}
    </span>
  );
}

export default function Index() {
  const { toast } = useToast();
  const { user } = useAuth();
  const tunnel = useTunnelStatus();
  const userSub = user?.sub ?? "";
  const prdInputRef = useRef<HTMLInputElement | null>(null);
  const kbInputRef = useRef<HTMLInputElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [activeView, setActiveView] = useState<WorkspaceView>("new");
  const [resultsFrom, setResultsFrom] = useState<"new" | "history">("new");
  const [prd, setPrd] = useState<AttachedPrd | null>(null);
  const [suite, setSuite] = useState<GeneratedSuite | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [previousRuns, setPreviousRuns] = useState<SavedTestRun[]>([]);
  const [savedKnowledgeBaseDocs, setSavedKnowledgeBaseDocs] = useState<SavedKnowledgeBaseDoc[]>([]);

  const refreshWorkspaceData = useCallback(async () => {
    if (!userSub) {
      return;
    }

    setPreviousRuns(loadRuns(userSub));

    try {
      setSavedKnowledgeBaseDocs(await listKnowledgeBaseDocs(userSub));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to read locally stored documents.";
      toast({
        title: "Local storage unavailable",
        description: message,
        variant: "destructive",
      });
    }
  }, [toast, userSub]);

  useEffect(() => {
    void refreshWorkspaceData();
  }, [refreshWorkspaceData]);

  // Run clock — a real elapsed time, not an invented progress percentage.
  useEffect(() => {
    if (!isLoading) {
      setElapsed(0);
      return;
    }
    const started = Date.now();
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [isLoading]);

  async function extractExcerpt(file: File) {
    const mimeType = file.type.toLowerCase();
    const name = file.name.toLowerCase();
    const canReadInline =
      mimeType.startsWith("text/") ||
      name.endsWith(".md") ||
      name.endsWith(".txt") ||
      name.endsWith(".json");

    if (!canReadInline) {
      return "";
    }

    const content = await file.text();
    return content.replace(/\s+/g, " ").trim().slice(0, 320);
  }

  async function mountPrd(file: File) {
    if (!PRD_EXTENSIONS.includes(extensionOf(file.name))) {
      toast({
        title: "Unsupported document",
        description: `${file.name} can't be mounted. Use PDF, DOCX, TXT, MD or RTF.`,
        variant: "destructive",
      });
      return;
    }

    setPrd({ file, excerpt: await extractExcerpt(file) });
    setSuite(null);
    setActiveView("new");
    toast({
      title: "PRD mounted",
      description: `${file.name} is in the test section.`,
    });
  }

  async function handlePrdChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) {
      await mountPrd(file);
    }
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (!isDragging) setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsDragging(false);
    }
  }

  async function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      await mountPrd(file);
    }
  }

  async function handleKnowledgeBaseChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length || !userSub) {
      return;
    }

    setIsUploading(true);
    try {
      const parsed = await parseDocuments(files);
      const now = new Date().toISOString();
      const documents: SavedKnowledgeBaseDoc[] = parsed.map((document) => ({
        id: `kb-${crypto.randomUUID()}`,
        name: document.fileName,
        excerpt: document.excerpt,
        extractedText: document.text,
        addedAt: now,
        truncated: document.truncated,
      }));

      await addKnowledgeBaseDocs(userSub, documents);
      setSavedKnowledgeBaseDocs(await listKnowledgeBaseDocs(userSub));
      setSuite(null);

      toast({
        title: "Knowledge base updated",
        description: `${documents.length} reference document${documents.length === 1 ? "" : "s"} added.`,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add knowledge-base documents.";
      toast({
        title: "Upload failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }

  async function handleAnalyze() {
    if (!prd) {
      toast({
        title: "PRD required",
        description: "Mount a PRD before generating test cases.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const context = savedKnowledgeBaseDocs
        .filter((document) => document.extractedText.trim().length > 0)
        .map((document) => ({ fileName: document.name, text: document.extractedText }));

      const { suite: nextSuite, meta } = await generateTestCases(prd.file, context);

      const run: SavedTestRun = {
        id: `run-${crypto.randomUUID()}`,
        prdName: meta.prdName,
        prdExcerpt: meta.prdExcerpt,
        generatedAt: meta.generatedAt,
        totalCases: nextSuite.cases.length,
        suite: nextSuite,
        modelName: meta.modelName,
        promptVersion: meta.promptVersion,
      };

      setPreviousRuns(saveRun(userSub, run));
      setSuite(nextSuite);
      setSelectedRunId(run.id);
      setResultsFrom("new");
      setActiveView("results");

      toast({
        title: "Coverage generated",
        description: `${nextSuite.cases.length} test cases saved to this browser.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate test cases.";
      toast({
        title: "Generation failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function removeKnowledgeBaseDoc(id: string) {
    try {
      await deleteKnowledgeBaseDoc(userSub, id);
      setSavedKnowledgeBaseDocs(await listKnowledgeBaseDocs(userSub));
      setSuite(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to remove the document.";
      toast({
        title: "Delete failed",
        description: message,
        variant: "destructive",
      });
    }
  }

  async function handleClearKnowledgeBase() {
    try {
      await clearKnowledgeBase(userSub);
      setSavedKnowledgeBaseDocs([]);
      toast({ title: "Knowledge base cleared" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to clear documents.";
      toast({ title: "Clear failed", description: message, variant: "destructive" });
    }
  }

  function handleClearRuns() {
    clearRuns(userSub);
    setPreviousRuns([]);
    setSelectedRunId(null);
    toast({ title: "Run history cleared" });
  }

  const selectedRun = previousRuns.find((run) => run.id === selectedRunId) ?? null;
  const resultsSuite = activeView === "results" ? suite ?? selectedRun?.suite ?? null : null;
  const resultPrdName = selectedRun?.prdName ?? prd?.file.name ?? "Latest PRD";
  const navView: WorkspaceView = activeView === "results" ? resultsFrom : activeView;
  const pageName =
    activeView === "results"
      ? "Run report"
      : activeView === "history"
        ? "Previous runs"
        : activeView === "knowledge-base"
          ? "Knowledge base"
          : "New analysis";

  function renderNewAnalysisView() {
    const docCount = savedKnowledgeBaseDocs.length;
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHead
          title="New analysis"
          lede="Mount a PRD in the test section. Your knowledge base conditions the flow, and the run returns executable cases across twelve coverage areas."
        />

        <TestWindow
          placard="Test section · Source document"
          readouts={
            <>
              <span className="hidden sm:block">
                <TunnelLamp status={tunnel} />
              </span>
              {prd ? (
                <span className="font-mono-data hidden text-flow-3 md:inline">
                  {extensionOf(prd.file.name).slice(1).toUpperCase()} · {formatBytes(prd.file.size)}
                </span>
              ) : null}
            </>
          }
        >
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="relative flex h-[300px] items-center justify-center md:h-[380px]"
          >
            <StreamlineField mounted={Boolean(prd)} className="absolute inset-0 h-full w-full" />
            {/* Vignette so the field fades into the window frame. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,hsl(var(--graphite))_100%)]"
            />

            {prd ? (
              <div className="relative z-10 flex w-[min(380px,82%)] flex-col items-center gap-3 rounded-[28px] border border-flow/25 bg-graphite-3/95 px-6 py-5 text-center shadow-[0_0_0_6px_hsl(var(--graphite)/0.85),0_18px_40px_-12px_hsl(0_0%_0%/0.6)]">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-safety text-ink">
                  <FileText className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <span className="w-full">
                  <span className="block truncate text-[16px] font-bold text-flow" title={prd.file.name}>
                    {prd.file.name}
                  </span>
                  {prd.excerpt ? (
                    <span className="mt-1.5 line-clamp-2 hidden text-[12px] leading-relaxed text-flow-3 sm:block">
                      {prd.excerpt}
                    </span>
                  ) : (
                    <span className="mt-1 block text-[12px] text-flow-3">Mounted · parsed on the server at run time</span>
                  )}
                </span>
                <div className="flex gap-2">
                  <Button variant="graphite" size="sm" onClick={() => prdInputRef.current?.click()}>
                    Replace
                  </Button>
                  <Button variant="graphite" size="sm" onClick={() => setPrd(null)}>
                    <X className="h-3.5 w-3.5" strokeWidth={2} />
                    Unmount
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => prdInputRef.current?.click()}
                className={`group relative z-10 flex w-[min(380px,82%)] flex-col items-center gap-3 rounded-[28px] border border-dashed px-6 py-7 text-center outline-none transition-[border-color,background-color,transform] duration-200 focus-visible:ring-2 focus-visible:ring-safety focus-visible:ring-offset-4 focus-visible:ring-offset-graphite ${
                  isDragging
                    ? "scale-[1.02] border-safety bg-safety/10"
                    : "border-flow/30 bg-graphite/70 hover:border-flow/60 hover:bg-graphite-2/80"
                }`}
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-full border transition-colors ${
                    isDragging ? "border-safety bg-safety text-ink" : "border-flow/25 text-flow group-hover:border-safety/70 group-hover:text-safety"
                  }`}
                >
                  <Upload className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <span>
                  <span className="block text-[16px] font-bold text-flow">
                    {isDragging ? "Release to mount" : "Attach a PRD"}
                  </span>
                  <span className="mt-1 block text-[12px] leading-relaxed text-flow-3">
                    Drop it here or click to browse · PDF, DOCX, TXT, MD or RTF
                  </span>
                </span>
              </button>
            )}

            <input
              ref={prdInputRef}
              type="file"
              className="hidden"
              accept={PRD_EXTENSIONS.join(",")}
              onChange={handlePrdChange}
            />
          </div>
        </TestWindow>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <Panel
            placard="Supporting context"
            action={
              <Button variant="outline" size="sm" onClick={() => setActiveView("knowledge-base")}>
                Manage
              </Button>
            }
          >
            <div className="honeycomb flex items-center gap-4 px-5 py-4">
              <span className="font-mono-data text-[28px] font-semibold leading-none text-flow">{docCount}</span>
              <span className="text-[13px] leading-snug text-flow-2">
                {docCount === 1 ? "reference" : "references"} conditioning the flow
                <span className="block text-flow-3">Applied to every run automatically</span>
              </span>
            </div>
            {docCount ? (
              <ul className="divide-y divide-line">
                {savedKnowledgeBaseDocs.slice(0, 4).map((doc) => (
                  <li key={doc.id} className="flex items-center gap-3 px-5 py-3">
                    <Paperclip className="h-3.5 w-3.5 shrink-0 text-ink-3" strokeWidth={1.75} />
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">{doc.name}</span>
                    <span className="font-mono-data shrink-0 text-[12px] text-ink-3">
                      {new Date(doc.addedAt).toLocaleDateString()}
                    </span>
                  </li>
                ))}
                {docCount > 4 ? (
                  <li className="px-5 py-3 text-[12px] text-ink-3">+ {docCount - 4} more</li>
                ) : null}
              </ul>
            ) : (
              <p className="px-5 py-4 text-[13px] leading-relaxed text-ink-2">
                No references yet. The run still works from the PRD alone — add process docs, API
                contracts or policies to ground it in how your product actually behaves.
              </p>
            )}
          </Panel>

          <Panel placard="Run sheet" className="flex flex-col">
            <dl className="flex-1 divide-y divide-line">
              <RunSheetRow label="Model">
                {prd ? <span className="truncate">{prd.file.name}</span> : <span className="text-ink-3">Not mounted</span>}
              </RunSheetRow>
              <RunSheetRow label="Conditioning">
                {docCount} document{docCount === 1 ? "" : "s"}
              </RunSheetRow>
              <RunSheetRow label="Coverage areas">12</RunSheetRow>
              <RunSheetRow label="Expected run">
                {tunnel === "waking" ? "1–3 min, plus wake-up" : "1–3 min"}
              </RunSheetRow>
            </dl>
            <div className="border-t border-line bg-facility/60 p-5">
              <Button size="lg" className="w-full" onClick={handleAnalyze} disabled={isLoading || !prd}>
                Generate coverage
              </Button>
              <p className="mt-2.5 text-center text-[12px] text-ink-3">
                {prd ? "Starts the run. You can watch it in the test section." : "Mount a PRD to start a run."}
              </p>
            </div>
          </Panel>
        </div>
      </div>
    );
  }

  function renderRunView() {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHead
          title="Running"
          lede="The model is reading your PRD against every retained reference and drafting coverage. This usually takes one to three minutes."
        />
        <TestWindow
          placard="Test section · Run in progress"
          readouts={
            <>
              <TunnelLamp status={tunnel} />
              <span className="font-mono-data text-[13px] text-safety" aria-label={`Elapsed ${elapsed} seconds`}>
                {formatElapsed(elapsed)}
              </span>
            </>
          }
        >
          <div aria-hidden className="hazard-band h-1.5 w-full" />
          <div className="relative flex h-[340px] items-center justify-center md:h-[420px]">
            <StreamlineField mounted running density={32} className="absolute inset-0 h-full w-full" />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,hsl(var(--graphite))_100%)]"
            />
            <div className="relative z-10 flex w-[min(400px,84%)] flex-col items-center gap-2 rounded-[28px] border border-safety/50 bg-graphite-3/95 px-6 py-5 text-center shadow-[0_0_0_6px_hsl(var(--graphite)/0.85),0_0_40px_-8px_hsl(var(--safety)/0.35)]">
              <span className="block max-w-full truncate text-[16px] font-bold text-flow">{prd?.file.name}</span>
              <span className="text-[12px] text-flow-2" role="status">
                Analyzing document
              </span>
            </div>
          </div>
          <div className="grid border-t border-flow/[0.08] sm:grid-cols-3">
            {[
              ["Parse", "Extracting the PRD on the server"],
              ["Reconcile", `Against ${savedKnowledgeBaseDocs.length} retained reference${savedKnowledgeBaseDocs.length === 1 ? "" : "s"}`],
              ["Draft", "18–28 cases across twelve areas"],
            ].map(([label, detail]) => (
              <div key={label} className="border-flow/[0.08] px-5 py-4 sm:border-r sm:last:border-r-0">
                <span className="placard text-flow-3">{label}</span>
                <p className="mt-1.5 text-[13px] text-flow-2">{detail}</p>
              </div>
            ))}
          </div>
        </TestWindow>
      </div>
    );
  }

  function renderResultsView() {
    if (!resultsSuite) {
      return (
        <div className="mx-auto max-w-6xl">
          <Panel>
            <div className="px-6 py-16 text-center">
              <h1 className="w-expanded text-[20px] font-bold text-ink">No suite selected</h1>
              <p className="mx-auto mt-2 max-w-[48ch] text-[14px] leading-relaxed text-ink-2">
                Run a new analysis, or reopen one from the run log.
              </p>
            </div>
          </Panel>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <button
          onClick={() => setActiveView(resultsFrom)}
          className="inline-flex items-center gap-1.5 rounded-sm text-[13px] font-semibold text-ink-2 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
          {resultsFrom === "history" ? "Previous runs" : "New analysis"}
        </button>
        <TestCaseExplorer
          suite={resultsSuite}
          documentName={resultPrdName}
          generatedAt={selectedRun?.generatedAt ?? null}
        />
      </div>
    );
  }

  function renderHistoryView() {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHead
          title="Previous runs"
          lede="Every generated suite is logged here and reopens exactly as it was produced. The fingerprint shows where each run put its cases."
        />

        <Panel
          placard="Run log"
          action={
            previousRuns.length ? (
              <Button variant="ghost" size="sm" className="text-ink-3 hover:text-destructive" onClick={handleClearRuns}>
                Clear all
              </Button>
            ) : null
          }
        >
          {previousRuns.length ? (
            <ul className="divide-y divide-line">
              {previousRuns.map((run, index) => {
                const high = run.suite.cases.filter((item) => item.criticality === "High").length;
                return (
                  <li key={run.id}>
                    <button
                      onClick={() => {
                        setSelectedRunId(run.id);
                        setSuite(run.suite);
                        setResultsFrom("history");
                        setActiveView("results");
                      }}
                      className="group grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-x-5 gap-y-2 px-5 py-4 text-left transition-colors hover:bg-facility/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink md:grid-cols-[auto_minmax(0,1fr)_auto_auto_auto]"
                    >
                      <span className="font-mono-data w-14 text-[12px] text-ink-3">
                        R-{String(previousRuns.length - index).padStart(3, "0")}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[14px] font-semibold text-ink group-hover:underline group-hover:underline-offset-4">
                          {run.prdName}
                        </span>
                        <span className="mt-1 block truncate text-[12px] text-ink-3">{run.prdExcerpt}</span>
                      </span>
                      <span className="hidden md:block">
                        <CoverageFingerprint run={run} />
                      </span>
                      <span className="font-mono-data col-start-2 flex gap-4 text-[12px] md:col-start-auto">
                        <span className="text-ink-2">{run.totalCases} cases</span>
                        <span className={high ? "text-fluid-high-text" : "text-ink-3"}>{high} high</span>
                      </span>
                      <time className="font-mono-data hidden text-[12px] text-ink-3 md:block">
                        {new Date(run.generatedAt).toLocaleDateString()}
                      </time>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-6 py-16 text-center">
              <p className="text-[14px] font-semibold text-ink">The log is empty</p>
              <p className="mx-auto mt-1.5 max-w-[48ch] text-[13px] leading-relaxed text-ink-2">
                Your first run will be recorded here.
              </p>
              <Button variant="outline" size="sm" className="mt-5" onClick={() => setActiveView("new")}>
                Start a new analysis
              </Button>
            </div>
          )}
          <div className="border-t border-line bg-facility/50 px-5 py-3">
            <p className="text-[12px] leading-relaxed text-ink-3">
              Stored in this browser, for this account. It does not sync to other devices, and clearing site data removes it.
            </p>
          </div>
        </Panel>
      </div>
    );
  }

  function renderKnowledgeBaseView() {
    const docCount = savedKnowledgeBaseDocs.length;
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHead
          title="Knowledge base"
          lede="References that condition every run — process docs, API contracts, policies. Read once, kept in this browser, applied automatically."
        />

        <TestWindow placard="Flow conditioning" bodyClassName="honeycomb">
          <div className="flex flex-col gap-5 px-6 py-6 sm:flex-row sm:items-center sm:justify-between md:px-8">
            <div className="flex items-center gap-5">
              <span className="font-mono-data text-[40px] font-semibold leading-none text-flow">{docCount}</span>
              <span className="max-w-[40ch] text-[14px] leading-snug text-flow-2">
                {docCount === 1 ? "reference" : "references"} straightening the flow before it reaches your PRD.
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {docCount ? (
                <Button variant="graphite" size="sm" onClick={handleClearKnowledgeBase}>
                  Clear all
                </Button>
              ) : null}
              <Button variant="graphite" onClick={() => kbInputRef.current?.click()} disabled={isUploading}>
                <Plus className="h-4 w-4" strokeWidth={2} />
                {isUploading ? "Reading…" : "Add references"}
              </Button>
            </div>
          </div>
        </TestWindow>

        <input
          ref={kbInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.md,.txt,.csv,.json,.rtf"
          multiple
          onChange={handleKnowledgeBaseChange}
        />

        <Panel placard="Documents">
          {docCount ? (
            <ul className="divide-y divide-line">
              {savedKnowledgeBaseDocs.map((doc) => (
                <li key={doc.id} className="group flex items-start gap-4 px-5 py-4 transition-colors hover:bg-facility/50">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line bg-facility text-ink-2">
                    <Paperclip className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-ink">{doc.name}</p>
                    <p className="mt-1 line-clamp-2 max-w-[80ch] text-[13px] leading-relaxed text-ink-2">{doc.excerpt}</p>
                    <p className="font-mono-data mt-2 flex flex-wrap gap-x-4 text-[12px] text-ink-3">
                      <time>Added {new Date(doc.addedAt).toLocaleDateString()}</time>
                      <span>{doc.extractedText.length.toLocaleString()} chars</span>
                      {doc.truncated ? <span className="text-fluid-med-text">Truncated at size limit</span> : null}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-ink-3 hover:text-destructive"
                    onClick={() => removeKnowledgeBaseDoc(doc.id)}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-6 py-16 text-center">
              <p className="text-[14px] font-semibold text-ink">No references yet</p>
              <p className="mx-auto mt-1.5 max-w-[52ch] text-[13px] leading-relaxed text-ink-2">
                Add the documents a senior tester would keep open while reading a PRD.
              </p>
            </div>
          )}
          <div className="border-t border-line bg-facility/50 px-5 py-3">
            <p className="text-[12px] leading-relaxed text-ink-3">
              Text is extracted once and kept in this browser, for this account. Nothing is stored on the server.
            </p>
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="facility-ground flex min-h-screen w-full">
        <AppSidebar
          activeView={navView}
          knowledgeBaseCount={savedKnowledgeBaseDocs.length}
          previousRunCount={previousRuns.length}
          onNavigate={(view) => setActiveView(view)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 items-center gap-3 border-b border-line bg-facility/95 px-4 md:px-8">
            <SidebarTrigger className="h-8 w-8 text-ink-2 hover:text-ink" />
            <span className="h-4 w-px bg-line-strong" aria-hidden />
            <span className="placard text-ink-3">Facility</span>
            <span className="text-ink-3" aria-hidden>
              /
            </span>
            <span className="text-[13px] font-semibold text-ink">{pageName}</span>
            <span className="ml-auto">
              <TunnelLamp status={tunnel} tone="light" />
            </span>
          </header>

          <main className="flex-1 px-4 py-6 md:px-8 md:py-10">
            {isLoading
              ? renderRunView()
              : activeView === "new"
                ? renderNewAnalysisView()
                : activeView === "results"
                  ? renderResultsView()
                  : activeView === "history"
                    ? renderHistoryView()
                    : renderKnowledgeBaseView()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function RunSheetRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3">
      <dt className="placard text-ink-3">{label}</dt>
      <dd className="font-mono-data min-w-0 truncate text-right text-[13px] text-ink">{children}</dd>
    </div>
  );
}

