'use client'

import { ReactNode, useEffect } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  footer?: ReactNode
  width?: number | string
  closeOnBackdrop?: boolean
}

/**
 * Generic modal primitive.
 *
 * Handles the visual chrome (backdrop, panel, header, footer) and ESC /
 * click-outside dismissal. Concrete dialogs (confirm, trade form, etc.)
 * compose this so we don't reinvent the styling each time.
 */
export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = 420,
  closeOnBackdrop = true,
}: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      role='dialog'
      aria-modal='true'
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        zIndex: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          background: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: 12,
          padding: 24,
          width: '100%',
          maxWidth: width,
          color: '#f1f5f9',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        }}
      >
        {title !== undefined && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>{title}</h2>
            <button
              onClick={onClose}
              aria-label='Close'
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontSize: 22,
                cursor: 'pointer',
                lineHeight: 1,
                padding: 0,
              }}
            >
              ×
            </button>
          </div>
        )}

        <div>{children}</div>

        {footer && (
          <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
