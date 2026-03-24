import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import PriceChart from "@/components/PriceChart";
import TrendAnalysis from "@/components/TrendAnalysis";
import TradeCard from "@/components/TradeCard";
import { runAnalysis, type CandleData, type AnalysisResult } from "@/lib/mockData";
import { BarChart3 } from "lucide-react";

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
      <div className="min-h-screen flex w-full bg-background">
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
          <header className="h-14 flex items-center border-b border-border bg-card px-5">
            <SidebarTrigger className="mr-3 text-muted-foreground hover:text-foreground" />
            <h1 className="text-sm font-semibold text-foreground">
              Options Signal Engine
            </h1>
            <span className="ml-2.5 text-[10px] font-medium uppercase tracking-widest px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
              Beta
            </span>
          </header>

          <main className="flex-1 p-8 overflow-auto">
            <div className="max-w-5xl mx-auto space-y-6">
              {!data && !isLoading && (
                <div className="bg-card shadow-card rounded-xl p-20 flex flex-col items-center justify-center text-center border border-dashed border-border">
                  <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center mb-5">
                    <BarChart3 className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <h2 className="text-base font-semibold text-foreground mb-1.5">
                    Run Your First Analysis
                  </h2>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Configure parameters in the sidebar and hit <span className="font-medium text-foreground">Run Analysis</span> to get started.
                  </p>
                </div>
              )}

              {isLoading && (
                <div className="bg-card shadow-card rounded-xl p-20 flex flex-col items-center justify-center border border-border">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-sm text-muted-foreground">Analyzing market data…</p>
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
