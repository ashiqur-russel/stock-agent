/**
 * Fired when the user logs in, registers, verifies email, or logs out.
 * AppProvider listens to pull server-backed preferences (e.g. market region).
 */
export const AUTH_SESSION_EVENT = 'stock-agent-auth-changed'

export function dispatchAuthSessionChanged(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(AUTH_SESSION_EVENT))
}
