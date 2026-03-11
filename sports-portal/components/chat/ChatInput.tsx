'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface Props {
  onSend: (text: string) => void
  disabled: boolean
}

const MAX_LENGTH = 1000
const SHOW_COUNT_THRESHOLD = 900

export default function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Re-focus input when streaming completes so users can type the next question
  useEffect(() => {
    if (!disabled) {
      textareaRef.current?.focus()
    }
  }, [disabled])

  // Auto-grow textarea height based on content
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    // Cap at ~5 lines (120px)
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
  }, [])

  useEffect(() => {
    adjustHeight()
  }, [value, adjustHeight])

  function handleSubmit() {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
    // Reset height after clearing
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div
      className="bg-white/80 backdrop-blur-xl border-t border-neutral-200 px-3 py-2 flex-shrink-0"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Ask a question"
          placeholder="Type a question..."
          disabled={disabled}
          maxLength={MAX_LENGTH}
          rows={1}
          className="flex-1 px-3 py-2.5 border border-neutral-200 rounded-2xl text-base text-neutral-900 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-neutral-400 leading-relaxed"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
          aria-label="Send"
          className="flex-shrink-0 w-11 h-11 flex items-center justify-center gradient-primary text-white rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {/* Arrow-up icon */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M10 3.5L10 16.5M10 3.5L4.5 9M10 3.5L15.5 9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      {value.length >= SHOW_COUNT_THRESHOLD && (
        <div className="text-xs text-neutral-400 text-right mt-1 pr-12" aria-live="polite">
          {value.length}/{MAX_LENGTH}
        </div>
      )}
    </div>
  )
}
