import { FileClock, FilePlus2, Layers3, LogOut } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, useSidebar } from "@/components/ui/sidebar";
import { BrandMark } from "@/components/tunnel/BrandMark";
import { useAuth } from "@/contexts/AuthContext";

interface AppSidebarProps {
  activeView: "new" | "results" | "history" | "knowledge-base";
  knowledgeBaseCount: number;
  previousRunCount: number;
  onNavigate: (view: "new" | "history" | "knowledge-base") => void;
}

/**
 * The instrument rail: the facility's control panel, in graphite. The active
 * section is marked by a lit lamp, the way a panel marks an engaged circuit.
 */
export function AppSidebar({
  activeView,
  knowledgeBaseCount,
  previousRunCount,
  onNavigate,
}: AppSidebarProps) {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const { user, signOut } = useAuth();
  const collapsed = state === "collapsed" && !isMobile;
  const isNewActive = activeView === "new" || activeView === "results";

  const items = [
    {
      id: "new" as const,
      label: "New analysis",
      hint: "Mount a PRD and run it",
      icon: FilePlus2,
      active: isNewActive,
      count: null,
    },
    {
      id: "history" as const,
      label: "Previous runs",
      hint: "The run log",
      icon: FileClock,
      active: activeView === "history",
      count: previousRunCount,
    },
    {
      id: "knowledge-base" as const,
      label: "Knowledge base",
      hint: "Flow conditioning",
      icon: Layers3,
      active: activeView === "knowledge-base",
      count: knowledgeBaseCount,
    },
  ];

  function navigate(view: (typeof items)[number]["id"]) {
    onNavigate(view);
    if (isMobile) {
      setOpenMobile(false);
    }
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-4 pb-4 pt-5">
        <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
          <BrandMark className="h-9 w-9 shrink-0" />
          {!collapsed && (
            <div className="min-w-0">
              <p className="w-semi-condensed text-[14px] font-bold leading-tight tracking-[-0.01em] text-flow">
                AI Powered Testing Agent
              </p>
              <p className="mt-1 text-[12px] leading-tight text-flow-3">QA coverage workspace</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2.5">
        {!collapsed ? <span className="placard px-2.5 pb-2 pt-3 text-flow-3">Sections</span> : null}
        <nav className="flex flex-col gap-1" aria-label="Sections">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                aria-current={item.active ? "page" : undefined}
                title={collapsed ? item.label : undefined}
                className={`group relative flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-left outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-safety ${
                  item.active ? "bg-graphite-3 text-flow" : "text-flow-2 hover:bg-graphite-2 hover:text-flow"
                } ${collapsed ? "justify-center" : ""}`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-colors ${
                    item.active
                      ? "border-safety/40 bg-safety/[0.12] text-safety"
                      : "border-flow/10 bg-graphite-2 text-flow-2 group-hover:text-flow"
                  }`}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
                {!collapsed && (
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold leading-tight">{item.label}</span>
                    <span className="mt-0.5 block text-[12px] leading-tight text-flow-3">{item.hint}</span>
                  </span>
                )}
                {!collapsed && typeof item.count === "number" ? (
                  <span
                    className={`font-mono-data rounded-sm px-1.5 py-0.5 text-[11px] ${
                      item.active ? "bg-safety text-ink" : "bg-graphite-2 text-flow-2"
                    }`}
                  >
                    {item.count}
                  </span>
                ) : null}
                {item.active ? (
                  <span
                    aria-hidden
                    className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-safety shadow-[0_0_6px_hsl(var(--safety))]"
                  />
                ) : null}
              </button>
            );
          })}
        </nav>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        {collapsed ? (
          <button
            onClick={signOut}
            title="Sign out"
            className="mx-auto flex h-9 w-9 items-center justify-center rounded-md text-flow-3 hover:bg-graphite-2 hover:text-flow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-safety"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
            <span className="sr-only">Sign out</span>
          </button>
        ) : (
          <div className="flex items-center gap-3 rounded-lg px-1.5 py-1">
            {user?.picture ? (
              <img
                src={user.picture}
                alt=""
                referrerPolicy="no-referrer"
                className="h-8 w-8 shrink-0 rounded-full border border-flow/15"
              />
            ) : (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-graphite-3 text-[12px] font-semibold text-flow">
                {(user?.name ?? "?").slice(0, 1)}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-flow" title={user?.email}>
                {user?.name}
              </p>
              <p className="truncate text-[12px] text-flow-3">{user?.email}</p>
            </div>
            <button
              onClick={signOut}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-flow-3 transition-colors hover:bg-graphite-2 hover:text-flow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-safety"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.75} />
              <span className="sr-only">Sign out</span>
            </button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
