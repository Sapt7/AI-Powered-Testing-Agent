// Mock index data generator

export interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TrendPattern {
  name: string;
  description: string;
  strength: "strong" | "moderate" | "weak";
  direction: "bullish" | "bearish" | "neutral";
}

export interface TradeRecommendation {
  type: "CE" | "PE" | "NO_TRADE";
  strike: number;
  expiry: string;
  entryZone: [number, number];
  stopLoss: number;
  targets: number[];
  confidence: number;
  whyThisTrade: string;
  whyNotTrade?: string;
}

export interface AnalysisResult {
  regime: "trending" | "range-bound" | "volatile";
  bias: "bullish" | "bearish" | "neutral";
  trends: TrendPattern[];
  recommendation: TradeRecommendation;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
}

function generatePriceData(
  timeframe: string,
  lookback: string
): CandleData[] {
  const points: CandleData[] = [];
  let basePrice = 22500 + Math.random() * 1000;
  
  const countMap: Record<string, number> = {
    "5 days": timeframe === "5 min" ? 390 : timeframe === "15 min" ? 130 : timeframe === "1 hour" ? 30 : 5,
    "15 days": timeframe === "5 min" ? 600 : timeframe === "15 min" ? 300 : timeframe === "1 hour" ? 90 : 15,
    "30 days": timeframe === "5 min" ? 600 : timeframe === "15 min" ? 400 : timeframe === "1 hour" ? 180 : 30,
    "3 months": timeframe === "15 min" ? 500 : timeframe === "1 hour" ? 360 : 90,
  };

  const count = countMap[lookback] || 100;
  const now = new Date();
  const volatility = 0.003;
  const trend = (Math.random() - 0.45) * 0.001;

  for (let i = count; i >= 0; i--) {
    const change = (Math.random() - 0.5) * 2 * volatility * basePrice + trend * basePrice;
    const open = basePrice;
    const close = basePrice + change;
    const high = Math.max(open, close) + Math.random() * volatility * basePrice * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * basePrice * 0.5;
    
    const date = new Date(now);
    if (timeframe === "5 min") date.setMinutes(date.getMinutes() - i * 5);
    else if (timeframe === "15 min") date.setMinutes(date.getMinutes() - i * 15);
    else if (timeframe === "1 hour") date.setHours(date.getHours() - i);
    else date.setDate(date.getDate() - i);

    const label = timeframe === "1 day"
      ? date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
      : date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }) +
        (timeframe !== "5 min" ? ` ${date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}` : "");

    points.push({
      time: label,
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +close.toFixed(2),
      volume: Math.floor(50000 + Math.random() * 200000),
    });

    basePrice = close;
  }

  return points;
}

function generateAnalysis(data: CandleData[], riskStyle: string): AnalysisResult {
  const last = data[data.length - 1];
  const first = data[0];
  const currentPrice = last.close;
  const priceChange = currentPrice - first.close;
  const priceChangePercent = (priceChange / first.close) * 100;

  const regimes: AnalysisResult["regime"][] = ["trending", "range-bound", "volatile"];
  const regime = regimes[Math.floor(Math.random() * 3)];
  
  const bias: AnalysisResult["bias"] = priceChange > 50 ? "bullish" : priceChange < -50 ? "bearish" : "neutral";

  const allTrends: TrendPattern[] = [
    { name: "Higher Highs & Higher Lows", description: "Price is making consecutive higher highs and higher lows, indicating a strong uptrend formation over the selected period.", strength: "strong", direction: "bullish" },
    { name: "MACD Bullish Crossover", description: "MACD line crossed above signal line with increasing histogram, suggesting building bullish momentum.", strength: "moderate", direction: "bullish" },
    { name: "Support at Moving Average", description: "Price bounced off the 20-period EMA twice, confirming it as dynamic support.", strength: "moderate", direction: "bullish" },
    { name: "Bearish Divergence on RSI", description: "RSI is making lower highs while price makes higher highs — a classic bearish divergence warning.", strength: "weak", direction: "bearish" },
    { name: "Volume Declining on Rally", description: "Volume is decreasing as price moves up, suggesting the rally may be losing steam.", strength: "weak", direction: "bearish" },
    { name: "Consolidation Near Resistance", description: "Price is consolidating in a tight range near a key resistance level, breakout or reversal imminent.", strength: "moderate", direction: "neutral" },
  ];

  const trends = allTrends.sort(() => Math.random() - 0.5).slice(0, 3 + Math.floor(Math.random() * 2));

  const isCE = bias === "bullish";
  const confidence = bias === "neutral" 
    ? 25 + Math.floor(Math.random() * 20)
    : riskStyle === "aggressive" 
      ? 55 + Math.floor(Math.random() * 30) 
      : riskStyle === "conservative" 
        ? 40 + Math.floor(Math.random() * 25) 
        : 45 + Math.floor(Math.random() * 30);

  const strikeStep = 50;
  const strike = Math.round(currentPrice / strikeStep) * strikeStep + (isCE ? 0 : 0);

  const noTrade = confidence < 40;

  const recommendation: TradeRecommendation = noTrade
    ? {
        type: "NO_TRADE",
        strike,
        expiry: getNextExpiry(),
        entryZone: [0, 0],
        stopLoss: 0,
        targets: [],
        confidence,
        whyThisTrade: "",
        whyNotTrade: "Market conditions are unclear. The index is range-bound with mixed signals from momentum indicators. RSI is near 50, MACD is flat, and there's no clear directional bias. It's better to wait for a decisive move above resistance or below support before entering.",
      }
    : {
        type: isCE ? "CE" : "PE",
        strike,
        expiry: getNextExpiry(),
        entryZone: isCE 
          ? [+(currentPrice - 30).toFixed(0), +(currentPrice - 10).toFixed(0)]
          : [+(currentPrice + 10).toFixed(0), +(currentPrice + 30).toFixed(0)],
        stopLoss: isCE ? +(currentPrice - 80).toFixed(0) : +(currentPrice + 80).toFixed(0),
        targets: isCE 
          ? [+(currentPrice + 60).toFixed(0), +(currentPrice + 120).toFixed(0), +(currentPrice + 180).toFixed(0)]
          : [+(currentPrice - 60).toFixed(0), +(currentPrice - 120).toFixed(0), +(currentPrice - 180).toFixed(0)],
        confidence,
        whyThisTrade: isCE
          ? `Strong bullish momentum detected with ${trends[0]?.name}. Price is trading above key moving averages with expanding volume. The ${riskStyle} approach suggests entering on a pullback to the entry zone with defined risk at the stop loss level.`
          : `Bearish pressure building with ${trends[0]?.name}. Price has broken below short-term support with increasing selling volume. The ${riskStyle} approach targets a move towards the next major support zone.`,
      };

  return { regime, bias, trends, recommendation, currentPrice, priceChange, priceChangePercent };
}

function getNextExpiry(): string {
  const now = new Date();
  const day = now.getDay();
  const daysUntilThursday = (4 - day + 7) % 7 || 7;
  const expiry = new Date(now);
  expiry.setDate(now.getDate() + daysUntilThursday);
  return expiry.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function runAnalysis(timeframe: string, lookback: string, riskStyle: string) {
  const data = generatePriceData(timeframe, lookback);
  const analysis = generateAnalysis(data, riskStyle);
  return { data, analysis };
}
