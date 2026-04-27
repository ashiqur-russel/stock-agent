'use client'

export interface TickerNewsRowProps {
  title: string
  url?: string
  publisher?: string
  timeLabel: string
}

/** Single headline row for ticker news lists (modal, future agent UI, etc.). */
export function TickerNewsRow({ title, url, publisher, timeLabel }: TickerNewsRowProps) {
  return (
    <article
      style={{
        background: '#020617',
        borderRadius: 8,
        padding: '12px 14px',
        border: '1px solid #1e293b',
      }}
    >
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 15, fontWeight: 600, color: '#60a5fa', textDecoration: 'none' }}
        >
          {title}
        </a>
      ) : (
        <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>{title}</div>
      )}
      <div
        style={{
          fontSize: 12,
          color: '#64748b',
          marginTop: 6,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        {publisher ? <span>{publisher}</span> : null}
        {timeLabel ? <span>{timeLabel}</span> : null}
      </div>
    </article>
  )
}
