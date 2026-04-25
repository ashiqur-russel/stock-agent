'use client'

import { useState, useCallback } from 'react'
import { getToken } from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  toolCalls?: string[]
}

export function useChat(currency: 'EUR' | 'USD' = 'EUR') {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = useCallback(async (userText: string) => {
    if (!userText.trim() || streaming) return

    const userMsg: ChatMessage = { role: 'user', content: userText }
    const history = [...messages, userMsg]
    setMessages(history)
    setStreaming(true)
    setError(null)

    const assistantMsg: ChatMessage = { role: 'assistant', content: '', toolCalls: [] }
    setMessages([...history, assistantMsg])

    try {
      const token = getToken()
      const res = await fetch(`${API_URL}/api/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          currency,
        }),
      })

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))
            if (event.type === 'text_delta') {
              setMessages((prev) => {
                const updated = [...prev]
                const last = updated[updated.length - 1]
                if (last.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, content: last.content + event.text }
                }
                return updated
              })
            } else if (event.type === 'tool_call') {
              setMessages((prev) => {
                const updated = [...prev]
                const last = updated[updated.length - 1]
                if (last.role === 'assistant') {
                  updated[updated.length - 1] = {
                    ...last,
                    toolCalls: [...(last.toolCalls ?? []), event.name],
                  }
                }
                return updated
              })
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Chat error')
    } finally {
      setStreaming(false)
    }
  }, [messages, streaming, currency])

  const clear = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return { messages, streaming, error, send, clear }
}
