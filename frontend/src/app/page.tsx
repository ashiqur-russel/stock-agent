'use client'

import ContactSection from '@/components/ContactSection'
import { useLandingQuotes } from '@/hooks/useLandingQuotes'
import LandingNav from '@/components/landing/LandingNav'
import LandingSurface from '@/components/landing/LandingSurface'
import LandingTicker from '@/components/landing/LandingTicker'
import LandingHero from '@/components/landing/LandingHero'
import LandingMockup from '@/components/landing/LandingMockup'
import LandingValueProps from '@/components/landing/LandingValueProps'
import LandingHowItWorks from '@/components/landing/LandingHowItWorks'
import LandingCta from '@/components/landing/LandingCta'
import LandingFooter from '@/components/landing/LandingFooter'

export default function Home() {
  const { tickerRows, scrollRows, loadingTickers, formatPair } = useLandingQuotes()

  return (
    <LandingSurface>
      <LandingNav />
      <LandingTicker scrollRows={scrollRows} loadingTickers={loadingTickers} formatPair={formatPair} />
      <LandingHero />
      <LandingMockup tickerRows={tickerRows} loadingTickers={loadingTickers} formatPair={formatPair} />
      <LandingValueProps />
      <LandingHowItWorks />
      <ContactSection />
      <LandingCta />
      <LandingFooter />
    </LandingSurface>
  )
}
