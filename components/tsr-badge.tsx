"use client"

import { cn } from "@/lib/utils"

interface TSRBadgeProps {
  period: string
  value: number
}

export function TSRBadge({ period, value }: TSRBadgeProps) {
  const isPositive = value >= 0

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-muted-foreground font-medium">{period}</span>
      <span
        className={cn(
          "px-2.5 py-1 rounded-full text-sm font-semibold min-w-[70px] text-center",
          isPositive
            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            : "bg-red-500/15 text-red-600 dark:text-red-400",
        )}
      >
        {isPositive ? "+" : ""}
        {value.toFixed(1)}%
      </span>
    </div>
  )
}
