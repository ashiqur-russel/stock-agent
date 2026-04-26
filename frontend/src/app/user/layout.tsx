import AuthGuard from '@/components/layout/AuthGuard'

/**
 * Shared layout for every authenticated route.
 *
 * `(app)` is a Next.js route group — the parens mean it does NOT add a URL
 * segment, so `/dashboard`, `/paper`, etc. keep their original paths. The win
 * is that <AuthGuard> mounts ONCE here and persists across navigation between
 * any pages inside the group.
 *
 * That stops the alerts WebSocket (and the toast queue, and the sidebar
 * state) from being torn down and recreated on every sidebar click.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>
}
