import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=8&newsCount=0&listsCount=0`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
      },
    )

    if (!response.ok) {
      throw new Error("Yahoo Finance search failed")
    }

    const data = await response.json()

    const results = (data.quotes || [])
      .filter((quote: any) => quote.quoteType === "EQUITY")
      .map((quote: any) => ({
        symbol: quote.symbol,
        name: quote.shortname || quote.longname || quote.symbol,
        exchange: quote.exchange,
        exchDisp: quote.exchDisp,
      }))

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ results: [] })
  }
}
