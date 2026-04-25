'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useApp } from '@/contexts/AppContext'
import { useChat } from '@/hooks/useChat'
import { usePortfolio } from '@/hooks/usePortfolio'
import ReactMarkdown from 'react-markdown'

function ChatContent() {
  const { t } = useApp()
  const { messages, streaming, error, send, clear } = useChat()
  const { holdings } = usePortfolio()
  const searchParams = useSearchParams()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ticker = searchParams.get('ticker')
    if (ticker && messages.length === 0) {
      setInput(`Analyze ${ticker} for a swing trade`)
    }
  }, [searchParams, messages.length])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim() || streaming) return
    send(input.trim())
    setInput('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{t('chat_title')}</h1>
        <button onClick={clear} style={{ padding: '6px 14px', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>
          {t('chat_clear')}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 20, flex: 1, minHeight: 0 }}>
        {/* Sidebar quick actions */}
        {holdings.length > 0 && (
          <div style={{ width: 160, flexShrink: 0 }}>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 10, textTransform: 'uppercase' }}>{t('chat_quick')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {holdings.map((h) => (
                <button
                  key={h.ticker}
                  onClick={() => { setInput(`Analyze ${h.ticker} for a swing trade`); }}
                  style={{ padding: '7px 10px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', fontSize: 13, textAlign: 'left' }}
                >
                  📈 {h.ticker}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat window */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ flex: 1, overflowY: 'auto', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 20, marginBottom: 12 }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 0', fontSize: 15 }}>{t('chat_empty')}</div>
            )}
            {messages.map((msg, i) => (
              <div key={i} style={{ marginBottom: 18, display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {msg.role === 'assistant' ? (
                  <div style={{ maxWidth: '85%' }}>
                    {(msg.toolCalls ?? []).length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                        {msg.toolCalls!.map((tc, j) => (
                          <span key={j} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '2px 10px', fontSize: 11, color: '#94a3b8' }}>
                            {t('chat_tool')} {tc}
                          </span>
                        ))}
                      </div>
                    )}
                    <div style={{ background: '#1e293b', borderRadius: '12px 12px 12px 4px', padding: '12px 16px', color: '#f1f5f9', fontSize: 14, lineHeight: 1.7 }}>
                      {msg.content ? (
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      ) : (
                        <span style={{ color: '#64748b' }}>{t('chat_thinking')}</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ background: '#22c55e', borderRadius: '12px 12px 4px 12px', padding: '10px 16px', color: '#fff', fontSize: 14, maxWidth: '75%' }}>
                    {msg.content}
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {error && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 8 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder={t('chat_placeholder')}
              disabled={streaming}
              style={{ flex: 1, padding: '12px 16px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, color: '#f1f5f9', fontSize: 14, outline: 'none' }}
            />
            <button
              onClick={handleSend}
              disabled={streaming || !input.trim()}
              style={{ padding: '12px 20px', background: '#22c55e', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14, opacity: streaming ? 0.7 : 1 }}
            >
              {streaming ? '…' : t('chat_send')}
            </button>
          </div>
          <p style={{ fontSize: 11, color: '#475569', marginTop: 8, textAlign: 'center' }}>{t('chat_disclaimer')}</p>
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div style={{ color: '#64748b' }}>Loading…</div>}>
      <ChatContent />
    </Suspense>
  )
}
