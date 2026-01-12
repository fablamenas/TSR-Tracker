"use client"

import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, LabelList } from "recharts"

interface TSRData {
  period: string
  tsr: number
}

interface TSRChartProps {
  data: TSRData[]
}

export function TSRChart({ data }: TSRChartProps) {
  const getBarColor = (value: number) => {
    if (value >= 0) return "hsl(142, 76%, 36%)" // green
    return "hsl(0, 84%, 60%)" // red
  }

  const formatLabel = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`
  }

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 30, right: 10, left: 10, bottom: 10 }}>
          <XAxis
            dataKey="period"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            axisLine={{ stroke: "hsl(var(--border))" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `${value}%`}
            width={45}
          />
          <Bar dataKey="tsr" radius={[4, 4, 0, 0]} maxBarSize={50}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.tsr)} />
            ))}
            <LabelList
              dataKey="tsr"
              position="top"
              formatter={formatLabel}
              style={{
                fill: "hsl(var(--foreground))",
                fontSize: 12,
                fontWeight: 600,
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
