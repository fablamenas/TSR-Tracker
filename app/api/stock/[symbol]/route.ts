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

function calculateTSR(endPrice: number, startPrice: number): number {
  if (startPrice === 0) return 0
  return ((endPrice - startPrice) / startPrice) * 100
}

function getClosestPrice(targetTimestamp: number, timestamps: number[], closes: number[]): number {
  let closestIndex = -1
  let minDiff = Infinity

  for (let i = 0; i < timestamps.length; i++) {
    const close = closes[i]
    if (close == null) continue
    const diff = Math.abs(timestamps[i] - targetTimestamp)
    if (diff < minDiff) {
      minDiff = diff
      closestIndex = i
    }
  }

  if (closestIndex === -1) {
    throw new Error("No valid price found for target date")
  }

  return closes[closestIndex]
}

function getLatestClose(timestamps: number[], closes: number[]): number {
  for (let i = timestamps.length - 1; i >= 0; i--) {
    const close = closes[i]
    if (close != null) {
      return close
    }
  }

  throw new Error("No valid closing price found")
}

export async function GET(request: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params

  try {
    // Fetch 1 year of data for rolling quarterly periods
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1y&interval=1d&events=div`

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
    const latestClose = getLatestClose(timestamps, closes)
    const latestPrice = Number.isFinite(currentPrice) ? currentPrice : latestClose

    const thirtyDaysAgo = Math.floor(getDateNMonthsAgo(1).getTime() / 1000)
    const sparklineData: number[] = []
    for (let i = 0; i < timestamps.length; i++) {
      if (timestamps[i] >= thirtyDaysAgo && closes[i] != null) {
        sparklineData.push(closes[i])
      }
    }

    const rollingPeriods = [
      { label: "Mois 12-9", startMonths: 12, endMonths: 9 },
      { label: "Mois 9-6", startMonths: 9, endMonths: 6 },
      { label: "Mois 6-3", startMonths: 6, endMonths: 3 },
      { label: "Derniers 3 mois", startMonths: 3, endMonths: 0 },
    ]

    const rollingTsrData = rollingPeriods.map(({ label, startMonths, endMonths }) => {
      const startTimestamp = Math.floor(getDateNMonthsAgo(startMonths).getTime() / 1000)
      const startPrice = getClosestPrice(startTimestamp, timestamps, closes)

      const endPrice =
        endMonths === 0
          ? latestPrice
          : getClosestPrice(Math.floor(getDateNMonthsAgo(endMonths).getTime() / 1000), timestamps, closes)

      const tsr = calculateTSR(endPrice, startPrice)

      return {
        period: label,
        tsr: Math.round(tsr * 10) / 10,
      }
    })

    const toDatePeriods = [
      { label: "1M", months: 1 },
      { label: "3M", months: 3 },
      { label: "6M", months: 6 },
      { label: "1Y", months: 12 },
    ]

    const toDateTsrData = toDatePeriods.map(({ label, months }) => {
      const targetTimestamp = Math.floor(getDateNMonthsAgo(months).getTime() / 1000)
      const historicalPrice = getClosestPrice(targetTimestamp, timestamps, closes)
      const tsr = calculateTSR(latestPrice, historicalPrice)

      return {
        period: label,
        tsr: Math.round(tsr * 10) / 10,
      }
    })

    return NextResponse.json({
      rollingTsr: rollingTsrData,
      toDateTsr: toDateTsrData,
      sparkline: sparklineData,
      currentPrice: Math.round(latestPrice * 100) / 100,
      currency: result.meta.currency || "EUR",
    })
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error)
    return NextResponse.json({ error: "Failed to fetch stock data" }, { status: 500 })
  }
}
