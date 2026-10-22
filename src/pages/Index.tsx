import { useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { ArrowLeft, ChevronRight, FileText, FileUp, History, Layers, Paperclip, Plus, Sparkles, Trash2, X } from "lucide-react";
import { AppShell, type Section } from "@/components/bench/AppShell";
import { Flourish, Kbd, Pill, StatusPill, Window } from "@/components/bench/ui";
import { TestCaseExplorer } from "@/components/TestCaseExplorer";
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

interface AttachedPrd {
  file: File;
  excerpt: string;
}

type WorkspaceView = "new" | "results" | "history" | "knowledge-base";

const PRD_EXTENSIONS = [".pdf", ".docx", ".md", ".txt", ".rtf"];
const IS_MAC = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

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
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function PageHead({ title, lede, aside }: { title: React.ReactNode; lede: string; aside?: React.ReactNode }) {
  return (
    <div className="rise mb-6 flex flex-col gap-3 md:mb-8 md:flex-row md:items-end md:justify-between md:gap-10">
      <div>
        <h1 className="font-display text-[32px] font-bold leading-[1.05] tracking-[-0.03em] text-ink md:text-[44px]">{title}</h1>
        <p className="mt-3 max-w-[56ch] text-[15px] leading-relaxed text-ink-2">{lede}</p>
      </div>
      {aside ? <div className="shrink-0">{aside}</div> : null}
    </div>
  );
}

function SectionLabel({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-1 pb-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">{children}</span>
      {action}
    </div>
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
    if (!userSub) return;
    setPreviousRuns(loadRuns(userSub));
    try {
      setSavedKnowledgeBaseDocs(await listKnowledgeBaseDocs(userSub));
    } catch (error) {
      toast({
        title: "Local storage unavailable",
        description: error instanceof Error ? error.message : "Failed to read locally stored documents.",
        variant: "destructive",
      });
    }
  }, [toast, userSub]);

  useEffect(() => {
    void refreshWorkspaceData();
  }, [refreshWorkspaceData]);

  // A real elapsed clock — never an invented progress percentage.
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
    const name = file.name.toLowerCase();
    const inline = file.type.toLowerCase().startsWith("text/") || /\.(md|txt|json)$/.test(name);
    if (!inline) return "";
    return (await file.text()).replace(/\s+/g, " ").trim().slice(0, 320);
  }

  async function mountPrd(file: File) {
    if (!PRD_EXTENSIONS.includes(extensionOf(file.name))) {
      toast({
        title: "Unsupported document",
        description: `${file.name} can't be used. Attach a PDF, DOCX, TXT, MD or RTF.`,
        variant: "destructive",
      });
      return;
    }
    setPrd({ file, excerpt: await extractExcerpt(file) });
    setSuite(null);
    setActiveView("new");
    toast({ title: "PRD attached", description: `${file.name} is ready to run.` });
  }

  async function handlePrdChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) await mountPrd(file);
  }

  function handleDragOver(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    if (!isDragging) setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDragging(false);
  }

  async function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) await mountPrd(file);
  }

  async function handleKnowledgeBaseChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length || !userSub) return;

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
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to add knowledge-base documents.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }

  async function handleAnalyze() {
    if (!prd) {
      toast({ title: "PRD required", description: "Attach a PRD before generating test cases.", variant: "destructive" });
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
      toast({ title: "Coverage generated", description: `${nextSuite.cases.length} test cases saved to this browser.` });
    } catch (error) {
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate test cases.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // ⌘↵ / Ctrl+↵ starts a run from the New analysis view.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Enter" && (event.metaKey || event.ctrlKey) && activeView === "new" && prd && !isLoading) {
        event.preventDefault();
        void handleAnalyze();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  async function removeKnowledgeBaseDoc(id: string) {
    try {
      await deleteKnowledgeBaseDoc(userSub, id);
      setSavedKnowledgeBaseDocs(await listKnowledgeBaseDocs(userSub));
      setSuite(null);
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to remove the document.",
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
      toast({
        title: "Clear failed",
        description: error instanceof Error ? error.message : "Failed to clear documents.",
        variant: "destructive",
      });
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
  const navSection: Section = activeView === "results" ? resultsFrom : activeView;
  const docCount = savedKnowledgeBaseDocs.length;

  function renderNewAnalysisView() {
    return (
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:gap-12">
        <div className="rise lg:pt-6">
          <span className="lg:hidden">
            <StatusPill status={tunnel} />
          </span>
          <h1 className="font-display mt-5 text-[44px] font-bold leading-[1.02] tracking-[-0.035em] text-ink md:text-[56px]">
            New <Flourish>analysis</Flourish>
          </h1>
          <p className="mt-5 max-w-[46ch] text-[16px] leading-relaxed text-ink-2">
            Attach a PRD and get 18–28 executable test cases across twelve coverage areas — grounded in the
            references you keep in your knowledge base.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Pill>12 coverage areas</Pill>
            <Pill>
              {docCount} reference{docCount === 1 ? "" : "s"} applied
            </Pill>
            <Pill>Drafts for human review</Pill>
          </div>
          <p className="mt-6 hidden items-center gap-1.5 text-[13px] text-ink-3 md:flex">
            <Kbd>{IS_MAC ? "⌘" : "Ctrl"}</Kbd>
            <Kbd>↵</Kbd>
            <span className="ml-1">generates once a PRD is attached</span>
          </p>
        </div>

        <Window
          title="Run setup"
          icon={<Sparkles className="h-4 w-4" strokeWidth={2} />}
          controls={<span className="text-[12px] text-ink-3">1–3 min per run</span>}
          style={{ animationDelay: "90ms" }}
          bodyClassName="p-4 md:p-5"
        >
          <SectionLabel>Source document</SectionLabel>
          {prd ? (
            <div className="pop flex items-center gap-3 rounded-xl bg-indigo p-3 text-white shadow-select">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15">
                <FileText className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold" title={prd.file.name}>
                  {prd.file.name}
                </span>
                <span className="font-mono-data mt-0.5 block truncate text-[11px] text-white/75">
                  {extensionOf(prd.file.name).slice(1).toUpperCase()} · {formatBytes(prd.file.size)}
                  {prd.excerpt ? ` · ${prd.excerpt}` : ""}
                </span>
              </span>
              <button
                onClick={() => prdInputRef.current?.click()}
                className="hidden h-9 rounded-lg bg-white/15 px-3 text-[13px] font-medium transition-colors hover:bg-white/25 sm:block"
              >
                Replace
              </button>
              <button
                onClick={() => setPrd(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 transition-colors hover:bg-white/25"
              >
                <X className="h-4 w-4" strokeWidth={2} />
                <span className="sr-only">Remove PRD</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => prdInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`group flex w-full items-center gap-3.5 rounded-xl border-2 border-dashed px-4 py-5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo ${
                isDragging
                  ? "scale-[1.01] border-indigo bg-indigo-soft"
                  : "border-ink/[0.12] bg-window-sunk hover:border-indigo/50 hover:bg-indigo-soft/50"
              }`}
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors ${
                  isDragging ? "bg-indigo text-white" : "bg-window text-indigo shadow-raised group-hover:bg-indigo group-hover:text-white"
                }`}
              >
                <FileUp className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <span className="min-w-0">
                <span className="block text-[15px] font-semibold text-ink">{isDragging ? "Drop to attach" : "Attach a PRD"}</span>
                <span className="mt-0.5 block text-[13px] text-ink-3">Drop it here or browse · PDF, DOCX, TXT, MD, RTF</span>
              </span>
            </button>
          )}
          <input ref={prdInputRef} type="file" className="hidden" accept={PRD_EXTENSIONS.join(",")} onChange={handlePrdChange} />

          <div className="mt-5">
            <SectionLabel
              action={
                <button onClick={() => setActiveView("knowledge-base")} className="text-[12px] font-semibold text-indigo hover:underline">
                  Manage
                </button>
              }
            >
              Supporting context
            </SectionLabel>
            {docCount ? (
              <ul className="space-y-1.5">
                {savedKnowledgeBaseDocs.slice(0, 3).map((doc, index) => (
                  <li
                    key={doc.id}
                    className="rise flex items-center gap-3 rounded-xl border hairline bg-window px-3 py-2.5"
                    style={{ animationDelay: `${140 + index * 40}ms` }}
                  >
                    <Paperclip className="h-4 w-4 shrink-0 text-ink-3" strokeWidth={1.8} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-ink">{doc.name}</span>
                      <span className="font-mono-data block truncate text-[11px] text-ink-3">{doc.excerpt}</span>
                    </span>
                  </li>
                ))}
                {docCount > 3 ? <li className="px-1 pt-1 text-[12px] text-ink-3">+ {docCount - 3} more applied</li> : null}
              </ul>
            ) : (
              <p className="rounded-xl border border-dashed border-ink/[0.12] px-3.5 py-3 text-[13px] leading-relaxed text-ink-3">
                No references yet. Runs still work from the PRD alone — add API contracts, policies or process docs
                to ground them.
              </p>
            )}
          </div>

          <div className="mt-5 border-t hairline pt-4">
            <Button size="lg" className="w-full" onClick={handleAnalyze} disabled={isLoading || !prd}>
              Generate coverage
            </Button>
            <p className="mt-2 text-center text-[12px] text-ink-3">
              {prd ? "Results are saved to this browser for your account." : "Attach a PRD to start."}
            </p>
          </div>
        </Window>
      </div>
    );
  }

  function renderRunView() {
    const steps = [
      ["Parse", "Extracting the PRD on the server"],
      ["Reconcile", `Reading it against ${docCount} retained reference${docCount === 1 ? "" : "s"}`],
      ["Draft", "Writing 18–28 cases across twelve areas"],
    ];
    return (
      <div className="mx-auto max-w-[640px]">
        <PageHead title="Running" lede="This usually takes one to three minutes. You can leave this tab open while it works." />
        <Window
          title={prd?.file.name ?? "Run"}
          icon={<Sparkles className="h-4 w-4" strokeWidth={2} />}
          controls={
            <span className="font-mono-data rounded-md bg-indigo-soft px-2 py-0.5 text-[13px] font-medium text-indigo-deep" aria-label={`Elapsed ${elapsed} seconds`}>
              {formatElapsed(elapsed)}
            </span>
          }
          bodyClassName="p-5"
        >
          <div className="relative" role="status" aria-label="Generating coverage">
            <span aria-hidden className="absolute left-[15px] top-4 bottom-4 w-px bg-indigo-line" />
            <span
              aria-hidden
              className="travel absolute left-[12px] top-4 h-[7px] w-[7px] rounded-full bg-indigo shadow-[0_0_0_4px_hsl(var(--indigo)/0.15)]"
              style={{ ["--travel" as string]: "150px" }}
            />
            <ol className="space-y-3">
              {steps.map(([label, detail], index) => (
                <li key={label} className="rise relative flex items-center gap-3.5" style={{ animationDelay: `${index * 80}ms` }}>
                  <span className="font-mono-data relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-indigo-line bg-window text-[12px] font-medium text-indigo">
                    {index + 1}
                  </span>
                  <span className="shimmer flex-1 rounded-xl border hairline px-3.5 py-3">
                    <span className="block text-[14px] font-semibold text-ink">{label}</span>
                    <span className="block text-[13px] text-ink-3">{detail}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </Window>
      </div>
    );
  }

  function renderResultsView() {
    if (!resultsSuite) {
      return (
        <div className="rise mx-auto max-w-md py-16 text-center">
          <h1 className="font-display text-[24px] font-bold text-ink">No suite selected</h1>
          <p className="mt-2 text-[15px] text-ink-2">Run a new analysis, or reopen one from your previous runs.</p>
        </div>
      );
    }
    return (
      <div className="space-y-5">
        <button
          onClick={() => setActiveView(resultsFrom)}
          className="fade inline-flex h-9 items-center gap-1.5 rounded-lg pr-2 text-[14px] font-medium text-indigo hover:underline"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          {resultsFrom === "history" ? "Previous runs" : "New analysis"}
        </button>
        <TestCaseExplorer suite={resultsSuite} documentName={resultPrdName} generatedAt={selectedRun?.generatedAt ?? null} />
      </div>
    );
  }

  function renderHistoryView() {
    return (
      <div>
        <PageHead
          title="Previous runs"
          lede="Every suite you generate is kept here and reopens exactly as it was produced."
          aside={
            previousRuns.length ? (
              <Button variant="ghost" size="sm" onClick={handleClearRuns} className="text-ink-3 hover:text-sev-high">
                <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                Clear history
              </Button>
            ) : null
          }
        />
        <Window title="Run log" icon={<History className="h-4 w-4" strokeWidth={2} />} controls={<span className="font-mono-data text-[12px] text-ink-3">{previousRuns.length}</span>}>
          {previousRuns.length ? (
            <ul className="divide-y divide-ink/[0.06] p-1.5">
              {previousRuns.map((run, index) => {
                const high = run.suite.cases.filter((item) => item.criticality === "High").length;
                const covered = readAreas(run.suite.cases).filter((r) => r.total > 0 && r.id !== "__other__").length;
                return (
                  <li key={run.id} className="rise" style={{ animationDelay: `${Math.min(index, 10) * 35}ms` }}>
                    <button
                      onClick={() => {
                        setSelectedRunId(run.id);
                        setSuite(run.suite);
                        setResultsFrom("history");
                        setActiveView("results");
                      }}
                      className="group flex w-full items-center gap-4 rounded-xl px-3.5 py-3.5 text-left transition-colors hover:bg-indigo-soft/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
                    >
                      <span className="hidden w-[88px] shrink-0 sm:block">
                        <span className="font-mono-data block text-[12px] text-ink">{new Date(run.generatedAt).toLocaleDateString()}</span>
                        <span className="font-mono-data block text-[11px] text-ink-3">
                          {new Date(run.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-semibold text-ink">{run.prdName}</span>
                        <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span className="font-mono-data rounded-md bg-ink/[0.05] px-1.5 text-[11px] leading-5 text-ink-2">{run.totalCases} cases</span>
                          <span className={`font-mono-data rounded-md px-1.5 text-[11px] leading-5 ${high ? "bg-sev-high-bg text-sev-high" : "bg-ink/[0.05] text-ink-3"}`}>
                            {high} high
                          </span>
                          <span className="font-mono-data rounded-md bg-indigo-soft px-1.5 text-[11px] leading-5 text-indigo-deep">{covered}/12 areas</span>
                          <span className="font-mono-data text-[11px] text-ink-3 sm:hidden">{new Date(run.generatedAt).toLocaleDateString()}</span>
                        </span>
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-6 py-16 text-center">
              <p className="text-[15px] font-semibold text-ink">No runs yet</p>
              <p className="mx-auto mt-1.5 max-w-[42ch] text-[13px] text-ink-3">Your first generated suite will appear here.</p>
              <Button variant="outline" size="sm" className="mt-5" onClick={() => setActiveView("new")}>
                Start a new analysis
              </Button>
            </div>
          )}
        </Window>
        <p className="mt-4 px-1 text-[12px] text-ink-3">
          Stored in this browser for your account. It doesn't sync across devices, and clearing site data removes it.
        </p>
      </div>
    );
  }

  function renderKnowledgeBaseView() {
    return (
      <div>
        <PageHead
          title="Knowledge base"
          lede="The references every run is grounded in — API contracts, policies, process docs. Read once, kept in this browser, applied automatically."
        />
        <input ref={kbInputRef} type="file" className="hidden" accept=".pdf,.docx,.md,.txt,.csv,.json,.rtf" multiple onChange={handleKnowledgeBaseChange} />
        <Window
          title="Library"
          icon={<Layers className="h-4 w-4" strokeWidth={2} />}
          controls={
            <>
              {docCount ? (
                <Button variant="ghost" size="sm" onClick={handleClearKnowledgeBase} className="hidden text-ink-3 hover:text-sev-high sm:inline-flex">
                  Clear all
                </Button>
              ) : null}
              <Button size="sm" onClick={() => kbInputRef.current?.click()} disabled={isUploading}>
                <Plus className="h-4 w-4" strokeWidth={2.2} />
                {isUploading ? "Reading…" : "Add"}
              </Button>
            </>
          }
        >
          {docCount ? (
            <ul className="space-y-1.5 p-2.5">
              {savedKnowledgeBaseDocs.map((doc, index) => (
                <li
                  key={doc.id}
                  className="rise group flex items-start gap-3 rounded-xl border hairline bg-window px-3.5 py-3 transition-colors hover:bg-window-sunk"
                  style={{ animationDelay: `${Math.min(index, 10) * 35}ms` }}
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-soft text-indigo">
                    <Paperclip className="h-4 w-4" strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-ink">{doc.name}</p>
                    <p className="font-mono-data mt-1 line-clamp-2 text-[12px] leading-relaxed text-ink-3">{doc.excerpt}</p>
                    <p className="mt-2 flex flex-wrap gap-x-3 text-[12px] text-ink-3">
                      <span>Added {new Date(doc.addedAt).toLocaleDateString()}</span>
                      <span className="font-mono-data">{doc.extractedText.length.toLocaleString()} chars</span>
                      {doc.truncated ? <span className="text-sev-med">Truncated at size limit</span> : null}
                    </p>
                  </div>
                  <button
                    onClick={() => removeKnowledgeBaseDoc(doc.id)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-sev-high-bg hover:text-sev-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                    <span className="sr-only">Remove {doc.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-6 py-16 text-center">
              <span className="pop mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-soft text-indigo">
                <Layers className="h-6 w-6" strokeWidth={1.8} />
              </span>
              <p className="mt-4 text-[15px] font-semibold text-ink">No references yet</p>
              <p className="mx-auto mt-1.5 max-w-[46ch] text-[13px] text-ink-3">
                Add the documents a senior tester keeps open while reading a PRD.
              </p>
            </div>
          )}
        </Window>
        <p className="mt-4 px-1 text-[12px] text-ink-3">Text is extracted once and kept in this browser for your account. Nothing is stored on the server.</p>
      </div>
    );
  }

  const view = isLoading
    ? renderRunView()
    : activeView === "new"
      ? renderNewAnalysisView()
      : activeView === "results"
        ? renderResultsView()
        : activeView === "history"
          ? renderHistoryView()
          : renderKnowledgeBaseView();

  return (
    <AppShell
      section={navSection}
      onNavigate={(next) => setActiveView(next)}
      runCount={previousRuns.length}
      docCount={docCount}
      status={tunnel}
    >
      {/* Keyed so each view change replays its entrance. */}
      <div key={isLoading ? "run" : activeView}>{view}</div>
    </AppShell>
  );
}
