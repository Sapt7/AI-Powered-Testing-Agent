import { FileClock, FilePlus2, FolderClosed, SquareStack } from "lucide-react";
import { Sidebar, SidebarContent, SidebarHeader, useSidebar } from "@/components/ui/sidebar";

interface AppSidebarProps {
  activeView: "new" | "results" | "history" | "knowledge-base";
  knowledgeBaseCount: number;
  previousRunCount: number;
  onNavigate: (view: "new" | "history" | "knowledge-base") => void;
}

export function AppSidebar({
  activeView,
  knowledgeBaseCount,
  previousRunCount,
  onNavigate,
}: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const isNewActive = activeView === "new" || activeView === "results";

  const tabs = [
    {
      id: "new" as const,
      index: "01",
      label: "New analysis",
      description: "Upload a PRD and generate coverage.",
      icon: FilePlus2,
      active: isNewActive,
      count: null,
    },
    {
      id: "history" as const,
      index: "02",
      label: "Previous runs",
      description: "Reopen a generated suite.",
      icon: FileClock,
      active: activeView === "history",
      count: previousRunCount,
    },
    {
      id: "knowledge-base" as const,
      index: "03",
      label: "Knowledge base",
      description: "Retained supporting documents.",
      icon: FolderClosed,
      active: activeView === "knowledge-base",
      count: knowledgeBaseCount,
    },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-ink text-paper">
            <SquareStack className="h-3.5 w-3.5" strokeWidth={1.75} />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold leading-tight tracking-tight text-ink">
                Test Case Generator
              </p>
              <p className="mt-0.5 text-[11px] leading-tight text-ink-faint">QA coverage workspace</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {!collapsed && (
          <nav className="flex flex-col pt-3" aria-label="Sections">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => onNavigate(tab.id)}
                  aria-current={tab.active ? "page" : undefined}
                  className={`group relative -mr-px flex items-start gap-2.5 border-y border-transparent py-3 pl-4 pr-3 text-left transition-colors duration-150 ${
                    tab.active
                      ? "border-y-sidebar-border bg-paper"
                      : "hover:bg-stock/60"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`mt-[3px] block h-3.5 w-[3px] rounded-sm transition-colors ${
                      tab.active ? "bg-blue" : "bg-transparent"
                    }`}
                  />
                  <Icon
                    className={`mt-px h-4 w-4 shrink-0 ${tab.active ? "text-blue" : "text-ink-faint"}`}
                    strokeWidth={1.75}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span
                        className={`text-[13px] font-medium leading-tight ${
                          tab.active ? "text-ink" : "text-ink-soft"
                        }`}
                      >
                        {tab.label}
                      </span>
                      {typeof tab.count === "number" ? (
                        <span
                          data-numeric
                          className={`shrink-0 text-[11px] font-medium ${
                            tab.active ? "text-blue" : "text-ink-faint"
                          }`}
                        >
                          {tab.count}
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-1 block text-[11px] leading-snug text-ink-faint">
                      {tab.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
