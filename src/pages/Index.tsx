import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
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
    setTimeout(() => {
      const result = runAnalysis(timeframe, lookback, riskStyle);
      setData(result.data);
      setAnalysis(result.analysis);
      setIsLoading(false);
    }, 800);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar
          timeframe={timeframe}
          setTimeframe={setTimeframe}
          lookback={lookback}
          setLookback={setLookback}
          riskStyle={riskStyle}
          setRiskStyle={setRiskStyle}
          onAnalyze={handleAnalyze}
          isLoading={isLoading}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center border-b border-border px-4">
            <SidebarTrigger className="mr-3" />
            <h1 className="text-sm font-semibold text-foreground">
              Options Signal Engine
            </h1>
            <span className="ml-2 text-[10px] font-mono-data uppercase tracking-widest px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
              Beta
            </span>
          </header>

          <main className="flex-1 p-6 overflow-auto">
            <div className="max-w-6xl mx-auto space-y-6">
              {!data && !isLoading && (
                <div className="border border-dashed border-border rounded-lg p-16 flex flex-col items-center justify-center text-center">
                  <Activity className="w-8 h-8 text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground text-sm">
                    Configure parameters and hit{" "}
                    <span className="text-foreground font-medium">Run Analysis</span>
                  </p>
                </div>
              )}

              {isLoading && (
                <div className="border border-border rounded-lg p-16 flex flex-col items-center justify-center">
                  <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-muted-foreground text-sm">Analyzing…</p>
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
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
