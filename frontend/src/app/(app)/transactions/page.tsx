import { redirect } from 'next/navigation'

/** Legacy URL; canonical route is /dashboard/transactions */
export default function LegacyTransactionsRedirect() {
  redirect('/dashboard/transactions')
}
