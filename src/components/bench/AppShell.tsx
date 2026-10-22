import type { ReactNode } from "react";
import { History, Layers, LogOut, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { TunnelStatus } from "@/hooks/use-tunnel-status";
import { BrandMark, StatusPill } from "@/components/bench/ui";

export type Section = "new" | "history" | "knowledge-base";

interface AppShellProps {
  section: Section;
  onNavigate: (section: Section) => void;
  runCount: number;
  docCount: number;
  status: TunnelStatus;
  children: ReactNode;
}

const SECTIONS: { id: Section; label: string; short: string; icon: typeof Sparkles }[] = [
  { id: "new", label: "New analysis", short: "Analyze", icon: Sparkles },
  { id: "history", label: "Previous runs", short: "Runs", icon: History },
  { id: "knowledge-base", label: "Knowledge base", short: "Library", icon: Layers },
];

/**
 * Desktop: a floating glass capsule centred over the page, like a native toolbar.
 * Phone: a compact top bar plus a bottom tab bar within thumb reach, padded for
 * the home indicator.
 */
export function AppShell({ section, onNavigate, runCount, docCount, status, children }: AppShellProps) {
  const { user, signOut } = useAuth();
  const countFor = (id: Section) => (id === "history" ? runCount : id === "knowledge-base" ? docCount : null);

  return (
    <div className="relative min-h-screen w-full">
      {/* Desktop capsule */}
      <div className="sticky top-0 z-40 hidden px-6 pt-4 md:block">
        <nav
          aria-label="Sections"
          className="glass fade mx-auto flex h-14 max-w-[1120px] items-center gap-1 rounded-2xl border hairline px-2.5 shadow-raised"
        >
          <span className="flex items-center gap-2 pl-1 pr-3">
            <BrandMark className="h-7 w-7" />
            <span className="whitespace-nowrap text-[14px] font-semibold tracking-[-0.01em] text-ink">
              AI Powered Testing Agent
            </span>
          </span>
          <span aria-hidden className="mx-1 h-5 w-px bg-ink/10" />
          {SECTIONS.map((item) => {
            const active = section === item.id;
            const count = countFor(item.id);
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                aria-current={active ? "page" : undefined}
                className={`relative flex h-9 items-center gap-2 rounded-lg px-3 text-[13px] font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo ${
                  active ? "bg-indigo-soft text-indigo-deep" : "text-ink-2 hover:bg-ink/[0.04] hover:text-ink"
                }`}
              >
                {item.label}
                {typeof count === "number" ? (
                  <span
                    className={`font-mono-data rounded-[5px] px-1.5 text-[11px] leading-5 ${
                      active ? "bg-indigo text-white" : "bg-ink/[0.06] text-ink-2"
                    }`}
                  >
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
          <div className="ml-auto flex items-center gap-2.5">
            <span className="hidden lg:inline-flex">
              <StatusPill status={status} />
            </span>
            <span className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-1">
              {user?.picture ? (
                <img src={user.picture} alt="" referrerPolicy="no-referrer" className="h-8 w-8 rounded-full" />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-soft text-[13px] font-semibold text-indigo-deep">
                  {(user?.name ?? "?").slice(0, 1)}
                </span>
              )}
              <span className="hidden max-w-[140px] truncate text-[13px] font-medium text-ink xl:inline" title={user?.email}>
                {user?.name}
              </span>
              <button
                onClick={signOut}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-ink/[0.05] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.8} />
                <span className="sr-only">Sign out</span>
              </button>
            </span>
          </div>
        </nav>
      </div>

      {/* Phone top bar */}
      <header className="glass sticky top-0 z-40 flex h-14 items-center gap-2.5 border-b hairline px-4 md:hidden">
        <BrandMark className="h-7 w-7" />
        <span className="truncate text-[15px] font-semibold tracking-[-0.01em] text-ink">AI Powered Testing Agent</span>
        <button
          onClick={signOut}
          className="ml-auto flex h-10 w-10 items-center justify-center rounded-xl text-ink-3 active:bg-ink/[0.06]"
        >
          <LogOut className="h-[18px] w-[18px]" strokeWidth={1.8} />
          <span className="sr-only">Sign out</span>
        </button>
      </header>

      <main className="bottom-safe-nav mx-auto w-full max-w-[1120px] px-4 pt-6 md:px-6 md:pb-16 md:pt-10">
        {children}
      </main>

      {/* Phone tab bar */}
      <nav
        aria-label="Sections"
        className="glass pb-safe fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t hairline pt-1.5 md:hidden"
      >
        {SECTIONS.map((item) => {
          const Icon = item.icon;
          const active = section === item.id;
          const count = countFor(item.id);
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              aria-current={active ? "page" : undefined}
              className={`relative flex min-h-[52px] flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                active ? "text-indigo" : "text-ink-3"
              }`}
            >
              <span className="relative">
                <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.2 : 1.8} />
                {count ? (
                  <span className="font-mono-data absolute -right-3 -top-1.5 rounded-full bg-indigo px-1 text-[10px] leading-4 text-white">
                    {count}
                  </span>
                ) : null}
              </span>
              {item.short}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
