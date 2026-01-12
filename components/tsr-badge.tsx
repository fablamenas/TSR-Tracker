"use client"

import { cn } from "@/lib/utils"

interface TSRBadgeProps {
  period: string
  value: number
}

export function TSRBadge({ period, value }: TSRBadgeProps) {
  const isPositive = value >= 0
  const isStrongMove = Math.abs(value) > 10
  const badgeClass = isPositive
    ? isStrongMove
      ? "bg-emerald-600 text-white"
      : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
    : isStrongMove
      ? "bg-red-600 text-white"
      : "bg-red-500/20 text-red-700 dark:text-red-300"

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-muted-foreground font-medium">{period}</span>
      <span
        className={cn(
          "px-2.5 py-1 rounded-full text-sm font-semibold min-w-[70px] text-center",
          badgeClass,
        )}
      >
        {isPositive ? "+" : ""}
        {value.toFixed(1)}%
      </span>
    </div>
  )
}
