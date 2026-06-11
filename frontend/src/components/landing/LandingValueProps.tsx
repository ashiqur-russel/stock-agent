'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '@/contexts/AppContext'
import type { TranslationKey } from '@/lib/i18n'
import { HoverEffect, type HoverEffectItem } from '@/components/ui/card-hover-effect'
import { fadeUp, staggerShow } from './animations'

const PROPS: Array<{ id: string; icon: string; titleKey: TranslationKey; descKey: TranslationKey }> = [
  { id: 'ai', icon: '🤖', titleKey: 'land_solves_ai_title', descKey: 'land_solves_ai_desc' },
  { id: 'hub', icon: '📊', titleKey: 'land_solves_oneplace_title', descKey: 'land_solves_oneplace_desc' },
  { id: 'swing', icon: '🔔', titleKey: 'land_solves_swing_title', descKey: 'land_solves_swing_desc' },
  { id: 'paper', icon: '📝', titleKey: 'land_solves_paper_title', descKey: 'land_solves_paper_desc' },
  { id: 'ledger', icon: '📒', titleKey: 'land_solves_ledger_title', descKey: 'land_solves_ledger_desc' },
  { id: 'calm', icon: '🧘', titleKey: 'land_solves_calm_title', descKey: 'land_solves_calm_desc' },
  { id: 'fifo', icon: '⚖️', titleKey: 'land_solves_fifo_title', descKey: 'land_solves_fifo_desc' },
  { id: 'live', icon: '📈', titleKey: 'land_solves_live_title', descKey: 'land_solves_live_desc' },
]

export default function LandingValueProps() {
  const { t } = useApp()

  const valueProps: HoverEffectItem[] = useMemo(
    () =>
      PROPS.map((p) => ({
        id: p.id,
        icon: p.icon,
        title: t(p.titleKey),
        description: t(p.descKey),
        link: '/register',
      })),
    [t]
  )

  return (
    <section style={{ padding: 'clamp(40px, 6vw, 60px) clamp(16px, 4vw, 32px) clamp(48px, 7vw, 80px)', maxWidth: 1100, margin: '0 auto' }}>
      <motion.div
        initial='hidden' whileInView='show'
        variants={staggerShow(0.08)}
        viewport={{ once: true, margin: '-80px' }}
      >
        <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: 'var(--color-brand)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>{t('land_what_label')}</div>
          <h2 style={{ fontSize: 34, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>{t('land_what_title')}</h2>
        </motion.div>

        <motion.div variants={fadeUp} className='max-w-5xl mx-auto px-0 md:px-4'>
          <HoverEffect items={valueProps} className='py-6' />
        </motion.div>
      </motion.div>
    </section>
  )
}
