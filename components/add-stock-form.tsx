"use client"

import type React from "react"
import type { MouseEvent } from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Search, Loader2 } from "lucide-react"

interface SearchResult {
  symbol: string
  name: string
  exchange: string
  exchDisp: string
}

interface AddStockFormProps {
  onAdd: (symbol: string, name: string) => void
}

export function AddStockForm({ onAdd }: AddStockFormProps) {
  const [symbol, setSymbol] = useState("")
  const [name, setName] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    const debounceTimer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
        const data = await response.json()
        setSearchResults(data.results || [])
        setShowResults(true)
      } catch (error) {
        console.error("Search failed:", error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelectResult = (result: SearchResult) => {
    setSymbol(result.symbol)
    setName(result.name)
    setSearchQuery("")
    setShowResults(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (symbol.trim() && name.trim()) {
      onAdd(symbol.trim(), name.trim())
      setSymbol("")
      setName("")
      setSearchQuery("")
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardContent className="pt-6">
        <div className="relative mb-4" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une entreprise (ex: Orange, Apple, Tesla...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
            )}
          </div>

          {showResults && searchResults.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-64 overflow-y-auto">
              {searchResults.map((result) => (
                <button
                  key={result.symbol}
                  type="button"
                  onClick={() => handleSelectResult(result)}
                  className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex justify-between items-center gap-2 border-b border-border last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">{result.name}</div>
                    <div className="text-sm text-muted-foreground">{result.symbol}</div>
                  </div>
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded shrink-0">
                    {result.exchDisp || result.exchange}
                  </span>
                </button>
              ))}
            </div>
          )}

          {showResults && searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
            <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg p-4 text-center text-muted-foreground">
              Aucun résultat trouvé
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Code boursier (ex: AAPL, MSFT.US)"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="flex-1"
          />
          <Input
            placeholder="Nom de l'entreprise"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-3">
          Utilisez la recherche ci-dessus ou entrez manuellement le code boursier avec les suffixes: .PA (Paris), .L
          (Londres), .MC (Madrid), .DE (Francfort)
        </p>
      </CardContent>
    </Card>
  )
}
