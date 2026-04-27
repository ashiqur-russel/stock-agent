'use client'

import { type CSSProperties, type ReactNode, useEffect } from 'react'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'

const BACKDROP: Record<string, string> = {
  neutral: 'rgba(0, 0, 0, 0.7)',
  slate: 'rgba(2, 6, 23, 0.72)',
}

export interface ModalShellProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  closeOnBackdrop?: boolean
  lockBodyScroll?: boolean
  zIndex?: number
  backdropTint?: keyof typeof BACKDROP
  /** Backdrop stretches content (e.g. near-fullscreen / “maximized” panels). */
  fillViewport?: boolean
  outerPadding?: number
  /** Merged onto the dialog panel (layout, size, borders, etc.). */
  panelStyle?: CSSProperties
  ariaLabelledBy?: string
  ariaDescribedBy?: string
}

/**
 * Shared modal template: backdrop, focus-safe dismissal (Escape + optional backdrop click),
 * optional body scroll lock, and a single dialog panel slot.
 *
 * Compose headers/footers/tabs inside `children`. For titled simple dialogs, use `Modal`.
 */
export default function ModalShell({
  open,
  onClose,
  children,
  closeOnBackdrop = true,
  lockBodyScroll = true,
  zIndex = 500,
  backdropTint = 'neutral',
  fillViewport = false,
  outerPadding = 16,
  panelStyle,
  ariaLabelledBy,
  ariaDescribedBy,
}: ModalShellProps) {
  useBodyScrollLock(open && lockBodyScroll)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const bg = BACKDROP[backdropTint] ?? BACKDROP.neutral

  return (
    <div
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex,
        background: bg,
        display: 'flex',
        alignItems: fillViewport ? 'stretch' : 'center',
        justifyContent: fillViewport ? 'stretch' : 'center',
        padding: fillViewport ? 0 : outerPadding,
      }}
      onClick={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden',
          ...panelStyle,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
