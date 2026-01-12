"use client"

import useSWR from "swr"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkline } from "./sparkline"
import { TSRBadge } from "./tsr-badge"
import { Trash2, Loader2, AlertCircle, RefreshCw, TrendingUp } from "lucide-react"

interface StockCardProps {
  symbol: string
  name: string
  onRemove: () => void
}

interface TSRPeriod {
  period: string
  tsr: number
}

interface StockData {
  rollingTsr: TSRPeriod[]
  toDateTsr: TSRPeriod[]
  sparkline: number[]
  currentPrice: number
  currency: string
  fundamentals: {
    trailingPE: number | string
    beta: number | string
    dividend: number | string
  }
  debug?: {
    fundamentalsSource: "yahoo" | "fmp"
    fmpStatus: number | null
    fmpProfile: {
      pe?: number
      beta?: number
      lastDiv?: number
    } | null
    fmpUrl: string
  }
}

async function fetchStockData(symbol: string): Promise<StockData> {
  const response = await fetch(`/api/stock/${encodeURIComponent(symbol)}`)
  if (!response.ok) {
    throw new Error("Erreur lors de la récupération des données")
  }
  const data = (await response.json()) as StockData
  if (data.debug) {
    console.info("[stocks] API debug", { symbol, ...data.debug })
  }
  return data
}

export function StockCard({ symbol, name, onRemove }: StockCardProps) {
  const { data, error, isLoading, mutate } = useSWR<StockData>(`stock-${symbol}`, () => fetchStockData(symbol), {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  })

  const currencySymbol = (currency: string) => {
    switch (currency) {
      case "EUR":
        return "€"
      case "USD":
        return "$"
      case "GBP":
        return "£"
      default:
        return currency
    }
  }

  const formatNumber = (value: number | string, digits = 1) => {
    if (typeof value === "string" || value == null || Number.isNaN(value)) return "-"
    return value.toFixed(digits)
  }

  const perBadgeClass = (value: number | string) => {
    if (typeof value === "string" || value == null || Number.isNaN(value)) return "border-border text-muted-foreground"
    if (value < 15) return "border-emerald-500/40 text-emerald-600"
    if (value > 25) return "border-orange-500/40 text-orange-600"
    return "border-border text-muted-foreground"
  }

  const isNumberValue = (value: number | string) => typeof value === "number" && !Number.isNaN(value)

  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center justify-between p-4 border-b border-border/50 gap-4">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-xl font-bold text-foreground tracking-tight">{name}</span>
              <span className="text-sm text-muted-foreground">{symbol}</span>
            </div>
            {data && (
              <div className="flex items-center gap-4">
                <div className="text-left">
                  <span className="text-lg font-semibold text-foreground">{data.currentPrice.toFixed(2)}</span>
                  <span className="text-xs text-muted-foreground ml-1">{data.currency}</span>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">30j</span>
                  <Sparkline data={data.sparkline} />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {data && (
              <div className="flex items-center justify-end gap-2 text-[11px] text-muted-foreground">
                <span className={`px-2 py-1 rounded-full border ${perBadgeClass(data.fundamentals.trailingPE)}`}>
                  PER {formatNumber(data.fundamentals.trailingPE, 1)}
                </span>
                <span className="px-2 py-1 rounded-full border border-border text-muted-foreground">
                  β {formatNumber(data.fundamentals.beta, 2)}
                </span>
                <span className="px-2 py-1 rounded-full border border-border text-muted-foreground">
                  Div{" "}
                  {isNumberValue(data.fundamentals.dividend)
                    ? `${formatNumber(data.fundamentals.dividend, 2)}${currencySymbol(data.currency)}`
                    : "-"}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => mutate()}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onRemove}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="p-4">
          {isLoading && (
            <div className="flex items-center justify-center h-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-20 text-destructive gap-2">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">Données non disponibles</p>
              <Button variant="outline" size="sm" onClick={() => mutate()}>
                Réessayer
              </Button>
            </div>
          )}

          {data && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Momentum (3m)</span>
                </div>
                <div className="flex items-center gap-3">
                  {data.rollingTsr.map((item) => (
                    <TSRBadge key={item.period} period={item.period} value={item.tsr} />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Performance</span>
                </div>
                <div className="flex items-center gap-3">
                  {data.toDateTsr.map((item) => (
                    <TSRBadge key={item.period} period={item.period} value={item.tsr} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
