'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useApp } from '@/contexts/AppContext'

export default function LandingCta() {
  const { t } = useApp()

  return (
    <section style={{ padding: 'clamp(56px, 8vw, 90px) clamp(16px, 4vw, 32px)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(34,197,94,0.07) 0%, transparent 65%)', pointerEvents: 'none' }} />
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <h2 style={{ fontSize: 40, fontWeight: 900, margin: '0 0 14px', letterSpacing: '-0.02em' }}>{t('land_ready')}</h2>
        <p style={{ color: '#475569', marginBottom: 36, fontSize: 16 }}>{t('land_free')}</p>
        <Link href='/register' className='shimmer-btn sa-focusable' style={{ padding: '15px 44px', borderRadius: 12, color: '#fff', fontSize: 16, fontWeight: 700, textDecoration: 'none', boxShadow: '0 0 40px rgba(34,197,94,0.4)', display: 'inline-block' }}>
          {t('land_cta_create')}
        </Link>
      </motion.div>
    </section>
  )
}
