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
  const tickInterval = Math.max(1, Math.floor(data.length / 8));

  return (
    <div className="bg-card shadow-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs text-muted-foreground font-medium mb-1">
            NIFTY 50
          </p>
          <p className="text-2xl font-mono-data font-bold text-foreground">
            {currentPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div
          className={`text-right font-mono-data text-sm px-3 py-1.5 rounded-lg ${
            isPositive ? "text-bullish bg-bullish/8" : "text-bearish bg-bearish/8"
          }`}
        >
          <p className="font-semibold">
            {isPositive ? "+" : ""}{Math.abs(priceChange).toFixed(2)}
          </p>
          <p className="text-xs opacity-80">({priceChangePercent.toFixed(2)}%)</p>
        </div>
      </div>

      <div className="h-[300px] rounded-lg overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={isPositive ? "hsl(152, 55%, 40%)" : "hsl(0, 60%, 50%)"}
                  stopOpacity={0.12}
                />
                <stop
                  offset="100%"
                  stopColor={isPositive ? "hsl(152, 55%, 40%)" : "hsl(0, 60%, 50%)"}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke="hsl(220, 16%, 93%)"
              strokeDasharray="4 4"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: "hsl(220, 10%, 50%)" }}
              axisLine={false}
              tickLine={false}
              interval={tickInterval}
            />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fontSize: 10, fill: "hsl(220, 10%, 50%)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => v.toLocaleString()}
              width={60}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(0, 0%, 100%)",
                border: "1px solid hsl(220, 16%, 91%)",
                borderRadius: "10px",
                fontSize: "12px",
                fontFamily: "monospace",
                color: "hsl(220, 20%, 14%)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                padding: "8px 12px",
              }}
            />
            <Area
              type="monotone"
              dataKey="close"
              stroke={isPositive ? "hsl(152, 55%, 40%)" : "hsl(0, 60%, 50%)"}
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
