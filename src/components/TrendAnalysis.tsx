import type { TrendPattern, AnalysisResult } from "@/lib/mockData";
import { TrendingUp, TrendingDown, Minus, Activity, BarChart3, Gauge } from "lucide-react";

interface TrendAnalysisProps {
  regime: AnalysisResult["regime"];
  bias: AnalysisResult["bias"];
  trends: TrendPattern[];
}

const biasConfig = {
  bullish: { icon: TrendingUp, label: "Bullish", colorClass: "text-bullish" },
  bearish: { icon: TrendingDown, label: "Bearish", colorClass: "text-bearish" },
  neutral: { icon: Minus, label: "Neutral", colorClass: "text-neutral" },
};

const regimeConfig = {
  trending: { icon: TrendingUp, label: "Trending" },
  "range-bound": { icon: BarChart3, label: "Range-Bound" },
  volatile: { icon: Activity, label: "Volatile" },
};

const strengthDot: Record<string, string> = {
  strong: "bg-bullish",
  moderate: "bg-neutral",
  weak: "bg-bearish",
};

export default function TrendAnalysis({ regime, bias, trends }: TrendAnalysisProps) {
  const { icon: BiasIcon, label: biasLabel, colorClass } = biasConfig[bias];
  const { icon: RegimeIcon, label: regimeLabel } = regimeConfig[regime];

  return (
    <div className="bg-card border border-border rounded-lg p-5 space-y-4">
      <h2 className="text-sm font-semibold tracking-wide uppercase text-foreground flex items-center gap-2">
        <Gauge className="w-4 h-4 text-primary" />
        Market Analysis
      </h2>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-secondary rounded-lg p-3">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 font-mono-data">
            Regime
          </p>
          <div className="flex items-center gap-1.5">
            <RegimeIcon className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">{regimeLabel}</span>
          </div>
        </div>
        <div className="bg-secondary rounded-lg p-3">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 font-mono-data">
            Bias
          </p>
          <div className="flex items-center gap-1.5">
            <BiasIcon className={`w-4 h-4 ${colorClass}`} />
            <span className={`text-sm font-medium ${colorClass}`}>{biasLabel}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono-data">
          Detected Patterns
        </p>
        {trends.map((t, i) => (
          <div key={i} className="bg-secondary/50 border border-border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-1.5 h-1.5 rounded-full ${strengthDot[t.strength]}`} />
              <span className="text-xs font-semibold text-foreground">{t.name}</span>
              <span
                className={`ml-auto text-[10px] font-mono-data uppercase ${
                  t.direction === "bullish"
                    ? "text-bullish"
                    : t.direction === "bearish"
                    ? "text-bearish"
                    : "text-neutral"
                }`}
              >
                {t.direction}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{t.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
