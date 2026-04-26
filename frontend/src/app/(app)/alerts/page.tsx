import { redirect } from 'next/navigation'

/** Legacy URL; canonical route is /dashboard/alerts */
export default function LegacyAlertsRedirect() {
  redirect('/dashboard/alerts')
}
