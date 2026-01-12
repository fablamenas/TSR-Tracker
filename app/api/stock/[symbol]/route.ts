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

interface YahooQuoteSummaryResult {
  quoteSummary: {
    result?: Array<{
      summaryDetail?: {
        trailingPE?: number
        forwardPE?: number
        beta?: number
        dividendRate?: number
        lastDividendValue?: number
        trailingAnnualDividendRate?: number
      }
    }>
    error?: {
      code: string
      description: string
    }
  }
}

interface FmpProfile {
  pe?: number
  beta?: number
  lastDiv?: number
}

interface FmpResult {
  profile: FmpProfile | null
  status: number | null
  hasApiKey: boolean
  requestUrl: string | null
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

function normalizeMetric(value: number | undefined): number | null {
  if (value == null || Number.isNaN(value)) return null
  return value
}

function normalizeDividend(value: number | undefined): number | null {
  if (value == null || Number.isNaN(value) || value === 0) return null
  return value
}

async function fetchFmpFundamentals(symbol: string): Promise<FmpResult> {
  const apiKey = process.env.FMP_API_KEY
  if (!apiKey) {
    console.info("[stocks] FMP_API_KEY missing, skipping FMP lookup")
    return { profile: null, status: null, hasApiKey: false, requestUrl: null }
  }

  console.info("[stocks] FMP lookup start", { symbol, hasApiKey: apiKey.length > 0 })

  const url = `https://financialmodelingprep.com/stable/profile?symbol=${encodeURIComponent(
    symbol,
  )}&apikey=${apiKey}`
  const maskedUrl = url.replace(apiKey, "REDACTED")
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  })

  console.info("[stocks] FMP response received", {
    symbol,
    status: response.status,
    ok: response.ok,
    url: maskedUrl,
  })

  if (!response.ok) {
    console.info("[stocks] FMP response not ok", { symbol, status: response.status, url: maskedUrl })
    return { profile: null, status: response.status, hasApiKey: true, requestUrl: maskedUrl }
  }

  const data = (await response.json()) as FmpProfile[]
  console.info("[stocks] FMP payload parsed", { symbol, count: data.length, url: maskedUrl })
  return { profile: data[0] ?? null, status: response.status, hasApiKey: true, requestUrl: maskedUrl }
}

export async function GET(request: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params

  try {
    // Fetch 1 year of data for rolling quarterly periods
    const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1y&interval=1d&events=div`
    const summaryUrl = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=summaryDetail`

    const [chartResponse, summaryResponse] = await Promise.all([
      fetch(chartUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      }),
      fetch(summaryUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      }),
    ])

    if (!chartResponse.ok) {
      throw new Error(`Yahoo Finance API error: ${chartResponse.status}`)
    }

    const data: YahooChartResult = await chartResponse.json()

    if (data.chart.error) {
      throw new Error(data.chart.error.description)
    }

    let trailingPE: number | string = "N/A"
    let beta: number | string = "N/A"
    let dividend: number | string = "N/A"
    let fundamentalsSource: "yahoo" | "fmp" = "yahoo"

    if (summaryResponse.ok) {
      const summaryData: YahooQuoteSummaryResult = await summaryResponse.json()
      const summaryDetail = summaryData.quoteSummary.result?.[0]?.summaryDetail
      const peValue = normalizeMetric(summaryDetail?.trailingPE) ?? normalizeMetric(summaryDetail?.forwardPE)
      const betaValue = normalizeMetric(summaryDetail?.beta)
      const dividendValue =
        normalizeDividend(summaryDetail?.dividendRate) ??
        normalizeDividend(summaryDetail?.trailingAnnualDividendRate) ??
        normalizeDividend(summaryDetail?.lastDividendValue)

      trailingPE = peValue ?? "N/A"
      beta = betaValue ?? "N/A"
      dividend = dividendValue ?? "N/A"
    }

    const fmpResult = await fetchFmpFundamentals(symbol)
    if (fmpResult.profile) {
      const fmpPe = normalizeMetric(fmpResult.profile.pe)
      const fmpBeta = normalizeMetric(fmpResult.profile.beta)
      const fmpDividend = normalizeDividend(fmpResult.profile.lastDiv)

      trailingPE = fmpPe ?? trailingPE
      beta = fmpBeta ?? beta
      dividend = fmpDividend ?? dividend

      fundamentalsSource = "fmp"
    }

    console.info("[stocks] Fundamentals debug", {
      symbol,
      fundamentalsSource,
      yahoo: { trailingPE, beta, dividend },
      fmpStatus: fmpResult.status,
      fmpProfile: fmpResult.profile,
      fmpHasApiKey: fmpResult.hasApiKey,
      fmpRequestUrl: fmpResult.requestUrl,
    })

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
      fundamentals: {
        trailingPE,
        beta,
        dividend,
      },
      debug: {
        fundamentalsSource,
        fmpStatus: fmpResult.status,
        fmpProfile: fmpResult.profile,
        fmpUrl: "https://financialmodelingprep.com/stable/profile?symbol=SYMBOL&apikey=REDACTED",
        fmpHasApiKey: fmpResult.hasApiKey,
        fmpRequestUrl: fmpResult.requestUrl,
      },
    })
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error)
    return NextResponse.json({ error: "Failed to fetch stock data" }, { status: 500 })
  }
}
