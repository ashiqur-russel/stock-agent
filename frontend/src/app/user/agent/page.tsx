'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useApp } from '@/contexts/AppContext'
import { useChat } from '@/hooks/useChat'
import { usePortfolio } from '@/hooks/usePortfolio'
import { settings } from '@/lib/api'
import ReactMarkdown from 'react-markdown'
import { chatMarkdownComponents } from '@/components/chat/ChatMarkdown'

function ChatContent() {
  const { t, currency } = useApp()
  const { messages, streaming, error, send, clear } = useChat(currency)
  const { holdings } = usePortfolio()
  const searchParams = useSearchParams()
  const [input, setInput] = useState('')
  const [aiChatOk, setAiChatOk] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    settings
      .getPreferences()
      .then((p) => setAiChatOk(p.ai_chat_enabled !== false))
      .catch(() => setAiChatOk(true))
  }, [])

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
    if (!input.trim() || streaming || !aiChatOk) return
    send(input.trim())
    setInput('')
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 'calc(100vh - 64px)',
        maxWidth: 1100,
        margin: '0 auto',
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
          flexShrink: 0,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{t('chat_title')}</h1>
        <button
          type="button"
          onClick={clear}
          style={{
            padding: '8px 16px',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 8,
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          {t('chat_clear')}
        </button>
      </div>
      {!aiChatOk && (
        <div
          style={{
            marginBottom: 16,
            padding: '12px 16px',
            background: '#1c1100',
            border: '1px solid #78350f',
            borderRadius: 10,
            color: '#fbbf24',
            fontSize: 13,
            lineHeight: 1.5,
            flexShrink: 0,
          }}
        >
          {t('chat_ai_disabled')}{' '}
          <Link href='/user/settings' className='text-brand no-underline hover:underline font-semibold'>
            {t('nav_settings')}
          </Link>
        </div>
      )}

      <div style={{ display: 'flex', gap: 24, flex: 1, minHeight: 0, alignItems: 'stretch' }}>
        {/* Quick actions rail */}
        {holdings.length > 0 && (
          <aside
            style={{
              width: 168,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: '#64748b',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {t('chat_quick')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {holdings.map((h) => (
                <button
                  key={h.ticker}
                  type="button"
                  onClick={() => {
                    setInput(`Analyze ${h.ticker} for a swing trade`)
                  }}
                  style={{
                    padding: '10px 12px',
                    background: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: 10,
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: 13,
                    textAlign: 'left',
                    transition: 'border-color 0.15s, color 0.15s',
                  }}
                >
                  <span style={{ marginRight: 6 }}>📈</span>
                  {h.ticker}
                </button>
              ))}
            </div>
          </aside>
        )}

        {/* Main column: transcript + composer */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            minHeight: 0,
            gap: 0,
          }}
        >
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              background: 'linear-gradient(180deg, #0b1220 0%, #0f172a 100%)',
              border: '1px solid #1e293b',
              borderRadius: 16,
              padding: '20px 22px 24px',
              marginBottom: 16,
            }}
          >
            {messages.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  color: '#64748b',
                  padding: '48px 20px',
                  fontSize: 15,
                  lineHeight: 1.6,
                }}
              >
                {t('chat_empty')}
              </div>
            )}

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 28,
                alignItems: 'stretch',
              }}
            >
              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    gap: 8,
                    width: '100%',
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      paddingLeft: msg.role === 'user' ? 0 : 4,
                      paddingRight: msg.role === 'user' ? 4 : 0,
                    }}
                  >
                    {msg.role === 'user' ? t('chat_role_you') : t('chat_role_advisor')}
                  </span>

                  {msg.role === 'assistant' ? (
                    <div
                      style={{
                        width: '100%',
                        maxWidth: 'min(100%, 720px)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: 10,
                      }}
                    >
                      {(msg.toolCalls ?? []).length > 0 && (
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 8,
                            marginBottom: 2,
                          }}
                        >
                          {msg.toolCalls!.map((tc, j) => (
                            <span
                              key={j}
                              style={{
                                background: '#1e293b',
                                border: '1px solid #334155',
                                borderRadius: 999,
                                padding: '4px 12px',
                                fontSize: 11,
                                color: '#94a3b8',
                              }}
                            >
                              {t('chat_tool')}{' '}
                              <code style={{ color: '#cbd5e1' }}>{tc}</code>
                            </span>
                          ))}
                        </div>
                      )}
                      <div
                        style={{
                          background: '#1a2332',
                          border: '1px solid #2d3b4d',
                          borderRadius: '14px 14px 14px 6px',
                          padding: '16px 18px 18px',
                          color: '#e2e8f0',
                          fontSize: 14,
                          lineHeight: 1.7,
                          width: '100%',
                          boxSizing: 'border-box',
                        }}
                      >
                        {msg.content ? (
                          <div style={{ minHeight: 4 }}>
                            <ReactMarkdown components={chatMarkdownComponents}>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <span style={{ color: '#64748b' }}>{t('chat_thinking')}</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        maxWidth: 'min(85%, 520px)',
                        background: 'linear-gradient(145deg, #16a34a 0%, #22c55e 100%)',
                        borderRadius: '14px 14px 6px 14px',
                        padding: '14px 18px',
                        color: '#fff',
                        fontSize: 14,
                        lineHeight: 1.6,
                        wordBreak: 'break-word',
                        boxShadow: '0 4px 14px rgba(34, 197, 94, 0.15)',
                      }}
                    >
                      {msg.content}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div ref={bottomRef} style={{ height: 1, flexShrink: 0 }} />
          </div>

          {error && (
            <div
              style={{
                color: '#fecaca',
                fontSize: 13,
                marginBottom: 10,
                padding: '8px 12px',
                background: '#450a0a',
                border: '1px solid #7f1d1d',
                borderRadius: 8,
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              gap: 10,
              flexShrink: 0,
              padding: '4px 0 0',
              borderTop: '1px solid #1e293b',
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder={t('chat_placeholder')}
              disabled={streaming || !aiChatOk}
              title={!aiChatOk ? t('chat_send_disabled_ai') : undefined}
              style={{
                flex: 1,
                minWidth: 0,
                padding: '14px 16px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 12,
                color: '#f1f5f9',
                fontSize: 15,
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={streaming || !input.trim() || !aiChatOk}
              title={!aiChatOk ? t('chat_send_disabled_ai') : undefined}
              style={{
                padding: '14px 22px',
                background: streaming || !input.trim() || !aiChatOk ? '#14532d' : '#22c55e',
                border: 'none',
                borderRadius: 12,
                color: '#fff',
                fontWeight: 600,
                cursor: streaming || !input.trim() || !aiChatOk ? 'not-allowed' : 'pointer',
                fontSize: 15,
                flexShrink: 0,
              }}
            >
              {streaming ? '…' : t('chat_send')}
            </button>
          </div>
          <p
            style={{
              fontSize: 11,
              color: '#475569',
              marginTop: 10,
              textAlign: 'center',
              lineHeight: 1.5,
            }}
          >
            {t('chat_disclaimer')}
          </p>
          <p
            style={{
              fontSize: 11,
              color: '#64748b',
              marginTop: 6,
              textAlign: 'center',
              lineHeight: 1.55,
              maxWidth: 560,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            {t('chat_sources')}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div style={{ color: '#64748b', padding: 24 }}>
          Loading…
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  )
}
