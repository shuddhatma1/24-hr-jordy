'use client'

export default function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-neutral-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-soft animate-fade-in">
        <div className="flex items-center gap-1">
          <span
            className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce-dot"
            style={{ animationDelay: '0s' }}
          />
          <span
            className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce-dot"
            style={{ animationDelay: '0.15s' }}
          />
          <span
            className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce-dot"
            style={{ animationDelay: '0.3s' }}
          />
        </div>
      </div>
    </div>
  )
}
