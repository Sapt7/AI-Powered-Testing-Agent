import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TestCaseExplorer } from "@/components/TestCaseExplorer";
import { generateTestCases, parseDocuments } from "@/lib/api";
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
import { ArrowLeft, FileUp, Paperclip, Plus } from "lucide-react";

interface AttachedPrd {
  file: File;
  excerpt: string;
}

type WorkspaceView = "new" | "results" | "history" | "knowledge-base";

/** Sheet: the white working surface, filed on the beige stock. */
function Sheet({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`sheet-in rounded-lg border border-rule bg-paper shadow-sheet ${className}`}>
      {children}
    </div>
  );
}

/** A ruled section head. No eyebrow above it — the heading carries itself. */
function SectionRule({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 border-b border-rule px-6 py-3">
      <span aria-hidden className="h-2.5 w-[3px] rounded-sm bg-blue" />
      <span className="label-spec">{children}</span>
    </div>
  );
}

/** Title block: the metadata record at the head of a drawing. */
function TitleBlock({ fields }: { fields: { label: string; value: string }[] }) {
  return (
    <dl className="grid grid-cols-2 divide-x divide-y divide-rule border-b border-rule sm:grid-cols-4 sm:divide-y-0">
      {fields.map((field) => (
        <div key={field.label} className="px-5 py-3.5 first:border-l-0">
          <dt className="label-spec">{field.label}</dt>
          <dd
            data-numeric
            className="mt-1.5 truncate text-[13px] font-medium leading-tight text-ink"
            title={field.value}
          >
            {field.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Storage is browser-local in v1; say so where the data lives, not only in docs. */
function LocalStorageNote({ children }: { children: React.ReactNode }) {
  return <p className="text-[12px] leading-relaxed text-ink-faint">{children}</p>;
}

export default function Index() {
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const userSub = user?.sub ?? "";
  const prdInputRef = useRef<HTMLInputElement | null>(null);
  const kbInputRef = useRef<HTMLInputElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeView, setActiveView] = useState<WorkspaceView>("new");
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

  async function handlePrdChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setPrd({ file, excerpt: await extractExcerpt(file) });
    setSuite(null);
    setActiveView("new");
    toast({
      title: "PRD attached",
      description: `${file.name} is ready for analysis.`,
    });
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
        description: "Attach a PRD before generating test cases.",
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

  function renderNewAnalysisView() {
    return (
      <div className="mx-auto max-w-4xl">
        <Sheet>
          <div className="border-b border-rule px-6 py-5">
            <h2 className="text-[26px] font-semibold leading-tight tracking-tighter text-ink">
              New analysis
            </h2>
            <p className="mt-1.5 max-w-[68ch] text-[13px] leading-relaxed text-ink-soft">
              Attach a product requirements document. Your retained knowledge base is applied
              automatically.
            </p>
          </div>

          <SectionRule>Source document</SectionRule>

          <div className="px-6 py-5">
            <button
              onClick={() => prdInputRef.current?.click()}
              className="flex w-full items-center gap-4 rounded-lg border border-dashed border-rule-strong bg-paper-sunk px-5 py-5 text-left transition-colors duration-150 hover:border-blue hover:bg-blue-wash focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-rule-strong bg-paper text-ink-soft">
                <FileUp className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-medium text-ink">
                  {prd ? prd.file.name : "Attach a PRD"}
                </span>
                <span className="mt-0.5 block text-[12px] leading-snug text-ink-faint">
                  {prd
                    ? "Click to replace this document."
                    : "PDF, DOCX, TXT, MD or RTF. One document per run."}
                </span>
              </span>
            </button>

            <input
              ref={prdInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.docx,.md,.txt,.rtf"
              onChange={handlePrdChange}
            />

            {prd?.excerpt ? (
              <p className="mt-4 max-w-[68ch] border-l border-rule pl-4 text-[12px] leading-relaxed text-ink-faint">
                {prd.excerpt}
              </p>
            ) : null}
          </div>

          <SectionRule>Supporting context</SectionRule>

          <div className="flex items-center justify-between gap-4 px-6 py-4">
            <p className="max-w-[68ch] text-[13px] leading-relaxed text-ink-soft">
              {savedKnowledgeBaseDocs.length ? (
                <>
                  <span data-numeric className="font-medium text-ink">
                    {savedKnowledgeBaseDocs.length}
                  </span>{" "}
                  retained document{savedKnowledgeBaseDocs.length === 1 ? "" : "s"} will support this
                  analysis.
                </>
              ) : (
                "No documents retained yet. Generation still runs from the PRD alone."
              )}
            </p>
            <Button variant="outline" size="sm" onClick={() => setActiveView("knowledge-base")}>
              Manage
            </Button>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-rule bg-paper-sunk px-6 py-4">
            <p className="text-[12px] text-ink-faint">
              {prd ? "Ready to generate." : "Attach a PRD to continue."}
            </p>
            <Button onClick={handleAnalyze} disabled={isLoading || !prd}>
              Generate coverage
            </Button>
          </div>
        </Sheet>
      </div>
    );
  }

  function renderResultsView() {
    if (!resultsSuite) {
      return (
        <div className="mx-auto max-w-4xl">
          <Sheet className="px-6 py-14 text-center">
            <h2 className="text-[17px] font-semibold tracking-tight text-ink">No suite selected</h2>
            <p className="mx-auto mt-2 max-w-[52ch] text-[13px] leading-relaxed text-ink-soft">
              Generate a new analysis, or reopen one from previous runs.
            </p>
          </Sheet>
        </div>
      );
    }

    const highCount = resultsSuite.cases.filter((item) => item.criticality === "High").length;

    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <button
          onClick={() => setActiveView("new")}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-faint transition-colors hover:text-blue"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
          New analysis
        </button>

        <Sheet>
          <div className="border-b border-rule px-6 py-5">
            <h2 className="break-words text-[24px] font-semibold leading-tight tracking-tighter text-ink">
              {resultsSuite.featureName}
            </h2>
            <p className="mt-1.5 max-w-[68ch] text-[13px] leading-relaxed text-ink-soft">
              {resultsSuite.shortSummary}
            </p>
          </div>

          <TitleBlock
            fields={[
              { label: "Document", value: resultPrdName },
              {
                label: "Generated",
                value: selectedRun ? new Date(selectedRun.generatedAt).toLocaleDateString() : "—",
              },
              { label: "Cases", value: String(resultsSuite.cases.length) },
              { label: "High priority", value: String(highCount) },
            ]}
          />
        </Sheet>

        <TestCaseExplorer suite={resultsSuite} />
      </div>
    );
  }

  function renderHistoryView() {
    return (
      <div className="mx-auto max-w-5xl">
        <Sheet>
          <div className="flex items-start justify-between gap-4 border-b border-rule px-6 py-5">
            <div>
              <h2 className="text-[26px] font-semibold leading-tight tracking-tighter text-ink">
                Previous runs
              </h2>
              <p className="mt-1.5 max-w-[68ch] text-[13px] leading-relaxed text-ink-soft">
                Every generated suite is filed here and reopens exactly as produced.
              </p>
            </div>
            {previousRuns.length ? (
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 text-ink-faint hover:text-destructive"
                onClick={handleClearRuns}
              >
                Clear all
              </Button>
            ) : null}
          </div>

          {previousRuns.length ? (
            <ul className="divide-y divide-rule">
              {previousRuns.map((run, index) => (
                <li key={run.id}>
                  <button
                    onClick={() => {
                      setSelectedRunId(run.id);
                      setSuite(run.suite);
                      setActiveView("results");
                    }}
                    className="group flex w-full items-start gap-4 px-6 py-4 text-left transition-colors duration-150 hover:bg-blue-wash focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue"
                  >
                    <span
                      data-numeric
                      className="mt-0.5 w-6 shrink-0 text-[12px] font-medium text-ink-faint"
                    >
                      {String(previousRuns.length - index).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-ink">
                        {run.prdName}
                      </span>
                      <span className="mt-1 block max-w-[68ch] truncate text-[12px] leading-relaxed text-ink-faint">
                        {run.prdExcerpt}
                      </span>
                    </span>
                    <span className="ml-2 hidden shrink-0 items-baseline gap-5 text-[12px] text-ink-soft sm:flex">
                      <span data-numeric>{run.totalCases} cases</span>
                      <span data-numeric>
                        {run.suite.cases.filter((item) => item.criticality === "High").length} high
                      </span>
                      <time data-numeric className="text-ink-faint">
                        {new Date(run.generatedAt).toLocaleDateString()}
                      </time>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-6 py-14 text-center">
              <p className="text-[13px] font-medium text-ink">No runs filed yet</p>
              <p className="mx-auto mt-1.5 max-w-[52ch] text-[13px] leading-relaxed text-ink-soft">
                Generate from your first PRD and it will appear here.
              </p>
            </div>
          )}

          <div className="border-t border-rule bg-paper-sunk px-6 py-3.5">
            <LocalStorageNote>
              History is stored in this browser, for this account. It does not sync to other
              devices, and clearing site data removes it.
            </LocalStorageNote>
          </div>
        </Sheet>
      </div>
    );
  }

  function renderKnowledgeBaseView() {
    return (
      <div className="mx-auto max-w-5xl">
        <Sheet>
          <div className="flex items-start justify-between gap-4 border-b border-rule px-6 py-5">
            <div>
              <h2 className="text-[26px] font-semibold leading-tight tracking-tighter text-ink">
                Knowledge base
              </h2>
              <p className="mt-1.5 max-w-[68ch] text-[13px] leading-relaxed text-ink-soft">
                Retained references that ground every future analysis.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {savedKnowledgeBaseDocs.length ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-ink-faint hover:text-destructive"
                  onClick={handleClearKnowledgeBase}
                >
                  Clear all
                </Button>
              ) : null}
              <Button onClick={() => kbInputRef.current?.click()} size="sm" disabled={isUploading}>
                <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                {isUploading ? "Reading…" : "Add"}
              </Button>
            </div>
          </div>

          <input
            ref={kbInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,.md,.txt,.csv,.json,.rtf"
            multiple
            onChange={handleKnowledgeBaseChange}
          />

          {savedKnowledgeBaseDocs.length ? (
            <ul className="divide-y divide-rule">
              {savedKnowledgeBaseDocs.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-start gap-4 px-6 py-4 transition-colors duration-150 hover:bg-paper-sunk"
                >
                  <Paperclip className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" strokeWidth={1.75} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-ink">{doc.name}</p>
                    <p className="mt-1 max-w-[68ch] text-[12px] leading-relaxed text-ink-faint">
                      {doc.excerpt}
                    </p>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-3 text-[11px] text-ink-faint">
                      <time data-numeric>Added {new Date(doc.addedAt).toLocaleDateString()}</time>
                      {doc.truncated ? <span>Truncated at the size limit</span> : null}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-ink-faint hover:text-destructive"
                    onClick={() => removeKnowledgeBaseDoc(doc.id)}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-6 py-14 text-center">
              <p className="text-[13px] font-medium text-ink">No documents retained</p>
              <p className="mx-auto mt-1.5 max-w-[52ch] text-[13px] leading-relaxed text-ink-soft">
                Add supporting references so future analyses carry your product context.
              </p>
            </div>
          )}

          <div className="border-t border-rule bg-paper-sunk px-6 py-3.5">
            <LocalStorageNote>
              Documents are read once and their text is kept in this browser, for this account.
              Nothing is stored on the server.
            </LocalStorageNote>
          </div>
        </Sheet>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar
          activeView={activeView}
          knowledgeBaseCount={savedKnowledgeBaseDocs.length}
          previousRunCount={previousRuns.length}
          onNavigate={(view) => setActiveView(view)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-12 items-center gap-3 border-b border-rule bg-paper px-4">
            <SidebarTrigger className="h-7 w-7 text-ink-faint hover:text-ink" />
            <span className="hidden text-[12px] text-ink-faint sm:inline">
              Turn PRDs and internal context into QA-ready coverage
            </span>

            <div className="ml-auto flex items-center gap-3">
              <span className="hidden text-[12px] text-ink-soft sm:inline" title={user?.email}>
                {user?.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="text-ink-faint hover:text-ink"
              >
                Sign out
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-auto bg-background p-5 md:p-8">
            {isLoading ? (
              <div className="mx-auto max-w-4xl">
                <Sheet className="px-6 py-16 text-center">
                  <div aria-hidden className="mx-auto mb-5 h-px w-32 overflow-hidden bg-rule">
                    <div className="h-px w-1/3 animate-[sheet-scan_1.4s_ease-in-out_infinite] bg-blue" />
                  </div>
                  <p className="text-[13px] font-medium text-ink">Analyzing document</p>
                  <p className="mx-auto mt-1.5 max-w-[52ch] text-[13px] leading-relaxed text-ink-soft">
                    Parsing the PRD, reconciling retained context, and drafting coverage. This
                    usually takes one to three minutes.
                  </p>
                </Sheet>
              </div>
            ) : activeView === "new" ? (
              renderNewAnalysisView()
            ) : activeView === "results" ? (
              renderResultsView()
            ) : activeView === "history" ? (
              renderHistoryView()
            ) : (
              renderKnowledgeBaseView()
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
