'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useApp } from '@/contexts/AppContext'
import BackgroundBeams from '@/components/ui/BackgroundBeams'
import { fadeUp, staggerShow } from './animations'

export default function LandingHero() {
  const { t } = useApp()

  return (
    <section
      style={{
        position: 'relative',
        textAlign: 'center',
        padding: 'clamp(48px, 8vw, 90px) clamp(16px, 4vw, 32px) clamp(40px, 6vw, 60px)',
        overflow: 'hidden',
      }}
    >
      <BackgroundBeams />

      <motion.div
        initial='hidden' animate='show'
        variants={staggerShow(0.12)}
        style={{ position: 'relative', zIndex: 1 }}
      >
        <motion.div variants={fadeUp}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 20, padding: '5px 16px', fontSize: 12, color: 'var(--color-brand)', fontWeight: 600, marginBottom: 28, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            <span className='live-dot' style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-brand)', display: 'inline-block', flexShrink: 0 }} />
            {t('land_badge')}
          </div>
        </motion.div>

        <motion.h1 variants={fadeUp} style={{ fontSize: 'clamp(34px, 5.5vw, 64px)', fontWeight: 900, margin: '0 0 22px', lineHeight: 1.08, letterSpacing: '-0.02em' }}>
          <span style={{ background: 'linear-gradient(135deg, #f1f5f9 0%, #94a3b8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'block' }}>
            Smart Stock Portfolio
          </span>
          <span style={{ background: 'linear-gradient(135deg, #22c55e 0%, #4ade80 50%, #22c55e 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'block' }}>
            with AI Advisor
          </span>
        </motion.h1>

        <motion.p variants={fadeUp} style={{ fontSize: 18, color: 'var(--color-text-dim)', maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.75 }}>
          {t('land_hero_sub')}
        </motion.p>

        <motion.div variants={fadeUp} style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href='/register' className='shimmer-btn sa-focusable' style={{ padding: '14px 34px', borderRadius: 10, color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 0 32px rgba(34,197,94,0.4), 0 0 60px rgba(34,197,94,0.15)', display: 'inline-block' }}>
            {t('land_cta_start')}
          </Link>
          <Link href='/docs' className='sa-focusable' style={{ padding: '14px 34px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: 'var(--color-text-muted)', fontSize: 15, textDecoration: 'none', backdropFilter: 'blur(4px)', display: 'inline-block' }}>
            {t('land_cta_docs')}
          </Link>
        </motion.div>
      </motion.div>
    </section>
  )
}
