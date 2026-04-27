'use client'

import { ReactNode, useState } from 'react'
import Modal from './Modal'

type Tone = 'danger' | 'primary' | 'neutral'

interface ConfirmDialogProps {
  open: boolean
  title: ReactNode
  message?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: Tone
  onConfirm: () => void | Promise<void>
  onClose: () => void
}

const TONE_STYLE: Record<Tone, { bg: string; hover: string }> = {
  danger:  { bg: '#dc2626', hover: '#b91c1c' },
  primary: { bg: '#22c55e', hover: '#16a34a' },
  neutral: { bg: '#475569', hover: '#334155' },
}

/**
 * Reusable confirm/cancel dialog. Use this in place of `window.confirm()` so
 * destructive actions get a styled, dismissable modal that matches the app
 * theme (and supports async actions with a "working..." state).
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'primary',
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false)
  const palette = TONE_STYLE[tone]

  const handleConfirm = async () => {
    if (busy) return
    setBusy(true)
    try {
      await onConfirm()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!busy) onClose()
      }}
      title={title}
      width={420}
      lockBodyScroll
      footer={
        <>
          <button
            onClick={onClose}
            disabled={busy}
            style={{
              padding: '9px 16px',
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 8,
              color: '#94a3b8',
              cursor: busy ? 'not-allowed' : 'pointer',
              fontSize: 14,
              opacity: busy ? 0.6 : 1,
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={busy}
            style={{
              padding: '9px 18px',
              background: palette.bg,
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontWeight: 600,
              cursor: busy ? 'not-allowed' : 'pointer',
              fontSize: 14,
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? '…' : confirmLabel}
          </button>
        </>
      }
    >
      {message && (
        <div style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.5 }}>{message}</div>
      )}
    </Modal>
  )
}
