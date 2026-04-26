'use client'

interface SwitchProps {
  checked: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
  id?: string
  'aria-label'?: string
}

/** Accessible on/off control (distinct from the two-option `Toggle` used in the sidebar). */
export default function Switch({
  checked,
  onChange,
  disabled,
  id,
  'aria-label': ariaLabel,
}: SwitchProps) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => {
        if (!disabled) onChange(!checked)
      }}
      style={{
        width: 44,
        height: 24,
        borderRadius: 999,
        border: '1px solid #334155',
        background: checked ? '#22c55e' : '#1e293b',
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        padding: 0,
        flexShrink: 0,
        transition: 'background 0.15s',
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: 2,
          left: checked ? 22 : 2,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#f8fafc',
          transition: 'left 0.15s ease-out',
          boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
        }}
      />
    </button>
  )
}
