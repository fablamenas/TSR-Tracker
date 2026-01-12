"use client"

import { LineChart, Line, ResponsiveContainer } from "recharts"

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
}

export function Sparkline({ data, width = 80, height = 32 }: SparklineProps) {
  if (!data || data.length < 2) {
    return <div className="w-20 h-8 bg-muted/30 rounded animate-pulse" />
  }

  const firstValue = data[0]
  const lastValue = data[data.length - 1]
  const isPositive = lastValue >= firstValue

  const chartData = data.map((value, index) => ({ value, index }))

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={isPositive ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 60%)"}
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
