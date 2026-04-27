'use client'

import { useCallback, useEffect, useState } from 'react'
import { Bug, Check, Rocket, Sparkles, X } from 'lucide-react'
import { useApp } from '@/contexts/AppContext'
import { release } from '@/lib/api'

/** Split "Title — body" or "Title - body" for card layout when present. */
function parseLine(line: string): { head: string; rest: string | null } {
  const s = line.trim()
  for (const sep of [' — ', ' – ', ' - ', ': ']) {
    const i = s.indexOf(sep)
    if (i > 0 && i < s.length - sep.length) {
      return {
        head: s.slice(0, i).trim(),
        rest: s.slice(i + sep.length).trim() || null,
      }
    }
  }
  return { head: s, rest: null }
}

/**
 * Fetches /api/v1/release/whats-new and shows release notes until the user
 * dismisses (Done / suppress) or chooses Remind me later (no API — shows again next visit).
 */
export default function WhatsNewModal() {
  const { lang, t } = useApp()
  const [open, setOpen] = useState(false)
  const [appVersion, setAppVersion] = useState('')
  const [title, setTitle] = useState('')
  const [features, setFeatures] = useState<string[]>([])
  const [fixes, setFixes] = useState<string[]>([])
  const [dontShow, setDontShow] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await release.getWhatsNew(lang === 'de' ? 'de' : 'en')
      if (!data.should_show || !data.release) {
        setOpen(false)
        return
      }
      setAppVersion(data.app_version ?? '')
      setTitle(data.release.title)
      setFeatures(data.release.features ?? [])
      setFixes(data.release.fixes ?? [])
      setOpen(true)
    } catch {
      setOpen(false)
    }
  }, [lang])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        setDontShow(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const closeOverlay = () => {
    setOpen(false)
    setDontShow(false)
  }

  const onDone = async () => {
    setBusy(true)
    try {
      await release.dismissWhatsNew({ action: 'done' })
      closeOverlay()
    } catch {
      /* keep open */
    } finally {
      setBusy(false)
    }
  }

  const onLater = async () => {
    if (dontShow) {
      setBusy(true)
      try {
        await release.dismissWhatsNew({ action: 'suppress' })
        closeOverlay()
      } catch {
        /* keep open */
      } finally {
        setBusy(false)
      }
    } else {
      setOpen(false)
      setDontShow(false)
    }
  }

  if (!open) return null

  const pillLabel = appVersion ? `v${appVersion}` : ''

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="whats-new-heading"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        background: 'rgba(2, 6, 23, 0.88)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 560,
          maxHeight: 'min(92vh, 720px)',
          display: 'flex',
          flexDirection: 'column',
          background: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: 20,
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(34, 197, 94, 0.06)',
          overflow: 'hidden',
        }}
      >
        {/* Header — emerald / slate gradient aligned with dashboard accents */}
        <div
          style={{
            position: 'relative',
            background: 'linear-gradient(145deg, #064e3b 0%, #0f172a 42%, #1e1b4b 100%)',
            padding: '28px 24px 24px',
            textAlign: 'center',
          }}
        >
          <button
            type="button"
            aria-label="Close"
            disabled={busy}
            onClick={() => {
              setOpen(false)
              setDontShow(false)
            }}
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              width: 36,
              height: 36,
              borderRadius: 10,
              border: '1px solid rgba(148, 163, 184, 0.25)',
              background: 'rgba(15, 23, 42, 0.45)',
              color: '#e2e8f0',
              cursor: busy ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} strokeWidth={2.25} />
          </button>

          <div
            style={{
              width: 56,
              height: 56,
              margin: '0 auto 14px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
            }}
          >
            <Rocket size={26} color="#f1f5f9" strokeWidth={2} aria-hidden />
          </div>

          <h2
            id="whats-new-heading"
            style={{
              margin: '0 0 10px',
              fontSize: 22,
              fontWeight: 700,
              color: '#f8fafc',
              letterSpacing: '-0.02em',
            }}
          >
            {t('whats_new_heading')}
          </h2>

          {pillLabel ? (
            <span
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                color: '#bbf7d0',
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.35)',
                marginBottom: 10,
              }}
            >
              {pillLabel}
            </span>
          ) : null}

          {title ? (
            <p
              style={{
                margin: 0,
                fontSize: 14,
                lineHeight: 1.5,
                color: 'rgba(226, 232, 240, 0.85)',
                maxWidth: 420,
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              {title}
            </p>
          ) : null}
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 22px 18px',
            background: '#0f172a',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16,
              alignItems: 'flex-start',
            }}
          >
            {features.length > 0 && (
              <section
                style={{
                  flex: '1 1 240px',
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 12,
                    paddingLeft: 4,
                    borderLeft: '3px solid #22c55e',
                  }}
                >
                  <Sparkles size={16} color="#22c55e" aria-hidden />
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#22c55e',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {t('whats_new_section_features')}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {features.map((line, idx) => {
                    const { head, rest } = parseLine(line)
                    return (
                      <div
                        key={`${idx}-${head}`}
                        style={{
                          padding: '12px 14px',
                          borderRadius: 12,
                          background: 'rgba(30, 41, 59, 0.65)',
                          border: '1px solid #334155',
                        }}
                      >
                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <div
                            style={{
                              flexShrink: 0,
                              width: 36,
                              height: 36,
                              borderRadius: 10,
                              background: 'rgba(34, 197, 94, 0.12)',
                              border: '1px solid rgba(34, 197, 94, 0.25)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Sparkles size={18} color="#4ade80" />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: '#f1f5f9',
                                marginBottom: rest ? 4 : 0,
                                lineHeight: 1.35,
                              }}
                            >
                              {head}
                            </div>
                            {rest ? (
                              <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>
                                {rest}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {fixes.length > 0 && (
              <section
                style={{
                  flex: '1 1 240px',
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 12,
                    paddingLeft: 4,
                    borderLeft: '3px solid #38bdf8',
                  }}
                >
                  <Bug size={16} color="#38bdf8" aria-hidden />
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#38bdf8',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {t('whats_new_section_fixes')}
                  </span>
                </div>
                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: 14,
                    background: 'rgba(56, 189, 248, 0.06)',
                    border: '1px solid rgba(56, 189, 248, 0.18)',
                  }}
                >
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    {fixes.map((line, idx) => {
                      const { head, rest } = parseLine(line)
                      return (
                        <li
                          key={`${idx}-${head}`}
                          style={{
                            display: 'flex',
                            gap: 12,
                            alignItems: 'flex-start',
                            paddingBottom: idx < fixes.length - 1 ? 14 : 0,
                            marginBottom: idx < fixes.length - 1 ? 14 : 0,
                            borderBottom:
                              idx < fixes.length - 1 ? '1px solid rgba(51, 65, 85, 0.6)' : 'none',
                          }}
                        >
                          <div
                            style={{
                              flexShrink: 0,
                              width: 22,
                              height: 22,
                              borderRadius: '50%',
                              background: 'rgba(34, 197, 94, 0.18)',
                              border: '1px solid rgba(34, 197, 94, 0.35)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginTop: 2,
                            }}
                          >
                            <Check size={12} color="#4ade80" strokeWidth={3} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', lineHeight: 1.35 }}>
                              {head}
                            </div>
                            {rest ? (
                              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>
                                {rest}
                              </p>
                            ) : null}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </section>
            )}
          </div>

          {/* Preference row — like reference “keep current” strip */}
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              cursor: 'pointer',
              marginTop: 18,
              padding: '14px 16px',
              borderRadius: 12,
              background: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid #334155',
            }}
          >
            <input
              type="checkbox"
              checked={dontShow}
              onChange={(e) => setDontShow(e.target.checked)}
              style={{
                marginTop: 3,
                width: 16,
                height: 16,
                accentColor: '#22c55e',
                cursor: 'pointer',
              }}
            />
            <span style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.45 }}>{t('whats_new_dont_show')}</span>
          </label>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 22px 22px',
            background: '#0f172a',
            borderTop: '1px solid #1e293b',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <button
            type="button"
            disabled={busy}
            onClick={onLater}
            style={{
              padding: 0,
              border: 'none',
              background: 'none',
              color: '#38bdf8',
              fontSize: 14,
              fontWeight: 500,
              cursor: busy ? 'wait' : 'pointer',
              textDecoration: 'none',
            }}
          >
            {t('whats_new_not_now')}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onDone}
            style={{
              padding: '12px 28px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 50%, #0f766e 100%)',
              color: '#f0fdf4',
              fontWeight: 600,
              fontSize: 15,
              cursor: busy ? 'wait' : 'pointer',
              boxShadow: '0 10px 28px rgba(22, 163, 74, 0.35)',
            }}
          >
            {t('whats_new_done')}
          </button>
        </div>
      </div>
    </div>
  )
}
