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
 * DE reference “open” for the status lamp: Mon–Fri, 7:30–22:00 Europe/Berlin.
 * Ends at 22:00 so the dot turns off when the US regular session ends locally
 * (~16:00 ET ≈ 22:00 CET), instead of staying green until 23:00 while cash is done.
 * (Quotes can still use after-hours data from Yahoo until 23:00 in the backend.)
 */
export function isDEStockSessionOpen(d: Date = new Date()): boolean {
  const { weekday, hour, minute } = parseTimeZoneParts(d, 'Europe/Berlin')
  if (weekday === 'Sat' || weekday === 'Sun') return false
  const t = hour * 60 + minute
  return t >= 7 * 60 + 30 && t < 22 * 60
}

export function isStockMarketOpen(region: MarketRegion, d: Date = new Date()): boolean {
  return region === 'US' ? isUSStockSessionOpen(d) : isDEStockSessionOpen(d)
}

/** Live clock for the reference market timezone (Europe/Berlin or America/New_York). */
export function formatLiveSessionClock(
  d: Date,
  region: MarketRegion,
  lang: 'en' | 'de',
): string {
  const timeZone = region === 'US' ? 'America/New_York' : 'Europe/Berlin'
  const locale = lang === 'de' ? 'de-DE' : 'en-GB'
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZoneName: 'short',
  }).format(d)
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
