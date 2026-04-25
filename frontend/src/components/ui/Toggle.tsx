'use client'

interface ToggleProps {
  options: [string, string]
  value: string
  onChange: (v: string) => void
  activeColor?: string
  style?: React.CSSProperties
}

export default function Toggle({ options, value, onChange, activeColor = '#22c55e', style }: ToggleProps) {
  return (
    <div
      style={{
        display: 'flex',
        background: '#1e293b',
        borderRadius: 8,
        overflow: 'hidden',
        border: '1px solid #334155',
        ...style,
      }}
    >
      {options.map((opt) => {
        const active = value === opt
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            style={{
              padding: '4px 12px',
              fontSize: 13,
              fontWeight: active ? 600 : 400,
              background: active ? activeColor : 'transparent',
              color: active ? '#fff' : '#94a3b8',
              border: 'none',
              cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}
