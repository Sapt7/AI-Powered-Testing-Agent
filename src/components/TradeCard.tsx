import type { TradeRecommendation } from "@/lib/mockData";
import { Target, Ban, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface TradeCardProps {
  recommendation: TradeRecommendation;
}

export default function TradeCard({ recommendation: r }: TradeCardProps) {
  const isNoTrade = r.type === "NO_TRADE";
  const isCE = r.type === "CE";

  const confidenceColor =
    r.confidence >= 65
      ? "text-bullish"
      : r.confidence >= 40
      ? "text-neutral"
      : "text-bearish";

  const confidenceBarColor =
    r.confidence >= 65
      ? "bg-bullish"
      : r.confidence >= 40
      ? "bg-neutral"
      : "bg-bearish";

  if (isNoTrade) {
    return (
      <div className="bg-card shadow-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-bearish/10 flex items-center justify-center">
            <Ban className="w-3.5 h-3.5 text-bearish" />
          </div>
          <h2 className="text-xs font-semibold text-bearish">
            No Trade Recommended
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-3xl font-mono-data font-bold ${confidenceColor}`}>
            {r.confidence}%
          </span>
          <span className="text-xs text-muted-foreground">confidence</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full ${confidenceBarColor} transition-all`}
            style={{ width: `${r.confidence}%` }}
          />
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{r.whyNotTrade}</p>
      </div>
    );
  }

  return (
    <div className="bg-card shadow-card border border-border rounded-xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
            isCE ? "bg-bullish/10" : "bg-bearish/10"
          }`}>
            {isCE ? (
              <ArrowUpRight className="w-3.5 h-3.5 text-bullish" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 text-bearish" />
            )}
          </div>
          <h2 className="text-xs font-semibold text-muted-foreground">
            Trade Recommendation
          </h2>
        </div>
        <span
          className={`text-[11px] font-mono-data px-2.5 py-1 rounded-lg font-semibold ${
            isCE
              ? "text-bullish bg-bullish/8"
              : "text-bearish bg-bearish/8"
          }`}
        >
          BUY {r.type}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className={`text-3xl font-mono-data font-bold ${confidenceColor}`}>
          {r.confidence}%
        </span>
        <span className="text-xs text-muted-foreground">confidence</span>
      </div>
      <div className="w-full bg-secondary rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full ${confidenceBarColor} transition-all`}
          style={{ width: `${r.confidence}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <DataCell label="Strike" value={r.strike.toLocaleString()} />
        <DataCell label="Expiry" value={r.expiry} />
        <DataCell label="Entry Zone" value={`${r.entryZone[0]} – ${r.entryZone[1]}`} />
        <DataCell label="Stop Loss" value={r.stopLoss.toLocaleString()} highlight="bearish" />
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2.5">
          Targets
        </p>
        <div className="flex gap-2">
          {r.targets.map((t, i) => (
            <div key={i} className="flex-1 bg-secondary/60 rounded-lg p-3 text-center">
              <p className="text-[10px] text-muted-foreground mb-0.5">T{i + 1}</p>
              <p className="text-sm font-mono-data font-bold text-bullish">
                {t.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-secondary/40 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            Why This Trade
          </p>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{r.whyThisTrade}</p>
      </div>
    </div>
  );
}

function DataCell({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: "bullish" | "bearish";
}) {
  return (
    <div className="bg-secondary/60 rounded-lg p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </p>
      <p
        className={`text-sm font-mono-data font-semibold ${
          highlight === "bearish"
            ? "text-bearish"
            : highlight === "bullish"
            ? "text-bullish"
            : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
