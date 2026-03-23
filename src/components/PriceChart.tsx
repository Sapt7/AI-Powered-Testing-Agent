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
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mb-0.5">
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
            {isPositive ? "+" : ""}{Math.abs(priceChange).toFixed(2)}
          </p>
          <p className="text-xs">({priceChangePercent.toFixed(2)}%)</p>
        </div>
      </div>

      <div className="h-[300px] chart-grid rounded">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={isPositive ? "hsl(152, 60%, 36%)" : "hsl(0, 65%, 48%)"}
                  stopOpacity={0.15}
                />
                <stop
                  offset="100%"
                  stopColor={isPositive ? "hsl(152, 60%, 36%)" : "hsl(0, 65%, 48%)"}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke="hsl(220, 10%, 90%)"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: "hsl(220, 10%, 46%)" }}
              axisLine={false}
              tickLine={false}
              interval={tickInterval}
            />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fontSize: 10, fill: "hsl(220, 10%, 46%)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => v.toLocaleString()}
              width={60}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(0, 0%, 100%)",
                border: "1px solid hsl(220, 10%, 90%)",
                borderRadius: "6px",
                fontSize: "12px",
                fontFamily: "monospace",
                color: "hsl(220, 14%, 10%)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            />
            <Area
              type="monotone"
              dataKey="close"
              stroke={isPositive ? "hsl(152, 60%, 36%)" : "hsl(0, 65%, 48%)"}
              fill="url(#priceGradient)"
              strokeWidth={1.5}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
