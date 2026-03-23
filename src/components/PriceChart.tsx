import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { CandleData } from "@/lib/mockData";

interface PriceChartProps {
  data: CandleData[];
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
}

export default function PriceChart({
  data,
  currentPrice,
  priceChange,
  priceChangePercent,
}: PriceChartProps) {
  const isPositive = priceChange >= 0;

  // Show fewer ticks
  const tickInterval = Math.max(1, Math.floor(data.length / 8));

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono-data">
            NIFTY 50
          </p>
          <p className="text-2xl font-mono-data font-bold text-foreground">
            {currentPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div
          className={`text-right font-mono-data text-sm ${
            isPositive ? "text-bullish" : "text-bearish"
          }`}
        >
          <p>
            {isPositive ? "▲" : "▼"} {Math.abs(priceChange).toFixed(2)}
          </p>
          <p>({priceChangePercent.toFixed(2)}%)</p>
        </div>
      </div>

      <div className="h-[300px] chart-grid rounded">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={isPositive ? "hsl(142, 70%, 45%)" : "hsl(0, 72%, 51%)"}
                  stopOpacity={0.3}
                />
                <stop
                  offset="100%"
                  stopColor={isPositive ? "hsl(142, 70%, 45%)" : "hsl(0, 72%, 51%)"}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke="hsl(222, 30%, 16%)"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: "hsl(215, 15%, 50%)" }}
              axisLine={false}
              tickLine={false}
              interval={tickInterval}
            />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fontSize: 10, fill: "hsl(215, 15%, 50%)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => v.toLocaleString()}
              width={60}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(222, 44%, 8%)",
                border: "1px solid hsl(222, 30%, 16%)",
                borderRadius: "6px",
                fontSize: "12px",
                fontFamily: "monospace",
                color: "hsl(210, 20%, 90%)",
              }}
            />
            <Area
              type="monotone"
              dataKey="close"
              stroke={isPositive ? "hsl(142, 70%, 45%)" : "hsl(0, 72%, 51%)"}
              fill="url(#priceGradient)"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
