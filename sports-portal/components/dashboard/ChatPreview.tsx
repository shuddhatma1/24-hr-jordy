'use client'

import { isLightColor } from '@/lib/color-utils'

interface ChatPreviewProps {
  botName: string
  welcomeMessage: string
  primaryColor: string
  persona: string
}

function getPersonaResponse(persona: string): string {
  switch (persona) {
    case 'friendly':
      return 'Great question! Let me check...'
    case 'professional':
      return 'Let me look that up for you.'
    case 'enthusiastic':
      return 'Ooh, great question!!'
    default:
      return 'Let me look that up for you.'
  }
}

export default function ChatPreview({ botName, welcomeMessage, primaryColor, persona }: ChatPreviewProps) {
  const validColor = /^#[0-9A-Fa-f]{6}$/.test(primaryColor)
  const headerBg = validColor ? primaryColor : undefined
  const textColor = validColor && isLightColor(primaryColor) ? 'text-neutral-900' : 'text-white'
  const initial = (botName[0] ?? 'B').toUpperCase()

  return (
    <div className="rounded-2xl shadow-card border border-neutral-200/50 overflow-hidden w-full">
      {/* Header */}
      <div
        className={`px-4 py-3 flex items-center gap-3 ${!validColor ? 'gradient-primary' : ''}`}
        style={headerBg ? { backgroundColor: headerBg } : undefined}
      >
        <div className={`w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold ${textColor}`}>
          {initial}
        </div>
        <span className={`text-sm font-semibold ${textColor}`}>
          {botName || 'Your Bot'}
        </span>
      </div>

      {/* Messages */}
      <div className="bg-neutral-50 px-4 py-4 space-y-3">
        {/* Bot welcome message */}
        <div className="flex gap-2">
          <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center text-[10px] font-bold text-neutral-600 flex-shrink-0 mt-0.5">
            {initial}
          </div>
          <div className="bg-white rounded-xl rounded-tl-sm px-3 py-2 text-xs text-neutral-700 shadow-soft max-w-[85%]">
            {welcomeMessage || 'Hi! Ask me anything.'}
          </div>
        </div>

        {/* User message */}
        <div className="flex justify-end">
          <div
            className={validColor ? 'rounded-xl rounded-tr-sm px-3 py-2 text-xs text-white max-w-[85%]' : 'gradient-primary rounded-xl rounded-tr-sm px-3 py-2 text-xs text-white max-w-[85%]'}
            style={validColor && headerBg ? { backgroundColor: headerBg } : undefined}
          >
            Who won last night?
          </div>
        </div>

        {/* Bot response */}
        <div className="flex gap-2">
          <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center text-[10px] font-bold text-neutral-600 flex-shrink-0 mt-0.5">
            {initial}
          </div>
          <div className="bg-white rounded-xl rounded-tl-sm px-3 py-2 text-xs text-neutral-700 shadow-soft max-w-[85%]">
            {getPersonaResponse(persona)}
          </div>
        </div>
      </div>
    </div>
  )
}
