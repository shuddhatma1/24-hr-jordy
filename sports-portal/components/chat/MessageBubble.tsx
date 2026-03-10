import StreamingCursor from './StreamingCursor'

interface Props {
  role: 'user' | 'bot'
  content: string
  isStreaming?: boolean
}

export default function MessageBubble({ role, content, isStreaming = false }: Props) {
  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        data-testid="message-bubble"
        className={`max-w-[85%] md:max-w-[80%] rounded-2xl px-4 py-2.5 text-base md:text-sm leading-relaxed break-words ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-gray-100 text-gray-900 rounded-bl-sm'
        }`}
      >
        {content}
        {isStreaming && <StreamingCursor />}
      </div>
    </div>
  )
}
