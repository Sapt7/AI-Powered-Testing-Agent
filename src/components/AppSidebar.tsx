import { BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

interface AppSidebarProps {
  timeframe: string;
  setTimeframe: (v: string) => void;
  lookback: string;
  setLookback: (v: string) => void;
  riskStyle: string;
  setRiskStyle: (v: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
}

const timeframes = ["5 min", "15 min", "1 hour", "1 day"];
const lookbacks = ["5 days", "15 days", "30 days", "3 months"];
const riskStyles = ["conservative", "balanced", "aggressive"];

function ChipGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2.5">
      <label className="text-[11px] font-medium text-muted-foreground">
        {label}
      </label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              value === opt
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary text-secondary-foreground hover:bg-muted"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AppSidebar({
  timeframe,
  setTimeframe,
  lookback,
  setLookback,
  riskStyle,
  setRiskStyle,
  onAnalyze,
  isLoading,
}: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
            <BarChart3 className="w-4 h-4 text-accent-foreground" />
          </div>
          {!collapsed && (
            <span className="text-sm font-semibold text-foreground truncate">
              Signal Engine
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {!collapsed && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground px-5 pt-4">
              Parameters
            </SidebarGroupLabel>
            <SidebarGroupContent className="px-5 pb-5 space-y-6 pt-2">
              <ChipGroup label="Timeframe" options={timeframes} value={timeframe} onChange={setTimeframe} />
              <ChipGroup label="Lookback Period" options={lookbacks} value={lookback} onChange={setLookback} />
              <ChipGroup label="Risk Style" options={riskStyles} value={riskStyle} onChange={setRiskStyle} />

              <Button
                onClick={onAnalyze}
                disabled={isLoading}
                className="w-full rounded-lg text-xs font-semibold tracking-wide h-10"
              >
                {isLoading ? "Analyzing…" : "Run Analysis"}
              </Button>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
