'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Rocket } from 'lucide-react'
import BackgroundBeams from '@/components/ui/BackgroundBeams'
import { Card, CardDescription, CardTitle, HoverEffect, type HoverEffectItem } from '@/components/ui/card-hover-effect'
import { cn } from '@/lib/utils'
import { openCookieSettings } from '@/components/CookieBanner'
import { useApp } from '@/contexts/AppContext'
import { release, type ReleasePreviewPayload } from '@/lib/api'
import { setWhatsNewIntent } from '@/lib/whatsNewFunnel'
import { usePublicAuth } from '@/hooks/usePublicAuth'
import { useLandingQuotes } from '@/hooks/useLandingQuotes'
import LandingNav from '@/components/landing/LandingNav'
import LandingSurface from '@/components/landing/LandingSurface'
import LandingTicker from '@/components/landing/LandingTicker'
import GitHubIcon from '@/components/ui/GitHubIcon'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
}

/** Parent must define both keys when children use `variants`; avoids Framer Motion orchestration glitches. */
const staggerHero = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

const staggerSection = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const shell = 'mx-auto max-w-[1100px] px-8'

const btnSky =
  'inline-block rounded-lg border border-sky-400/35 bg-sky-400/15 px-4 py-2 text-[13px] font-semibold text-sky-200 no-underline transition-colors hover:bg-sky-400/20'

const btnEmeraldGhost =
  'inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-4 py-2 text-[13px] font-semibold text-emerald-200 no-underline transition-colors hover:bg-emerald-500/15'

const btnMutedOutline =
  'inline-flex items-center rounded-lg border border-slate-600 px-4 py-2 text-[13px] font-semibold text-slate-400 no-underline transition-colors hover:border-slate-500 hover:text-slate-300'

