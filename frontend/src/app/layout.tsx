import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import Providers from '@/components/Providers'
import CookieBanner from '@/components/CookieBanner'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: { default: 'StockAgent', template: '%s — StockAgent' },
  description: 'Track your portfolio and get AI-powered swing trading advice.',
  icons: { icon: '/icon.svg', shortcut: '/icon.svg' },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang='en'>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} style={{ margin: 0, background: '#020617', color: '#f1f5f9' }}>
        <Providers>
          {children}
          <CookieBanner />
        </Providers>
      </body>
    </html>
  )
}
