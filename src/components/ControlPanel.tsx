import { Button } from "@/components/ui/button";

interface ControlPanelProps {
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
      <label className="text-xs font-mono-data uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`px-3 py-1.5 rounded text-xs font-mono-data transition-all border ${
              value === opt
                ? "bg-primary/15 border-primary text-primary glow-primary"
                : "bg-secondary border-border text-secondary-foreground hover:border-muted-foreground"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ControlPanel({
  timeframe,
  setTimeframe,
  lookback,
  setLookback,
  riskStyle,
  setRiskStyle,
  onAnalyze,
  isLoading,
}: ControlPanelProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-5 space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <h2 className="text-sm font-semibold tracking-wide uppercase text-foreground">
          Analysis Parameters
        </h2>
      </div>

      <ChipGroup label="Timeframe" options={timeframes} value={timeframe} onChange={setTimeframe} />
      <ChipGroup label="Lookback Period" options={lookbacks} value={lookback} onChange={setLookback} />
      <ChipGroup label="Risk Style" options={riskStyles} value={riskStyle} onChange={setRiskStyle} />

      <Button
        onClick={onAnalyze}
        disabled={isLoading}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-mono-data uppercase tracking-wider text-sm glow-primary"
      >
        {isLoading ? "Analyzing…" : "Run Analysis"}
      </Button>
    </div>
  );
}
