'use client'

import { motion } from 'framer-motion'
import { useApp } from '@/contexts/AppContext'
import { SpotlightCard } from '@/components/ui/Spotlight'
import { fadeUp, staggerShow } from './animations'

const steps = [
  { n: '1', title: 'Create your account', desc: 'Sign up free. No credit card required. Email verified in seconds.' },
  { n: '2', title: 'Add your holdings',   desc: 'Log buy and sell transactions. The portfolio calculates itself.' },
  { n: '3', title: 'Ask the AI',          desc: 'Chat about any stock. The AI fetches live data and gives you a swing trading setup.' },
]

export default function LandingHowItWorks() {
  const { t } = useApp()

  return (
    <section style={{ padding: 'clamp(40px, 6vw, 60px) clamp(16px, 4vw, 32px)', background: 'rgba(4,10,24,0.6)', borderTop: '1px solid rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
      <motion.div
        initial='hidden' whileInView='show'
        variants={staggerShow(0.12)}
        viewport={{ once: true, margin: '-80px' }}
        style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}
      >
        <motion.div variants={fadeUp}>
          <div style={{ fontSize: 12, color: 'var(--color-brand)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>{t('land_how_label')}</div>
          <h2 style={{ fontSize: 34, fontWeight: 800, margin: '0 0 44px', letterSpacing: '-0.02em' }}>{t('land_how_title')}</h2>
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {steps.map((s) => (
            <motion.div key={s.n} variants={fadeUp}>
              <SpotlightCard style={{ background: '#0a1628', border: '1px solid #0d2040', borderRadius: 14, padding: 22, textAlign: 'left', display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#16a34a,#22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 17, fontWeight: 800, color: '#fff', boxShadow: '0 0 16px rgba(34,197,94,0.4)' }}>
                  {s.n}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 5, color: 'var(--color-text)' }}>{s.title}</div>
                  <div style={{ fontSize: 14, color: 'var(--color-text-dim)', lineHeight: 1.6 }}>{s.desc}</div>
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
