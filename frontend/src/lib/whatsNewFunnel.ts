/** Landing → register → verify funnel: open What's New after first login (Option A). */
export const WHATS_NEW_INTENT_KEY = 'stock_agent_whats_new_intent'

export function setWhatsNewIntent(): void {
  try {
    localStorage.setItem(WHATS_NEW_INTENT_KEY, '1')
  } catch {
    /* ignore */
  }
}

/** Returns dashboard path; clears intent when consuming. */
export function consumeWhatsNewIntentPath(): '/user/dashboard' | '/user/dashboard?show_whats_new=1' {
  try {
    if (localStorage.getItem(WHATS_NEW_INTENT_KEY) === '1') {
      localStorage.removeItem(WHATS_NEW_INTENT_KEY)
      return '/user/dashboard?show_whats_new=1'
    }
  } catch {
    /* ignore */
  }
  return '/user/dashboard'
}
