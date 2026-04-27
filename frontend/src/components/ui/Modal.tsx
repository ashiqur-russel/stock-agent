'use client'

import { ReactNode } from 'react'
import ModalShell from './ModalShell'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  footer?: ReactNode
  width?: number | string
  closeOnBackdrop?: boolean
  lockBodyScroll?: boolean
}

/**
 * Simple titled dialog built on {@link ModalShell}.
 * For custom headers (charts, tabs, etc.) use `ModalShell` directly.
 */
export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = 420,
  closeOnBackdrop = true,
  lockBodyScroll = false,
}: ModalProps) {
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      closeOnBackdrop={closeOnBackdrop}
      lockBodyScroll={lockBodyScroll}
      zIndex={500}
      backdropTint="neutral"
      panelStyle={{
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
            type="button"
            onClick={onClose}
            aria-label="Close"
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
    </ModalShell>
  )
}
