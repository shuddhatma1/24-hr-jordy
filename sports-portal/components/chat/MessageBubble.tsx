'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Props {
  role: 'user' | 'bot'
  content: string
  botName?: string
  showAvatar?: boolean
}

export default function MessageBubble({
  role,
  content,
  botName,
  showAvatar = false,
}: Props) {
  const isUser = role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end animate-slide-up">
        <div
          data-testid="message-bubble"
          className="max-w-[85%] md:max-w-[80%] rounded-2xl rounded-br-sm px-4 py-2.5 text-base md:text-sm leading-relaxed break-words bg-gradient-to-r from-brand-500 to-accent-600 text-white"
        >
          {content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start items-end gap-2 animate-slide-up">
      {showAvatar ? (
        <div className="w-7 h-7 rounded-full gradient-primary text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">
          {botName ? botName.charAt(0).toUpperCase() : 'B'}
        </div>
      ) : (
        <div className="w-7 flex-shrink-0" />
      )}
      <div
        data-testid="message-bubble"
        className="max-w-[85%] md:max-w-[80%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-base md:text-sm leading-relaxed break-words bg-neutral-100 text-neutral-900 shadow-soft"
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            strong: ({ children }) => (
              <strong className="font-semibold">{children}</strong>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                className="text-brand-600 underline hover:text-brand-700"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  )
}
