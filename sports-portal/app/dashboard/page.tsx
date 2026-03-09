'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { SPORT_LABELS, LEAGUES_BY_SPORT, Sport } from '@/lib/bot-registry'

interface BotData {
  bot_id: string
  bot_name: string
  sport: string
  league: string
}

function getLeagueLabel(sport: string, league: string): string {
  const leagues = LEAGUES_BY_SPORT[sport as Sport] ?? []
  return leagues.find((l) => l.value === league)?.label ?? league
}

export default function DashboardPage() {
  const router = useRouter()
  const [bot, setBot] = useState<BotData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/bots/me')
      .then(async (res) => {
        if (res.status === 401) {
          router.push('/login')
          return
        }
        if (res.status === 404) {
          router.push('/setup')
          return
        }
        if (!res.ok) {
          setError('Failed to load bot data. Please refresh.')
          setLoading(false)
          return
        }
        const data = await res.json() as BotData
        setBot(data)
        setLoading(false)
      })
      .catch(() => {
        setError('Network error. Please refresh.')
        setLoading(false)
      })
  }, [router])

  function getChatUrl(botId: string): string {
    return `${window.location.origin}/chat/${botId}`
  }

  async function handleCopyUrl() {
    if (!bot) return
    try {
      await navigator.clipboard.writeText(getChatUrl(bot.bot_id))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Could not copy to clipboard.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    )
  }

  if (!bot) return null

  const chatUrl = getChatUrl(bot.bot_id)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-lg font-semibold text-gray-900">Sports Chatbot Portal</h1>
          <button
            onClick={() => void signOut({ callbackUrl: '/login' })}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Log out
          </button>
        </div>

        {/* Bot details */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Chatbot</h2>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="text-sm text-gray-900">{bot.bot_name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Sport</dt>
              <dd className="text-sm text-gray-900">{SPORT_LABELS[bot.sport as Sport] ?? bot.sport}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">League</dt>
              <dd className="text-sm text-gray-900">{getLeagueLabel(bot.sport, bot.league)}</dd>
            </div>
          </dl>
        </div>

        {/* URL section */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-2">Your chatbot URL</p>
          <div className="flex gap-2">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 font-mono truncate">
              {chatUrl}
            </div>
            <button
              onClick={() => void handleCopyUrl()}
              className="py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 whitespace-nowrap"
            >
              {copied ? 'Copied!' : 'Copy URL'}
            </button>
          </div>
        </div>

        {/* Preview link */}
        <a
          href={chatUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-2 px-4 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 text-center"
        >
          Preview Chatbot ↗
        </a>

      </div>
    </div>
  )
}
