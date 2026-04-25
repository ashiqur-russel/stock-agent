/**
 * User-selectable "reference" market for open/close UI (sidebar + dashboard).
 * Backend quote/WebSocket behaviour is unchanged; this is display-only.
 */
export type MarketRegion = 'DE' | 'US'

export const MARKET_REGION_STORAGE_KEY = 'app_market_region'

function parseTimeZoneParts(
  d: Date,
  timeZone: string,
): { weekday: string; hour: number; minute: number } {
  const f = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  })
  const parts: Record<string, string> = {}
  f.formatToParts(d).forEach((p) => {
    parts[p.type] = p.value
  })
  return {
    weekday: parts.weekday ?? '',
    hour: parseInt(parts.hour ?? '0', 10),
    minute: parseInt(parts.minute ?? '0', 10),
  }
}

/**
 * US (NYSE) regular session: Mon–Fri, 9:30–16:00 America/New_York.
 */
export function isUSStockSessionOpen(d: Date = new Date()): boolean {
  const { weekday, hour, minute } = parseTimeZoneParts(d, 'America/New_York')
  if (weekday === 'Sat' || weekday === 'Sun') return false
  const t = hour * 60 + minute
  return t >= 9 * 60 + 30 && t < 16 * 60
}

/**
 * Product default for DE: Mon–Fri, 7:30–23:00 in Europe/Berlin
 * (matches requested window; a future per-user "venue" setting can replace this).
 */
export function isDEStockSessionOpen(d: Date = new Date()): boolean {
  const { weekday, hour, minute } = parseTimeZoneParts(d, 'Europe/Berlin')
  if (weekday === 'Sat' || weekday === 'Sun') return false
  const t = hour * 60 + minute
  return t >= 7 * 60 + 30 && t < 23 * 60
}

export function isStockMarketOpen(region: MarketRegion, d: Date = new Date()): boolean {
  return region === 'US' ? isUSStockSessionOpen(d) : isDEStockSessionOpen(d)
}

export function readMarketRegionFromStorage(): MarketRegion | null {
  if (typeof window === 'undefined') return null
  const v = localStorage.getItem(MARKET_REGION_STORAGE_KEY)
  if (v === 'US' || v === 'DE') return v
  return null
}

export function getDefaultMarketRegion(): MarketRegion {
  return 'DE'
}