export default function WhatsNewPage() {
  const { t, lang } = useApp()
  const { scrollRows, loadingTickers, formatPair } = useLandingQuotes()
  const { user: authUser, mounted: authMounted } = usePublicAuth()
  const [preview, setPreview] = useState<ReleasePreviewPayload | null>(null)
  const [previewVer, setPreviewVer] = useState('')

  const loadPreview = useCallback(() => {
    release
      .getPreview(lang === 'de' ? 'de' : 'en')
      .then((d) => {
        setPreview(d.release)
        setPreviewVer(d.app_version ?? '')
      })
      .catch(() => {
        setPreview(null)
        setPreviewVer('')
      })
  }, [lang])

  useEffect(() => {
    loadPreview()
  }, [loadPreview])

  const missionHoverItems: HoverEffectItem[] = useMemo(
    () => [
      {
        id: 'wn-mission-1',
        icon: '✨',
        title: t('page_whats_new_mission_1_title'),
        description: t('page_whats_new_mission_1_body'),
        link: '/register?from=whats_new',
        onClick: () => setWhatsNewIntent(),
      },
      {
        id: 'wn-mission-2',
        icon: '🧘',
        title: t('page_whats_new_mission_2_title'),
        description: t('page_whats_new_mission_2_body'),
        link: '/register?from=whats_new',
        onClick: () => setWhatsNewIntent(),
      },
      {
        id: 'wn-mission-3',
        icon: '✉️',
        title: t('page_whats_new_mission_3_title'),
        description: t('page_whats_new_mission_3_body'),
        link: '/register?from=whats_new',
        onClick: () => setWhatsNewIntent(),
      },
      {
        id: 'wn-mission-4',
        icon: '⚖️',
        title: t('page_whats_new_mission_4_title'),
        description: t('page_whats_new_mission_4_body'),
        link: '/docs',
      },
    ],
    [t]
  )

  return (
    <LandingSurface>
      <LandingNav activePage='whats-new' />
      <LandingTicker scrollRows={scrollRows} loadingTickers={loadingTickers} formatPair={formatPair} />

      <section className='relative overflow-hidden px-8 pb-14 pt-[5.5rem] text-center'>
        <BackgroundBeams />
        <motion.div initial='hidden' animate='show' variants={staggerHero} className='relative z-10'>
          <motion.div variants={fadeUp}>
            <div className='mb-7 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-500'>
              <span className='live-dot size-[7px] shrink-0 rounded-full bg-emerald-500' />
              {t('page_whats_new_hero_kicker')}
            </div>
          </motion.div>
          <motion.h1
            variants={fadeUp}
            className='mb-6 text-[clamp(2rem,5.5vw,3.5rem)] font-black leading-[1.08] tracking-tight'
          >
            <span className='block bg-gradient-to-br from-slate-100 to-slate-500 bg-clip-text text-transparent'>
              {t('page_whats_new_hero_line1')}
            </span>
            <span className='mt-1 block bg-gradient-to-br from-emerald-500 via-emerald-400 to-emerald-600 bg-clip-text text-transparent'>
              {t('page_whats_new_hero_line2')}
            </span>
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className='mx-auto mb-9 max-w-xl text-lg leading-relaxed text-slate-500'
          >
            {t('page_whats_new_hero_sub')}
          </motion.p>
          <motion.div variants={fadeUp} className='flex flex-wrap items-center justify-center gap-3.5'>
            <Link
              href='/register?from=whats_new'
              onClick={() => setWhatsNewIntent()}
              className='shimmer-btn inline-block rounded-lg px-8 py-3.5 text-[15px] font-bold text-white shadow-[0_0_32px_rgba(34,197,94,0.35)] no-underline'
            >
              {t('land_cta_start')}
            </Link>
            <Link
              href='/docs'
              className='inline-block rounded-lg border border-white/10 bg-white/[0.04] px-8 py-3.5 text-[15px] text-slate-400 backdrop-blur-sm no-underline transition-colors hover:border-white/15 hover:text-slate-300'
            >
              {t('land_cta_docs')}
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Full-width mission grid (2×2) — not squeezed beside sidebar */}
      <section className={cn(shell, 'pb-10 pt-6')}>
        <motion.div
          initial='hidden'
          whileInView='show'
          variants={staggerSection}
          viewport={{ once: true, margin: '-60px' }}
        >
          <motion.div variants={fadeUp} className='mb-8 text-center'>
            <p className='mb-2.5 text-xs font-bold uppercase tracking-[0.12em] text-emerald-500'>
              {t('page_whats_new_purpose_kicker')}
            </p>
            <h2 className='mx-auto max-w-3xl text-[clamp(1.35rem,3.2vw,2.1rem)] font-extrabold leading-snug tracking-tight text-slate-100'>
              {t('page_whats_new_purpose_title')}
            </h2>
          </motion.div>
          <motion.div variants={fadeUp}>
            <HoverEffect items={missionHoverItems} variant='balanced4' />
          </motion.div>
        </motion.div>

        <div className='mt-10 grid gap-5 md:grid-cols-2'>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.04 }}
          >
            <Card className='h-full rounded-[20px]'>
              <div className='text-2xl' aria-hidden>
                📊
              </div>
              <p className='mb-0 mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-sky-400'>
                {t('page_whats_new_inapp_kicker')}
              </p>
              <CardTitle className='!mt-1 text-[17px]'>{t('page_whats_new_inapp_title')}</CardTitle>
              <CardDescription className='!mt-3'>{t('page_whats_new_inapp_body')}</CardDescription>
              <div className='mt-5'>
                {!authMounted || !authUser ? (
                  <Link href='/register?from=whats_new' onClick={() => setWhatsNewIntent()} className={btnSky}>
                    {t('page_whats_new_inapp_cta')}
                  </Link>
                ) : (
                  <Link href='/user/dashboard?show_whats_new=1' className={btnSky}>
                    {t('land_whats_new_dashboard')}
                  </Link>
                )}
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.08 }}
          >
            <Card className='h-full rounded-[20px]'>
              <div className='text-2xl' aria-hidden>
                📖
              </div>
              <p className='mb-0 mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-400'>
                {t('page_whats_new_os_kicker')}
              </p>
              <CardTitle className='!mt-1 text-[17px]'>{t('page_whats_new_os_title')}</CardTitle>
              <CardDescription className='!mt-3'>{t('page_whats_new_os_body')}</CardDescription>
              <div className='mt-5 flex flex-wrap gap-3'>
                <a href='https://github.com/ashiqur-russel/stock-agent' target='_blank' rel='noopener noreferrer' className={btnEmeraldGhost}>
                  <GitHubIcon size={15} />
                  {t('page_whats_new_os_cta_repo')}
                </a>
                <Link href='/docs' className={btnMutedOutline}>
                  {t('page_whats_new_os_cta_docs')}
                </Link>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {preview ? (
        <section className={cn(shell, 'pb-16')}>
          <p className='mb-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500'>
            {t('page_whats_new_release_section_kicker')}
          </p>
          <h2 className='mb-5 text-[clamp(1.25rem,3vw,1.85rem)] font-extrabold tracking-tight text-slate-100'>
            {t('page_whats_new_release_section_title')}
          </h2>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className='grid overflow-hidden rounded-[20px] border border-emerald-500/20 bg-slate-950/40 shadow-[0_24px_50px_rgba(0,0,0,0.35)] md:grid-cols-[1.12fr_0.88fr]'
          >
            <div className='border-b border-white/5 bg-[#0a1020] p-7 pb-8 md:border-b-0 md:border-r md:border-white/5'>
              <div className='mb-4 flex items-center gap-3'>
                <div className='flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06]'>
                  <Rocket className='size-[22px] text-slate-200' strokeWidth={2} aria-hidden />
                </div>
                <div>
                  <p className='text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-300'>
                    {t('page_whats_new_release_kicker')}
                    {previewVer ? ` · v${previewVer}` : ''}
                  </p>
                  <p className='mt-1 text-lg font-bold text-slate-50'>{preview.title}</p>
                </div>
              </div>
              <ul className='flex flex-col gap-2.5'>
                {preview.features_teaser.map((line, i) => (
                  <li
                    key={`${i}-${line.slice(0, 20)}`}
                    className='rounded-xl border border-slate-700/55 bg-slate-800/50 py-3 pl-3.5 pr-3 text-sm leading-snug text-slate-300 border-l-[3px] border-l-emerald-500/50'
                  >
                    {line}
                  </li>
                ))}
              </ul>
              {preview.has_more ? (
                <p className='mt-3.5 text-[13px] text-slate-500'>{t('land_whats_new_more')}</p>
              ) : null}
              <div className='mt-5 flex flex-wrap gap-3'>
                {authMounted && authUser ? (
                  <Link href='/user/dashboard?show_whats_new=1' className='shimmer-btn inline-block rounded-lg px-5 py-2.5 text-sm font-bold text-white no-underline'>
                    {t('land_whats_new_dashboard')}
                  </Link>
                ) : (
                  <Link
                    href='/register?from=whats_new'
                    onClick={() => setWhatsNewIntent()}
                    className='shimmer-btn inline-block rounded-lg px-5 py-2.5 text-sm font-bold text-white no-underline'
                  >
                    {t('land_whats_new_cta')}
                  </Link>
                )}
              </div>
            </div>

            <div className='relative flex min-h-[260px] flex-col items-center justify-center border-t border-white/5 bg-gradient-to-br from-sky-950 via-slate-950 to-emerald-950 p-8 md:border-t-0 md:border-l md:border-white/5'>
              <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(34,197,94,0.2),transparent_55%)]' />
              <span className='relative mb-4 rounded-full border border-emerald-500/40 px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-200'>
                {t('page_whats_new_release_visual_label')}
              </span>
              <span className='relative select-none text-[clamp(2.5rem,8vw,4rem)] font-black leading-none tracking-tighter text-slate-50/[0.12]' aria-hidden>
                {previewVer ? `v${previewVer}` : 'v·'}
              </span>
            </div>
          </motion.div>
        </section>
      ) : null}

      <section className='relative overflow-hidden px-8 py-[4.5rem] text-center'>
        <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,197,94,0.07),transparent_65%)]' />
        <div className='relative z-10 mx-auto max-w-xl'>
          <h2 className='mb-3 text-[clamp(1.75rem,4vw,2.35rem)] font-black tracking-tight text-slate-100'>
            {t('land_ready')}
          </h2>
          <p className='mb-7 text-base text-slate-600'>{t('land_free')}</p>
          <div className='flex flex-wrap items-center justify-center gap-3.5'>
            <Link href='/register' className='shimmer-btn inline-block rounded-xl px-7 py-3.5 text-[15px] font-bold text-white no-underline'>
              {t('land_cta_start')}
            </Link>
            <Link
              href='/docs'
              className='inline-block rounded-xl border border-white/10 bg-white/[0.03] px-7 py-3.5 text-[15px] text-slate-400 no-underline transition-colors hover:text-slate-300'
            >
              {t('land_cta_docs')}
            </Link>
          </div>
        </div>
      </section>

      <footer className='flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.04] bg-[#040a18] px-8 py-5'>
        <span className='text-xs text-text-dim'>{t('land_disclaimer')}</span>
        <nav className='flex flex-wrap items-center gap-6'>
          {[
            { href: '/', label: t('land_nav_home') },
            { href: '/whats-new', label: t('land_nav_whats_new') },
            { href: '/docs', label: t('land_docs') },
            { href: '/#contact', label: t('contact_title') },
            { href: '/privacy', label: t('cookie_privacy_link') },
            { href: '/login', label: t('land_signin') },
            { href: '/register', label: t('land_register') },
          ].map((l) => (
            <Link key={l.href} href={l.href} className='text-xs text-text-dim no-underline transition-colors hover:text-text-muted'>
              {l.label}
            </Link>
          ))}
          <button
            type='button'
            onClick={openCookieSettings}
            className='cursor-pointer border-none bg-transparent p-0 text-xs text-text-dim transition-colors hover:text-text-muted'
          >
            🍪 {t('cookie_open_settings')}
          </button>
        </nav>
      </footer>
    </LandingSurface>
  )
}
