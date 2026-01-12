"use client"

import { useState } from "react"
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

export function TSRDashboard() {
  const [stocks, setStocks] = useState<Stock[]>(initialStocks)

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
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary rounded-lg">
            <TrendingUp className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">TSR Tracker</h1>
        </div>
        <p className="text-muted-foreground">
          Analysez le Total Shareholder Return (TSR) avec un découpage trimestriel glissant sur 12 mois
        </p>
      </header>

      <AddStockForm onAdd={addStock} />

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
