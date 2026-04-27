'use client'

import { useCallback, useEffect, useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import { release } from '@/lib/api'

/**
 * Fetches /api/v1/release/whats-new and shows release notes until the user
 * dismisses (Done / suppress) or chooses Remind me later (no API — shows again next visit).
 */
export default function WhatsNewModal() {
  const { lang, t } = useApp()
  const [open, setOpen] = useState(false)
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="whats-new-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        background: 'rgba(2, 6, 23, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          maxHeight: '90vh',
          overflow: 'auto',
          background: '#0f172a',
          border: '1px solid #334155',
          borderRadius: 12,
          padding: '24px 28px',
          boxShadow: '0 25px 50px rgba(0,0,0,0.45)',
        }}
      >
        <h2
          id="whats-new-title"
          style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}
        >
          {title}
        </h2>

        {features.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#22c55e', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {t('whats_new_section_features')}
            </div>
            <ul style={{ margin: 0, paddingLeft: 20, color: '#cbd5e1', fontSize: 14, lineHeight: 1.55 }}>
              {features.map((f) => (
                <li key={f} style={{ marginBottom: 6 }}>{f}</li>
              ))}
            </ul>
          </div>
        )}

        {fixes.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#38bdf8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {t('whats_new_section_fixes')}
            </div>
            <ul style={{ margin: 0, paddingLeft: 20, color: '#cbd5e1', fontSize: 14, lineHeight: 1.55 }}>
              {fixes.map((f) => (
                <li key={f} style={{ marginBottom: 6 }}>{f}</li>
              ))}
            </ul>
          </div>
        )}

        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            cursor: 'pointer',
            marginBottom: 20,
            fontSize: 13,
            color: '#94a3b8',
            lineHeight: 1.4,
          }}
        >
          <input
            type="checkbox"
            checked={dontShow}
            onChange={(e) => setDontShow(e.target.checked)}
            style={{ marginTop: 3 }}
          />
          <span>{t('whats_new_dont_show')}</span>
        </label>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-end' }}>
          <button
            type="button"
            disabled={busy}
            onClick={onLater}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              border: '1px solid #475569',
              background: 'transparent',
              color: '#e2e8f0',
              fontSize: 14,
              cursor: busy ? 'wait' : 'pointer',
            }}
          >
            {t('whats_new_not_now')}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onDone}
            style={{
              padding: '10px 18px',
              borderRadius: 8,
              border: 'none',
              background: '#22c55e',
              color: '#022c14',
              fontWeight: 600,
              fontSize: 14,
              cursor: busy ? 'wait' : 'pointer',
            }}
          >
            {t('whats_new_done')}
          </button>
        </div>
      </div>
    </div>
  )
}
