const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('stock_agent_token')
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.detail ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export const auth = {
  register: (email: string, name: string, password: string) =>
    apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, name, password }),
    }),

  login: (email: string, password: string) =>
    apiFetch<{ access_token: string; user_id: number; name: string; email: string }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    ),

  verify: (token: string) =>
    apiFetch<{ access_token: string; user_id: number; name: string; email: string }>(
      `/auth/verify?token=${token}`
    ),

  resendVerification: (email: string) =>
    apiFetch('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
}

export const portfolio = {
  get: () => apiFetch('/api/v1/portfolio'),
  getTransactions: () => apiFetch('/api/v1/portfolio/transactions'),
  addTransaction: (body: {
    ticker: string
    type: 'BUY' | 'SELL'
    shares: number
    price: number
    executed_at: string
    notes?: string
  }) => apiFetch('/api/v1/portfolio/transaction', { method: 'POST', body: JSON.stringify(body) }),
  updateTransaction: (
    id: number,
    body: {
      ticker: string
      type: 'BUY' | 'SELL'
      shares: number
      price: number
      executed_at: string
      notes?: string
    },
  ) =>
    apiFetch(`/api/v1/portfolio/transaction/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  deleteTransaction: (id: number) =>
    apiFetch(`/api/v1/portfolio/transaction/${id}`, { method: 'DELETE' }),
}

/** Public landing page — no JWT (server cached). */
export async function fetchPublicLandingQuotes(): Promise<{
  quotes: Array<{
    ticker: string
    ok?: boolean
    current_price?: number
    current_price_usd?: number
    day_change_pct?: number
    eur_rate?: number
  }>
  cache_ttl_sec?: number
}> {
  const res = await fetch(`${API_URL}/api/v1/public/landing-quotes`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { detail?: string })?.detail ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<{
    quotes: Array<{
      ticker: string
      ok?: boolean
      current_price?: number
      current_price_usd?: number
      day_change_pct?: number
      eur_rate?: number
    }>
    cache_ttl_sec?: number
  }>
}

export const market = {
  quote: (ticker: string) => apiFetch(`/api/v1/market/quote/${ticker}`),
  history: (ticker: string, period = '3mo') =>
    apiFetch(`/api/v1/market/history/${ticker}?period=${period}`),
  news: (ticker: string) => apiFetch(`/api/v1/market/news/${ticker}`),
}

export const indicators = {
  get: (ticker: string) => apiFetch(`/api/v1/indicators/${ticker}`),
}

export const paper = {
  getAccount: (currency: 'USD' | 'EUR' = 'EUR') =>
    apiFetch(`/api/v1/paper/account?currency=${currency}`),
  trade: (ticker: string, type: 'BUY' | 'SELL', shares: number) =>
    apiFetch('/api/v1/paper/trade', { method: 'POST', body: JSON.stringify({ ticker, type, shares }) }),
  reset: (currency: 'USD' | 'EUR' = 'EUR') =>
    apiFetch('/api/v1/paper/reset', {
      method: 'POST',
      body: JSON.stringify({ currency }),
    }),
  watchlist: {
    list: () => apiFetch<{ tickers: string[] }>('/api/v1/paper/watchlist'),
    add: (ticker: string) =>
      apiFetch<{ ok: boolean; ticker: string }>('/api/v1/paper/watchlist', {
        method: 'POST',
        body: JSON.stringify({ ticker }),
      }),
    remove: (ticker: string) =>
      apiFetch<{ ok: boolean; ticker: string }>(
        `/api/v1/paper/watchlist/${encodeURIComponent(ticker)}`,
        { method: 'DELETE' },
      ),
  },
}

export const alerts = {
  list: () => apiFetch('/api/v1/alerts'),
  unreadCount: () => apiFetch<{ count: number }>('/api/v1/alerts/unread-count'),
  markRead: (id: number) => apiFetch(`/api/v1/alerts/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => apiFetch('/api/v1/alerts/read-all', { method: 'PATCH' }),
  getNotifSettings: () =>
    apiFetch<{ notify_email: string | null; email_alerts: boolean }>(
      '/api/v1/settings/notifications',
    ),
  saveNotifSettings: (body: { notify_email: string | null; email_alerts: boolean }) =>
    apiFetch('/api/v1/settings/notifications', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
}

export const settings = {
  getPreferences: () =>
    apiFetch<{ market_region: 'DE' | 'US' }>('/api/v1/settings/preferences'),
  putPreferences: (body: { market_region: 'DE' | 'US' }) =>
    apiFetch('/api/v1/settings/preferences', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
}

export { API_URL, getToken }
