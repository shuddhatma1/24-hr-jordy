'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SPORT_LABELS, LEAGUES_BY_SPORT, type Sport } from '@/lib/bot-registry'
import CreateBotModal, { type BotData as BaseBotData } from '@/components/dashboard/CreateBotModal'

type BotData = BaseBotData & { primary_color?: string | null }
import { Copy, Check, ExternalLink, Link2, Code, Bot } from 'lucide-react'

function getChatUrl(botId: string): string | null {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '')
  return base ? `${base}/chat/${botId}` : null
}

function getEmbedCode(botId: string, primaryColor?: string | null): string | null {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '')
  if (!base) return null
  const colorAttr = primaryColor ? ` data-color="${primaryColor}"` : ''
  return `<script src="${base}/widget.js" data-bot-id="${botId}"${colorAttr}></script>`
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
    const code = getEmbedCode(bot.bot_id, bot.primary_color)
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

  return (
    <>
      <div className="p-6 md:p-8 max-w-2xl">
        {status === 'loading' && (
          <div className="space-y-4">
            <div className="h-24 rounded-2xl skeleton" />
            <div className="h-40 rounded-2xl skeleton" />
            <div className="h-40 rounded-2xl skeleton" />
          </div>
        )}

        {status === 'error' && (
          <p className="text-sm text-red-600">Failed to load. Please refresh.</p>
        )}

        {status === 'empty' && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-neutral-400" />
            </div>
            <h2 className="text-lg font-semibold text-neutral-900">No chatbot yet</h2>
            <p className="mt-1 text-sm text-neutral-500">Create your chatbot in 3 quick steps.</p>
            <button
              onClick={() => setModalOpen(true)}
              className="mt-6 px-5 py-2.5 gradient-primary text-white text-sm font-medium rounded-xl shadow-glow hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-opacity"
            >
              Create your chatbot
            </button>
          </div>
        )}

        {status === 'loaded' && bot && (() => {
          const chatUrl = getChatUrl(bot.bot_id)
          const embedCode = getEmbedCode(bot.bot_id, bot.primary_color)
          return (
            <div className="space-y-6">
              {/* Welcome hero banner */}
              <div className="rounded-2xl gradient-primary p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-sm font-medium text-white/80">Your bot is live</span>
                </div>
                <h1 className="text-xl font-bold">Welcome back!</h1>
                <p className="text-sm text-white/80 mt-1">{bot.bot_name} is ready to chat with your fans.</p>
              </div>

              {/* Bot info card */}
              <div className="bg-white rounded-2xl shadow-card p-6">
                <h2 className="text-sm font-medium text-neutral-500 mb-3">Your chatbot</h2>
                <dl className="space-y-2">
                  {[
                    { label: 'Name', value: bot.bot_name },
                    { label: 'Sport', value: SPORT_LABELS[bot.sport as Sport] ?? bot.sport },
                    { label: 'League', value: getLeagueLabel(bot.sport, bot.league) },
                    { label: 'Created', value: formatDate(bot.created_at) },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between">
                      <dt className="text-sm font-medium text-neutral-500">{label}</dt>
                      <dd className="text-sm text-neutral-900">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Shareable link card */}
              <div className="bg-white rounded-2xl shadow-card p-6">
                <div className="flex items-center gap-2 mb-1">
                  <Link2 className="w-4 h-4 text-brand-500" />
                  <h2 className="text-sm font-medium text-neutral-900">Shareable link</h2>
                </div>
                <p className="text-xs text-neutral-400 mb-3">Share with fans to give them direct access.</p>
                {chatUrl ? (
                  <>
                    <div className="relative">
                      <div className="bg-neutral-50 rounded-xl px-4 py-3 pr-20 text-sm text-neutral-800 font-mono truncate">
                        {chatUrl}
                      </div>
                      <button
                        onClick={() => void handleCopyLink()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg gradient-primary text-white text-xs font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-opacity"
                      >
                        {copiedLink ? (
                          <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Copied</span>
                        ) : (
                          <span className="flex items-center gap-1"><Copy className="w-3 h-3" /> Copy</span>
                        )}
                      </button>
                    </div>
                    <a
                      href={chatUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"
                    >
                      Preview chatbot <ExternalLink className="w-3 h-3" />
                    </a>
                  </>
                ) : (
                  <p className="text-sm text-amber-600">
                    App URL not configured. Set <code className="font-mono">NEXT_PUBLIC_APP_URL</code> to generate a shareable link.
                  </p>
                )}
              </div>

              {/* Embed widget card */}
              <div className="bg-white rounded-2xl shadow-card p-6">
                <div className="flex items-center gap-2 mb-1">
                  <Code className="w-4 h-4 text-brand-500" />
                  <h2 className="text-sm font-medium text-neutral-900">Embed on your website</h2>
                </div>
                <p className="text-xs text-neutral-400 mb-3">
                  Paste this script tag before{' '}
                  <code className="font-mono">&lt;/body&gt;</code> on your site.
                </p>
                {embedCode ? (
                  <div className="relative">
                    <div className="bg-neutral-900 rounded-xl px-4 py-3 pr-20 text-sm text-green-400 font-mono break-all">
                      {embedCode}
                    </div>
                    <button
                      onClick={() => void handleCopyEmbed()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-neutral-700 text-neutral-200 text-xs font-medium hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
                    >
                      {copiedEmbed ? (
                        <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Copied</span>
                      ) : (
                        <span className="flex items-center gap-1"><Copy className="w-3 h-3" /> Copy</span>
                      )}
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
