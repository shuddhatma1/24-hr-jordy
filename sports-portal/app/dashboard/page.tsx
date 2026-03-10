'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SPORT_LABELS, LEAGUES_BY_SPORT, type Sport } from '@/lib/bot-registry'
import CreateBotModal, { type BotData } from '@/components/dashboard/CreateBotModal'

function getChatUrl(botId: string): string | null {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '')
  return base ? `${base}/chat/${botId}` : null
}

function getEmbedCode(botId: string): string | null {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '')
  return base ? `<script src="${base}/widget.js" data-bot-id="${botId}"></script>` : null
}

function getLeagueLabel(sport: string, league: string): string {
  const leagues = LEAGUES_BY_SPORT[sport as Sport] ?? []
  return leagues.find((l) => l.value === league)?.label ?? league
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function DashboardPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'empty' | 'loaded' | 'error'>('loading')
  const [bot, setBot] = useState<BotData | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedEmbed, setCopiedEmbed] = useState(false)
  const linkTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const embedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/bots/me', { signal: controller.signal })
      .then(async (res) => {
        if (res.status === 401) {
          router.push('/login')
          return
        }
        if (res.status === 404) {
          setStatus('empty')
          return
        }
        if (!res.ok) {
          setStatus('error')
          return
        }
        const data = await res.json() as BotData
        setBot(data)
        setStatus('loaded')
      })
      .catch((err: unknown) => {
        if ((err as { name?: string }).name === 'AbortError') return
        setStatus('error')
      })
    return () => controller.abort()
  }, [router])

  useEffect(() => {
    return () => {
      if (linkTimer.current) clearTimeout(linkTimer.current)
      if (embedTimer.current) clearTimeout(embedTimer.current)
    }
  }, [])

  async function handleCopyLink() {
    if (!bot) return
    const url = getChatUrl(bot.bot_id)
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      if (linkTimer.current) clearTimeout(linkTimer.current)
      setCopiedLink(true)
      linkTimer.current = setTimeout(() => setCopiedLink(false), 2000)
    } catch {
      // clipboard not available (e.g. non-https)
    }
  }

  async function handleCopyEmbed() {
    if (!bot) return
    const code = getEmbedCode(bot.bot_id)
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      if (embedTimer.current) clearTimeout(embedTimer.current)
      setCopiedEmbed(true)
      embedTimer.current = setTimeout(() => setCopiedEmbed(false), 2000)
    } catch {
      // clipboard not available
    }
  }

  function handleBotCreated(newBot: BotData) {
    setBot(newBot)
    setStatus('loaded')
    setModalOpen(false)
  }

  const copyBtnClass =
    'px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'

  return (
    <>
      <div className="p-6 md:p-8 max-w-2xl">
        <h1 className="text-xl font-semibold text-gray-900 mb-6">Overview</h1>

        {status === 'loading' && (
          <p className="text-sm text-gray-500">Loading...</p>
        )}

        {status === 'error' && (
          <p className="text-sm text-red-600">Failed to load. Please refresh.</p>
        )}

        {status === 'empty' && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg
              className="w-12 h-12 text-gray-300"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
              />
            </svg>
            <h2 className="mt-4 text-lg font-semibold text-gray-900">No chatbot yet</h2>
            <p className="mt-1 text-sm text-gray-500">Create your chatbot in 3 quick steps.</p>
            <button
              onClick={() => setModalOpen(true)}
              className="mt-6 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Create your chatbot
            </button>
          </div>
        )}

        {status === 'loaded' && bot && (() => {
          const chatUrl = getChatUrl(bot.bot_id)
          const embedCode = getEmbedCode(bot.bot_id)
          return (
            <div className="space-y-4">
              {/* Bot info card */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="text-sm font-medium text-gray-500 mb-3">Your chatbot</h2>
                <dl className="space-y-2">
                  {[
                    { label: 'Name', value: bot.bot_name },
                    { label: 'Sport', value: SPORT_LABELS[bot.sport as Sport] ?? bot.sport },
                    { label: 'League', value: getLeagueLabel(bot.sport, bot.league) },
                    { label: 'Created', value: formatDate(bot.created_at) },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">{label}</dt>
                      <dd className="text-sm text-gray-900">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Shareable link card */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="text-sm font-medium text-gray-500 mb-1">Shareable link</h2>
                <p className="text-xs text-gray-400 mb-3">Share with fans to give them direct access.</p>
                {chatUrl ? (
                  <>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 font-mono truncate">
                        {chatUrl}
                      </div>
                      <button onClick={() => void handleCopyLink()} className={copyBtnClass}>
                        {copiedLink ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <a
                      href={chatUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-sm text-blue-600 hover:underline"
                    >
                      Preview chatbot ↗
                    </a>
                  </>
                ) : (
                  <p className="text-sm text-amber-600">
                    App URL not configured. Set <code className="font-mono">NEXT_PUBLIC_APP_URL</code> to generate a shareable link.
                  </p>
                )}
              </div>

              {/* Embed widget card */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="text-sm font-medium text-gray-500 mb-1">Embed on your website</h2>
                <p className="text-xs text-gray-400 mb-3">
                  Paste this script tag before{' '}
                  <code className="font-mono">&lt;/body&gt;</code> on your site.
                </p>
                {embedCode ? (
                  <div className="flex gap-2 items-start">
                    <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 font-mono break-all">
                      {embedCode}
                    </div>
                    <button onClick={() => void handleCopyEmbed()} className={copyBtnClass}>
                      {copiedEmbed ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-amber-600">
                    App URL not configured. Set <code className="font-mono">NEXT_PUBLIC_APP_URL</code> to generate embed code.
                  </p>
                )}
              </div>
            </div>
          )
        })()}
      </div>

      <CreateBotModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleBotCreated}
      />
    </>
  )
}
