import { useState } from "react";
import ControlPanel from "@/components/ControlPanel";
import PriceChart from "@/components/PriceChart";
import TrendAnalysis from "@/components/TrendAnalysis";
import TradeCard from "@/components/TradeCard";
import { runAnalysis, type CandleData, type AnalysisResult } from "@/lib/mockData";
import { Activity } from "lucide-react";

export default function Index() {
  const [timeframe, setTimeframe] = useState("15 min");
  const [lookback, setLookback] = useState("15 days");
  const [riskStyle, setRiskStyle] = useState("balanced");
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<CandleData[] | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const handleAnalyze = () => {
    setIsLoading(true);
    // Simulate async delay
    setTimeout(() => {
      const result = runAnalysis(timeframe, lookback, riskStyle);
      setData(result.data);
      setAnalysis(result.analysis);
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Activity className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Options Signal Engine
          </h1>
          <span className="ml-2 text-[10px] font-mono-data uppercase tracking-widest px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
            Beta
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Controls */}
          <div className="lg:col-span-3">
            <ControlPanel
              timeframe={timeframe}
              setTimeframe={setTimeframe}
              lookback={lookback}
              setLookback={setLookback}
              riskStyle={riskStyle}
              setRiskStyle={setRiskStyle}
              onAnalyze={handleAnalyze}
              isLoading={isLoading}
            />
          </div>

          {/* Right: Results */}
          <div className="lg:col-span-9 space-y-6">
            {!data && !isLoading && (
              <div className="bg-card border border-border rounded-lg p-16 flex flex-col items-center justify-center text-center">
                <Activity className="w-10 h-10 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-sm">
                  Configure parameters and hit <span className="text-primary font-medium">Run Analysis</span> to get started
                </p>
              </div>
            )}

            {isLoading && (
              <div className="bg-card border border-border rounded-lg p-16 flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-muted-foreground text-sm font-mono-data">Analyzing patterns…</p>
              </div>
            )}

            {data && analysis && !isLoading && (
              <>
                <PriceChart
                  data={data}
                  currentPrice={analysis.currentPrice}
                  priceChange={analysis.priceChange}
                  priceChangePercent={analysis.priceChangePercent}
                />
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <TrendAnalysis
                    regime={analysis.regime}
                    bias={analysis.bias}
                    trends={analysis.trends}
                  />
                  <TradeCard recommendation={analysis.recommendation} />
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
