'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'
import TypingIndicator from './TypingIndicator'
import WelcomeCard from './WelcomeCard'
import ScrollToBottomFAB from './ScrollToBottomFAB'
import { isLightColor } from '@/lib/color-utils'

export interface Message {
  id: string
  role: 'user' | 'bot'
  content: string
}

interface Props {
  botId: string
  botName: string
  leagueLabel: string
  welcomeMessage?: string
  primaryColor?: string
  isEmbed?: boolean
  sport?: string
}

export default function ChatWindow({
  botId,
  botName,
  leagueLabel,
  welcomeMessage,
  primaryColor,
  isEmbed,
  sport,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [showWelcome, setShowWelcome] = useState(true)
  const [showScrollFAB, setShowScrollFAB] = useState(false)

  // Stable conversation ID for the lifetime of this chat session — used by analytics
  const conversationIdRef = useRef<string | null>(null)

  // Ref so handleSend can always read the latest messages without being a
  // useCallback dependency — avoids recreating the function on every token.
  const messagesRef = useRef<Message[]>(messages)
  const abortRef = useRef<AbortController | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  // Track message count to distinguish "new message added" from "token appended"
  const prevLengthRef = useRef(messages.length)
  // Track if user is near bottom for auto-scroll
  const isNearBottomRef = useRef(true)

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  // Cancel any in-flight stream when the component unmounts
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  // Mobile keyboard handling: scroll chat into view when virtual keyboard opens/closes
  useEffect(() => {
    const viewport = typeof window !== 'undefined' ? window.visualViewport : null
    if (!viewport) return

    function handleResize() {
      // When keyboard opens, the visualViewport height shrinks.
      // Scroll the last message into view so input stays visible.
      bottomRef.current?.scrollIntoView({ behavior: 'instant' })
    }

    viewport.addEventListener('resize', handleResize)
    return () => viewport.removeEventListener('resize', handleResize)
  }, [])

  // Scroll-to-bottom FAB: track scroll position
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    function handleScroll() {
      if (!container) return
      const threshold = 100
      const distFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight
      const nearBottom = distFromBottom < threshold
      isNearBottomRef.current = nearBottom
      setShowScrollFAB(!nearBottom && container.scrollHeight > container.clientHeight)
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // Scroll to bottom on every update, but only when user is near bottom.
  // Animate smoothly when a new message is added; per-token updates use 'instant'.
  useEffect(() => {
    if (!isNearBottomRef.current) return
    const isNewMessage = messages.length > prevLengthRef.current
    prevLengthRef.current = messages.length
    bottomRef.current?.scrollIntoView({
      behavior: isNewMessage ? 'smooth' : 'instant',
    })
  }, [messages])

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    isNearBottomRef.current = true
    setShowScrollFAB(false)
  }

  // useCallback deps are [botId, isStreaming] only. The messages dependency is
  // satisfied via messagesRef so handleSend isn't recreated on every token —
  // that would cause ChatInput to re-render ~once per token during streaming.
  const handleSend = useCallback(
    async (text: string) => {
      if (isStreaming) return

      setShowWelcome(false)

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

      // On the very first send, prepend the welcome message so it stays in the chat log
      const welcomePrefix: Message[] =
        currentMessages.length === 0
          ? [
              {
                id: 'welcome',
                role: 'bot',
                content:
                  welcomeMessage ||
                  `Hi! Ask me anything about the ${leagueLabel}.`,
              },
            ]
          : []

      // Append welcome (if first), user message, and empty bot placeholder
      setMessages((prev) => [
        ...prev,
        ...welcomePrefix,
        userMessage,
        { id: crypto.randomUUID(), role: 'bot', content: '' },
      ])
      setIsStreaming(true)

      // Ensure we auto-scroll when sending a new message
      isNearBottomRef.current = true

      // Build the history to send to /api/chat:
      //   - skip the UI-only welcome message (id='welcome')
      //   - append the new user message
      //   - map 'bot' → 'assistant' for OpenAI-compatible format
      const apiHistory = [...currentMessages, userMessage]
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          role: m.role === 'bot' ? ('assistant' as const) : ('user' as const),
          content: m.content,
        }))

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bot_id: botId,
            messages: apiHistory,
            // Generate conversation_id on first send; reuse for subsequent messages
            conversation_id:
              conversationIdRef.current ??
              (conversationIdRef.current = crypto.randomUUID()),
          }),
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
    [botId, isStreaming, welcomeMessage, leagueLabel]
  )

  function handleChipClick(question: string) {
    setShowWelcome(false)
    handleSend(question)
  }

  const isDarkHeader = primaryColor && !isLightColor(primaryColor)

  return (
    <div
      className={`flex flex-col ${isEmbed ? 'h-full' : 'h-dvh'} bg-neutral-50`}
      style={{
        /* Fallback for browsers without dvh support — h-dvh overrides when supported */
        height: isEmbed ? undefined : '100vh',
        /* Prevent iOS bounce-scroll on the outer container */
        overscrollBehavior: 'none',
      }}
    >
      {/* Header — applies owner's brand color when set, falls back to glassmorphism */}
      <header
        className={`border-b px-4 py-2 md:py-3 flex-shrink-0 flex items-center gap-3 ${
          primaryColor
            ? ''
            : 'bg-white/80 backdrop-blur-xl border-neutral-200'
        }`}
        style={{
          ...(primaryColor
            ? { backgroundColor: primaryColor, borderColor: 'rgba(0,0,0,0.1)' }
            : {}),
          paddingTop: isEmbed ? undefined : 'max(0.75rem, env(safe-area-inset-top))',
          paddingLeft: 'max(1rem, env(safe-area-inset-left))',
          paddingRight: 'max(1rem, env(safe-area-inset-right))',
        }}
      >
        {/* Bot avatar */}
        <div
          className={`w-9 h-9 rounded-full text-sm font-semibold flex items-center justify-center flex-shrink-0 ${
            isDarkHeader
              ? 'bg-white/20 text-white'
              : 'gradient-primary text-white'
          }`}
        >
          {botName.charAt(0).toUpperCase()}
        </div>
        {/* Bot name + status */}
        <div className="flex-1 min-w-0">
          <h1
            className={`text-base font-semibold truncate ${
              isDarkHeader ? 'text-white' : 'text-neutral-900'
            }`}
          >
            {botName}
          </h1>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            <span
              className={`text-xs ${
                isDarkHeader ? 'text-white/70' : 'text-neutral-500'
              }`}
            >
              Online
            </span>
          </div>
        </div>
        {/* Embed close button */}
        {isEmbed && (
          <button
            type="button"
            onClick={() => window.parent.postMessage({ type: 'close-chat' }, '*')}
            aria-label="Close chat"
            className={`flex-shrink-0 p-1.5 rounded-full transition-colors ${
              isDarkHeader
                ? 'text-white/70 hover:text-white hover:bg-white/10'
                : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <X size={18} />
          </button>
        )}
      </header>

      {/* Message list */}
      <div
        ref={scrollContainerRef}
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
        className="flex-1 overflow-y-auto overflow-x-hidden px-3 md:px-4 py-4 space-y-2 md:space-y-3 relative"
        style={{
          /* Prevent pull-to-refresh in chat view */
          overscrollBehavior: 'contain',
        }}
      >
        {showWelcome && messages.length === 0 ? (
          <WelcomeCard
            botName={botName}
            sport={sport ?? 'soccer'}
            welcomeMessage={welcomeMessage ?? `Hi! Ask me anything about the ${leagueLabel}.`}
            onChipClick={handleChipClick}
          />
        ) : (
          <>
            {messages.map((msg, i) => {
              // Show avatar if this is a bot message and the previous message is not a bot message
              const showAvatar =
                msg.role === 'bot' && (i === 0 || messages[i - 1].role !== 'bot')

              // Show typing indicator for streaming bot placeholder with no content yet
              if (
                isStreaming &&
                msg.role === 'bot' &&
                msg.content === '' &&
                i === messages.length - 1
              ) {
                return <TypingIndicator key={msg.id} />
              }

              return (
                <MessageBubble
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  botName={botName}
                  showAvatar={showAvatar}
                />
              )
            })}
          </>
        )}
        {/* Invisible anchor — scrolled into view on every update */}
        <div ref={bottomRef} aria-hidden="true" />
      </div>

      {/* Scroll to bottom FAB */}
      <div className="relative">
        <ScrollToBottomFAB visible={showScrollFAB} onClick={scrollToBottom} />
      </div>

      {/* Input bar */}
      <ChatInput onSend={handleSend} disabled={isStreaming} />

      {isEmbed && (
        <div className="text-center py-1 text-xs text-neutral-400 border-t border-neutral-100 bg-white flex-shrink-0">
          Powered by{' '}
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-500 hover:underline"
          >
            Bot Portal
          </a>
        </div>
      )}
    </div>
  )
}
