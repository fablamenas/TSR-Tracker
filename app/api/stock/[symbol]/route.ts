import { NextResponse } from "next/server"

interface YahooChartResult {
  chart: {
    result: Array<{
      meta: {
        regularMarketPrice: number
        currency: string
      }
      timestamp: number[]
      indicators: {
        quote: Array<{
          close: number[]
        }>
        adjclose?: Array<{
          adjclose: number[]
        }>
      }
    }>
    error?: {
      code: string
      description: string
    }
  }
}

function getDateNMonthsAgo(n: number): Date {
  const date = new Date()
  date.setMonth(date.getMonth() - n)
  return date
}

function calculateTSR(currentPrice: number, historicalPrice: number): number {
  if (historicalPrice === 0) return 0
  return ((currentPrice - historicalPrice) / historicalPrice) * 100
}

export async function GET(request: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params

  try {
    // Fetch 13 months of data to ensure we have enough history
    const endDate = Math.floor(Date.now() / 1000)
    const startDate = Math.floor(getDateNMonthsAgo(13).getTime() / 1000)

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${startDate}&period2=${endDate}&interval=1d&events=div`

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    })

    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status}`)
    }

    const data: YahooChartResult = await response.json()

    if (data.chart.error) {
      throw new Error(data.chart.error.description)
    }

    const result = data.chart.result?.[0]
    if (!result || !result.timestamp || !result.indicators.quote[0]) {
      throw new Error("No data available")
    }

    const timestamps = result.timestamp
    const closes = result.indicators.adjclose?.[0]?.adjclose || result.indicators.quote[0].close
    const currentPrice = result.meta.regularMarketPrice

    const thirtyDaysAgo = Math.floor(getDateNMonthsAgo(1).getTime() / 1000)
    const sparklineData: number[] = []
    for (let i = 0; i < timestamps.length; i++) {
      if (timestamps[i] >= thirtyDaysAgo && closes[i] != null) {
        sparklineData.push(closes[i])
      }
    }

    // Find prices at different periods
    const periods = [
      { months: 1, label: "1M" },
      { months: 3, label: "3M" },
      { months: 6, label: "6M" },
      { months: 12, label: "1Y" },
    ]

    const tsrData = periods.map(({ months, label }) => {
      const targetDate = getDateNMonthsAgo(months)
      const targetTimestamp = Math.floor(targetDate.getTime() / 1000)

      // Find the closest available date
      let closestIndex = 0
      let minDiff = Math.abs(timestamps[0] - targetTimestamp)

      for (let i = 1; i < timestamps.length; i++) {
        const diff = Math.abs(timestamps[i] - targetTimestamp)
        if (diff < minDiff) {
          minDiff = diff
          closestIndex = i
        }
      }

      const historicalPrice = closes[closestIndex]
      const tsr = calculateTSR(currentPrice, historicalPrice)

      return {
        period: label,
        tsr: Math.round(tsr * 10) / 10,
      }
    })

    return NextResponse.json({
      tsr: tsrData,
      sparkline: sparklineData,
      currentPrice: Math.round(currentPrice * 100) / 100,
      currency: result.meta.currency || "EUR",
    })
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error)
    return NextResponse.json({ error: "Failed to fetch stock data" }, { status: 500 })
  }
}
