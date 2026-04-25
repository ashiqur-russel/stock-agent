'use client'

import type { Components } from 'react-markdown'

const muted = '#94a3b8'
const text = '#e2e8f0'
const codeBg = '#0f172a'
const border = '#334155'

/**
 * Renders assistant markdown with clear paragraph / list / code spacing so
 * streamed replies don’t look like a single dense block.
 */
export const chatMarkdownComponents: Partial<Components> = {
  p: ({ children }) => (
    <p style={{ margin: '0 0 0.9em', lineHeight: 1.75, color: text }}>{children}</p>
  ),
  ul: ({ children }) => (
    <ul
      style={{
        margin: '0.35em 0 0.9em',
        paddingLeft: '1.35rem',
        listStyleType: 'disc',
        color: text,
        lineHeight: 1.65,
      }}
    >
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol
      style={{
        margin: '0.35em 0 0.9em',
        paddingLeft: '1.35rem',
        listStyleType: 'decimal',
        color: text,
        lineHeight: 1.65,
      }}
    >
      {children}
    </ol>
  ),
  li: ({ children }) => <li style={{ marginBottom: '0.4em' }}>{children}</li>,
  h1: ({ children }) => (
    <h1
      style={{
        margin: '0.6em 0 0.4em',
        fontSize: '1.15rem',
        fontWeight: 700,
        color: '#f1f5f9',
        lineHeight: 1.35,
      }}
    >
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2
      style={{
        margin: '0.75em 0 0.45em',
        fontSize: '1.05rem',
        fontWeight: 700,
        color: '#f1f5f9',
        lineHeight: 1.35,
      }}
    >
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3
      style={{
        margin: '0.7em 0 0.4em',
        fontSize: '1rem',
        fontWeight: 600,
        color: '#f1f5f9',
        lineHeight: 1.4,
      }}
    >
      {children}
    </h3>
  ),
  strong: ({ children }) => (
    <strong style={{ color: '#f8fafc', fontWeight: 600 }}>{children}</strong>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: '#67e8f9', textDecoration: 'underline', textUnderlineOffset: 2 }}
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote
      style={{
        margin: '0.6em 0 0.9em',
        paddingLeft: 14,
        borderLeft: `3px solid ${border}`,
        color: muted,
        lineHeight: 1.7,
      }}
    >
      {children}
    </blockquote>
  ),
  hr: () => (
    <hr style={{ border: 'none', borderTop: `1px solid ${border}`, margin: '1em 0' }} />
  ),
  code: ({ className, children, ...rest }) => {
    const isInline = (rest as { inline?: boolean }).inline === true
    if (isInline) {
      return (
        <code
          style={{
            background: codeBg,
            padding: '2px 7px',
            borderRadius: 6,
            fontSize: '0.9em',
            color: '#a5f3fc',
            border: `1px solid ${border}`,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          }}
        >
          {children}
        </code>
      )
    }
    return (
      <code
        className={className}
        style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 13 }}
        {...rest}
      >
        {children}
      </code>
    )
  },
  pre: ({ children }) => (
    <pre
      style={{
        margin: '0.75em 0 1em',
        padding: '14px 16px',
        background: codeBg,
        borderRadius: 10,
        overflow: 'auto',
        fontSize: 13,
        lineHeight: 1.55,
        border: `1px solid ${border}`,
        maxWidth: '100%',
      }}
    >
      {children}
    </pre>
  ),
}
