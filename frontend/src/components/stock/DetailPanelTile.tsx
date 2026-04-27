'use client'

/** Compact stat tile used in stock detail (and similar dashboards). */
export function DetailPanelTile({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: '#020617', borderRadius: 8, padding: '10px 12px' }}>
      <div
        style={{
          fontSize: 11,
          color: '#64748b',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 15, color: '#f1f5f9', fontWeight: 600, marginTop: 4 }}>{value}</div>
    </div>
  )
}
