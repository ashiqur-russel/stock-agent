const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

function detailToMessage(detail: unknown): string {
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail
      .map((e: { msg?: string }) => (typeof e === 'object' && e && 'msg' in e ? String(e.msg) : JSON.stringify(e)))
      .join('; ')
  }
  return 'Request failed'
}

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
    const d = (body as { detail?: unknown })?.detail
    throw new Error(d !== undefined ? detailToMessage(d) : `HTTP ${res.status}`)
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

  forgotPassword: (email: string) =>
    apiFetch<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, password: string) =>
    apiFetch<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
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
  history: (ticker: string, period = '3mo', currency: 'EUR' | 'USD' = 'EUR') =>
    apiFetch(
      `/api/v1/market/history/${encodeURIComponent(ticker)}?period=${encodeURIComponent(period)}&currency=${currency}`,
    ),
  news: (ticker: string) => apiFetch(`/api/v1/market/news/${ticker}`),
}

export const indicators = {
  get: (ticker: string) => apiFetch(`/api/v1/indicators/${ticker}`),
  swing: (ticker: string) => apiFetch(`/api/v1/indicators/${ticker}/swing`),
}

export const push = {
  getVapidKey: () =>
    apiFetch<{ public_key: string }>('/api/v1/push/vapid-public-key'),
  getStatus: () =>
    apiFetch<{ server_enabled: boolean; subscribed: boolean }>('/api/v1/push/status'),
  subscribe: (body: { endpoint: string; keys: { p256dh: string; auth: string } }) =>
    apiFetch('/api/v1/push/subscribe', { method: 'POST', body: JSON.stringify(body) }),
  unsubscribe: (body: { endpoint: string }) =>
    apiFetch('/api/v1/push/unsubscribe', { method: 'DELETE', body: JSON.stringify(body) }),
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
    apiFetch<{ market_region: 'DE' | 'US'; ai_chat_enabled: boolean }>(
      '/api/v1/settings/preferences',
    ),
  putPreferences: (body: {
    market_region?: 'DE' | 'US'
    ai_chat_enabled?: boolean
  }) =>
    apiFetch('/api/v1/settings/preferences', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
}

export type GroqQuotaShares = {
  rpm: number
  tpm: number
  period_calls_cap: number
  period_tokens_cap: number
  rpd_daily_share: number
  tpd_daily_share: number
}

export type GroqQuotaSnapshot = {
  quota_enabled: boolean
  ai_chat_enabled: boolean
  bucket: string
  users_sharing_pool: number
  can_use: boolean
  shares: GroqQuotaShares | null
  used: {
    minute: { groq_calls: number; tokens: number }
    period: { groq_calls: number; tokens: number }
  } | null
  block_reason: string | null
  next_capacity_utc: string | null
  seconds_until_capacity: number | null
  period_label: string | null
  utc_day_resets_at: string | null
  info: string | null
}

export const chat = {
  getQuota: () => apiFetch<GroqQuotaSnapshot>('/api/v1/chat/quota'),
}

export type WhatsNewPayload = {
  title: string
  features: string[]
  fixes: string[]
}

export const release = {
  getWhatsNew: (lang: 'en' | 'de') =>
    apiFetch<{
      app_version: string
      should_show: boolean
      release: WhatsNewPayload | null
      cleared_up_to: string | null
      read_up_to: string | null
    }>(`/api/v1/release/whats-new?lang=${lang}`),
  dismissWhatsNew: (body: { action: 'done' | 'suppress' }) =>
    apiFetch<{ ok: boolean; app_version: string; action: string }>(
      '/api/v1/release/whats-new/dismiss',
      { method: 'POST', body: JSON.stringify(body) },
    ),
}

export async function postContact(body: { name: string; email: string; message: string }): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail ?? 'Failed to send message')
  }
  return res.json()
}

export { API_URL, getToken }
