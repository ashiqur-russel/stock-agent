/** Keep in sync with backend LANDING_TICKERS in `routers/public_landing.py` */
export const LANDING_TICKER_ORDER = [
  'AAPL',
  'TSLA',
  'NVDA',
  'MSFT',
  'GOOGL',
  'AMZN',
  'META',
  'BTC-USD',
  'ETH-USD',
  'SPY',
  'QQQ',
  'AMD',
] as const

export type LandingTickerRow = {
  sym: string
  eur: number
  usd: number
  chgPct: number
  up: boolean
  ok: boolean
}
