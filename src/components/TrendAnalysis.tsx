import type { TrendPattern, AnalysisResult } from "@/lib/mockData";
import { TrendingUp, TrendingDown, Minus, Activity, BarChart3 } from "lucide-react";

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
    <div className="bg-card shadow-card border border-border rounded-xl p-6 space-y-5">
      <h2 className="text-xs font-semibold text-muted-foreground">
        Market Analysis
      </h2>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-secondary/60 rounded-lg p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
            Regime
          </p>
          <div className="flex items-center gap-2">
            <RegimeIcon className="w-4 h-4 text-foreground" />
            <span className="text-sm font-semibold text-foreground">{regimeLabel}</span>
          </div>
        </div>
        <div className="bg-secondary/60 rounded-lg p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
            Bias
          </p>
          <div className="flex items-center gap-2">
            <BiasIcon className={`w-4 h-4 ${colorClass}`} />
            <span className={`text-sm font-semibold ${colorClass}`}>{biasLabel}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Detected Patterns
        </p>
        {trends.map((t, i) => (
          <div key={i} className="border border-border rounded-lg p-3.5">
            <div className="flex items-center gap-2 mb-1.5">
              <div className={`w-2 h-2 rounded-full ${strengthDot[t.strength]}`} />
              <span className="text-xs font-semibold text-foreground">{t.name}</span>
              <span
                className={`ml-auto text-[10px] font-mono-data font-medium px-1.5 py-0.5 rounded ${
                  t.direction === "bullish"
                    ? "text-bullish bg-bullish/8"
                    : t.direction === "bearish"
                    ? "text-bearish bg-bearish/8"
                    : "text-neutral bg-neutral/8"
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
