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
}

async function fetchStockData(symbol: string): Promise<StockData> {
  const response = await fetch(`/api/stock/${encodeURIComponent(symbol)}`)
  if (!response.ok) {
    throw new Error("Erreur lors de la récupération des données")
  }
  return response.json()
}

export function StockCard({ symbol, name, onRemove }: StockCardProps) {
  const { data, error, isLoading, mutate } = useSWR<StockData>(`stock-${symbol}`, () => fetchStockData(symbol), {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  })

  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-4">
            {/* Ticker and name */}
            <div className="flex flex-col">
              <span className="text-xl font-bold text-foreground tracking-tight">{symbol}</span>
              <span className="text-sm text-muted-foreground truncate max-w-[180px]">{name}</span>
            </div>

            {/* Sparkline - Tendance 30j */}
            {data && (
              <div className="flex flex-col items-center gap-0.5 pl-4 border-l border-border/50">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">30j</span>
                <Sparkline data={data.sparkline} />
              </div>
            )}
          </div>

          {/* Actions and price */}
          <div className="flex items-center gap-3">
            {data && (
              <div className="text-right mr-2">
                <span className="text-lg font-semibold text-foreground">{data.currentPrice.toFixed(2)}</span>
                <span className="text-xs text-muted-foreground ml-1">{data.currency}</span>
              </div>
            )}
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
                  <span className="text-xs font-medium uppercase tracking-wider">TSR by 3m period</span>
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
                  <span className="text-xs font-medium uppercase tracking-wider">TSR to-date</span>
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
