'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'

export interface Message {
  id: string
  role: 'user' | 'bot'
  content: string
}

interface Props {
  botId: string
  botName: string
  leagueLabel: string
}

export default function ChatWindow({ botId, botName, leagueLabel }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: crypto.randomUUID(),
      role: 'bot',
      content: `Hi! Ask me anything about the ${leagueLabel}.`,
    },
  ])
  const [isStreaming, setIsStreaming] = useState(false)

  // Ref so handleSend can always read the latest messages without being a
  // useCallback dependency — avoids recreating the function on every token.
  const messagesRef = useRef<Message[]>(messages)
  const abortRef = useRef<AbortController | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  // Track message count to distinguish "new message added" from "token appended"
  const prevLengthRef = useRef(messages.length)

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  // Cancel any in-flight stream when the component unmounts
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  // Scroll to bottom on every update, but only animate smoothly when a new
  // message is added. Per-token updates use 'instant' to avoid jank from
  // dozens of competing smooth-scroll animations during a streaming response.
  useEffect(() => {
    const isNewMessage = messages.length > prevLengthRef.current
    prevLengthRef.current = messages.length
    bottomRef.current?.scrollIntoView({
      behavior: isNewMessage ? 'smooth' : 'instant',
    })
  }, [messages])

  // useCallback deps are [botId, isStreaming] only. The messages dependency is
  // satisfied via messagesRef so handleSend isn't recreated on every token —
  // that would cause ChatInput to re-render ~once per token during streaming.
  const handleSend = useCallback(
    async (text: string) => {
      if (isStreaming) return

      // Cancel any previous in-flight request
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text,
      }

      // Snapshot current messages NOW (before state updates) to build API history
      const currentMessages = messagesRef.current

      // Append user message + empty bot placeholder in one update
      setMessages((prev) => [
        ...prev,
        userMessage,
        { id: crypto.randomUUID(), role: 'bot', content: '' },
      ])
      setIsStreaming(true)

      // Build the history to send to /api/chat:
      //   - skip the UI-only welcome message (index 0)
      //   - append the new user message
      //   - map 'bot' → 'assistant' for OpenAI-compatible format
      const apiHistory = [...currentMessages.slice(1), userMessage].map((m) => ({
        role: m.role === 'bot' ? ('assistant' as const) : ('user' as const),
        content: m.content,
      }))

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bot_id: botId, messages: apiHistory }),
          signal: controller.signal,
        })

        if (!res.ok) {
          let errorMsg = 'Bot error'
          try {
            const data = (await res.json()) as { error?: string }
            if (data.error) errorMsg = data.error
          } catch {
            // ignore JSON parse failure on error body
          }
          throw new Error(errorMsg)
        }

        if (!res.body) {
          throw new Error('Empty response from bot')
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          // Accumulate and split on newlines; incomplete trailing line stays buffered
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue

            const payload = line.slice(6) // strip leading 'data: '

            if (payload === '[DONE]') {
              setIsStreaming(false)
              return
            }

            try {
              const parsed = JSON.parse(payload) as { token?: unknown }
              if (typeof parsed.token === 'string') {
                setMessages((prev) => {
                  const updated = [...prev]
                  const last = updated[updated.length - 1]
                  updated[updated.length - 1] = {
                    ...last,
                    content: last.content + parsed.token,
                  }
                  return updated
                })
              }
            } catch {
              // skip malformed SSE data lines
            }
          }
        }

        // Stream closed without an explicit [DONE] — still mark as done
        setIsStreaming(false)
      } catch (err: unknown) {
        // Silently ignore user-initiated aborts (e.g. page navigation)
        if (err instanceof DOMException && err.name === 'AbortError') return

        setMessages((prev) => {
          const updated = [...prev]
          // Preserve the id of the placeholder so React doesn't unmount the bubble
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: 'Sorry, something went wrong. Please try again.',
          }
          return updated
        })
        setIsStreaming(false)
      }
    },
    [botId, isStreaming]
  )

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <h1 className="text-base font-semibold text-gray-900">{botName}</h1>
      </header>

      {/* Message list */}
      <div
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
      >
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            role={msg.role}
            content={msg.content}
            isStreaming={
              isStreaming &&
              msg.id === messages[messages.length - 1].id &&
              msg.role === 'bot'
            }
          />
        ))}
        {/* Invisible anchor — scrolled into view on every update */}
        <div ref={bottomRef} aria-hidden="true" />
      </div>

      {/* Input bar */}
      <ChatInput onSend={handleSend} disabled={isStreaming} />
    </div>
  )
}
