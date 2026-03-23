import { Activity } from "lucide-react";
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
    <div className="space-y-2">
      <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              value === opt
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-accent"
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
      <SidebarHeader className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-foreground shrink-0" />
          {!collapsed && (
            <span className="text-sm font-semibold tracking-tight truncate">
              Signal Engine
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {!collapsed && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Parameters
            </SidebarGroupLabel>
            <SidebarGroupContent className="px-3 pb-3 space-y-5">
              <ChipGroup label="Timeframe" options={timeframes} value={timeframe} onChange={setTimeframe} />
              <ChipGroup label="Lookback" options={lookbacks} value={lookback} onChange={setLookback} />
              <ChipGroup label="Risk Style" options={riskStyles} value={riskStyle} onChange={setRiskStyle} />

              <Button
                onClick={onAnalyze}
                disabled={isLoading}
                className="w-full text-xs font-medium uppercase tracking-wider"
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
