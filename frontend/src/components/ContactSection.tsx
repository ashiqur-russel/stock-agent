'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { postContact } from '@/lib/api'
import { useApp } from '@/contexts/AppContext'
import { Button } from '@/components/ui/Button'
import GitHubIcon from '@/components/ui/GitHubIcon'

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }

function Field({
  label,
  textarea,
  ...props
}: { label: string; textarea?: boolean } & React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>) {
  const shared =
    'w-full bg-[#060e20] border border-[#0d2040] rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-text-dim focus:outline-none focus:border-brand transition-colors'
  return (
    <div className='flex flex-col gap-1.5'>
      <label className='text-xs text-text-dim font-medium'>{label}</label>
      {textarea ? (
        <textarea
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          rows={5}
          className={`${shared} resize-none`}
        />
      ) : (
        <input {...props as React.InputHTMLAttributes<HTMLInputElement>} className={shared} />
      )}
    </div>
  )
}

export default function ContactSection() {
  const { t } = useApp()
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    try {
      await postContact(form)
      setStatus('success')
      setForm({ name: '', email: '', message: '' })
    } catch {
      setStatus('error')
    }
  }

  return (
    <section
      id='contact'
      className='py-20 px-8'
      style={{ background: 'rgba(4,10,24,0.6)', borderTop: '1px solid rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.03)' }}
    >
      <motion.div
        initial='hidden'
        whileInView='show'
        variants={{ show: { transition: { staggerChildren: 0.1 } } }}
        viewport={{ once: true, margin: '-60px' }}
        className='max-w-5xl mx-auto'
      >
        {/* Centered section header */}
        <motion.div variants={fadeUp} className='text-center mb-12'>
          <div className='text-xs text-brand font-bold uppercase tracking-widest mb-3'>Contact</div>
          <h2 className='text-[34px] font-extrabold tracking-tight leading-tight mb-3'>{t('contact_title')}</h2>
          <p className='text-text-dim text-sm leading-relaxed max-w-md mx-auto'>{t('contact_subtitle')}</p>
        </motion.div>

        {/* Two-column layout: info left, form right */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-12 items-start'>

          {/* Left — info cards */}
          <motion.div variants={fadeUp} className='flex flex-col'>
            {/* Info cards — same card style as feature/step cards */}
            <div className='flex flex-col gap-3'>
              {[
                { icon: '💬', title: 'General Questions', desc: 'Ask anything about features, bugs, or how the AI advisor works.' },
                { icon: '💚', title: 'Sponsorship & Funding', desc: 'Interested in supporting the project? We reply within 30 days.' },
                { icon: '🔒', title: 'Data & Privacy Requests', desc: 'GDPR data access, export, or deletion — handled in writing.' },
              ].map((card) => (
                <div key={card.title} className='flex items-start gap-3 bg-[#0a1628] border border-[#0d2040] rounded-xl p-4'>
                  <span className='text-lg mt-0.5 shrink-0'>{card.icon}</span>
                  <div>
                    <div className='text-sm font-semibold text-foreground mb-0.5'>{card.title}</div>
                    <div className='text-xs text-text-dim leading-relaxed'>{card.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick-facts strip */}
            <div className='border-t border-[#0d2040] mt-5 pt-5 flex flex-col gap-3'>
              {[
                { icon: '⏱', label: 'Response time', value: 'Within 30 days' },
                { icon: '⭐', label: 'Project',       value: 'Open source on GitHub' },
                { icon: '🔒', label: 'Privacy',       value: 'GDPR-compliant' },
              ].map((f) => (
                <div key={f.label} className='flex items-center gap-3'>
                  <span className='text-base w-5 shrink-0'>{f.icon}</span>
                  <span className='text-xs text-text-dim'>{f.label}</span>
                  <span className='text-xs text-text-muted font-medium ml-auto'>{f.value}</span>
                </div>
              ))}
            </div>

            {/* GitHub link */}
            <a
              href='https://github.com/ashiqur-russel/stock-agent'
              target='_blank'
              rel='noopener noreferrer'
              className='mt-5 inline-flex items-center justify-center gap-2 text-text-dim text-xs border border-[#0d2040] rounded-xl px-4 py-3 bg-[#0a1628] hover:border-brand hover:text-brand transition-colors no-underline w-full'
            >
              <GitHubIcon size={13} />
              View on GitHub · ★ Star the project
            </a>
          </motion.div>

          {/* Right — form card, same background family as step cards */}
          <motion.div variants={fadeUp}>
            <div className='bg-[#0a1628] border border-[#0d2040] rounded-2xl p-7'>
              {status === 'success' ? (
                <div className='flex flex-col items-center justify-center py-12 gap-4 text-center'>
                  <div className='w-14 h-14 rounded-full bg-brand/10 border border-brand/30 flex items-center justify-center text-2xl'>
                    ✓
                  </div>
                  <p className='text-brand font-semibold text-sm'>{t('contact_success')}</p>
                  <button
                    onClick={() => setStatus('idle')}
                    className='text-xs text-text-dim hover:text-text-muted transition-colors mt-1 bg-transparent border-none cursor-pointer'
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
                  {status === 'error' && (
                    <div className='bg-accent-red/10 border border-accent-red/30 rounded-xl px-4 py-3 text-accent-red text-xs'>
                      {t('contact_error')}
                    </div>
                  )}

                  <Field
                    label={t('contact_name')}
                    type='text'
                    placeholder='Jane Doe'
                    required
                    value={form.name}
                    onChange={set('name')}
                  />
                  <Field
                    label={t('contact_email')}
                    type='email'
                    placeholder='jane@example.com'
                    required
                    value={form.email}
                    onChange={set('email')}
                  />
                  <Field
                    label={t('contact_message')}
                    textarea
                    placeholder='Tell us how we can help…'
                    required
                    value={form.message}
                    onChange={set('message')}
                  />

                  <Button
                    type='submit'
                    size='lg'
                    disabled={status === 'sending'}
                    className='mt-1 w-full'
                  >
                    {status === 'sending' ? t('contact_sending') : t('contact_submit')}
                  </Button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}
