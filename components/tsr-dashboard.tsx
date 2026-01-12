"use client"

import { useEffect, useState } from "react"
import { StockCard } from "./stock-card"
import { AddStockForm } from "./add-stock-form"
import { TrendingUp } from "lucide-react"

interface Stock {
  symbol: string
  name: string
}

const initialStocks: Stock[] = [
  { symbol: "ORA.PA", name: "Orange" },
  { symbol: "VOD.L", name: "Vodafone" },
  { symbol: "TEF.MC", name: "Telefonica" },
  { symbol: "EXA.PA", name: "EXAIL Technologies" },
]

const storageKey = "tsr-tracker:stocks"

export function TSRDashboard() {
  const [stocks, setStocks] = useState<Stock[]>(initialStocks)

  useEffect(() => {
    const stored = localStorage.getItem(storageKey)
    if (!stored) {
      return
    }
    try {
      const parsed = JSON.parse(stored) as Stock[]
      if (Array.isArray(parsed)) {
        setStocks(parsed)
      }
    } catch (error) {
      console.warn("Failed to load saved stocks:", error)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(stocks))
  }, [stocks])

  const addStock = (symbol: string, name: string) => {
    if (!stocks.find((s) => s.symbol.toUpperCase() === symbol.toUpperCase())) {
      setStocks([...stocks, { symbol: symbol.toUpperCase(), name }])
    }
  }

  const removeStock = (symbol: string) => {
    setStocks(stocks.filter((s) => s.symbol !== symbol))
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <TrendingUp className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">TSR Tracker</h1>
          </div>
          <AddStockForm onAdd={addStock} collapsedClassName="flex" expandedClassName="w-full" />
        </div>
        <p className="text-muted-foreground">
          Analysez le Total Shareholder Return (TSR) avec un découpage trimestriel glissant sur 12 mois
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {stocks.map((stock) => (
          <StockCard
            key={stock.symbol}
            symbol={stock.symbol}
            name={stock.name}
            onRemove={() => removeStock(stock.symbol)}
          />
        ))}
      </div>
    </div>
  )
}
