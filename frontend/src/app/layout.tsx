import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import Providers from '@/components/Providers'
import CookieBanner from '@/components/CookieBanner'
import AuthDashboardBridge from '@/components/AuthDashboardBridge'
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
    <html lang='en' className={cn('dark font-sans', geist.variable)} suppressHydrationWarning>
      <body className={cn(geistSans.variable, geistMono.variable, 'min-h-screen antialiased')}>
        <Providers>
          <AuthDashboardBridge />
          {children}
          <CookieBanner />
        </Providers>
      </body>
    </html>
  )
}
