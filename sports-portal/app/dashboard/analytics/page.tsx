'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MessageSquare, Users, TrendingUp } from 'lucide-react'

type Period = '7d' | '30d' | 'all'

interface DailyEntry {
  date: string
  count: number
}

interface AnalyticsData {
  total_conversations: number
  total_messages: number
  avg_messages_per_conversation: number
  daily_messages: DailyEntry[]
  daily_conversations: DailyEntry[]
  period: string
}

const PERIODS: { value: Period; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: 'all', label: 'All time' },
]

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [noBotFound, setNoBotFound] = useState(false)
  const [fetchError, setFetchError] = useState(false)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [period, setPeriod] = useState<Period>('7d')

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setFetchError(false)

    fetch(`/api/analytics?period=${period}`, { signal: controller.signal })
      .then(async (res) => {
        if (res.status === 404) {
          setNoBotFound(true)
          setLoading(false)
          return
        }
        if (!res.ok) {
          setFetchError(true)
          setLoading(false)
          return
        }
        const json = await res.json()
        setData(json)
        setLoading(false)
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setFetchError(true)
        setLoading(false)
      })
    return () => controller.abort()
  }, [period])

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-4xl">
        <div className="h-6 bg-neutral-200 rounded w-32 mb-6 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-neutral-200 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-48 bg-neutral-200 rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="p-6 md:p-8">
        <h1 className="text-xl font-semibold text-neutral-900 mb-1">Analytics</h1>
        <p className="text-sm text-red-600">Failed to load analytics. Please refresh.</p>
      </div>
    )
  }

  if (noBotFound) {
    return (
      <div className="p-6 md:p-8">
        <h1 className="text-xl font-semibold text-neutral-900 mb-1">Analytics</h1>
        <p className="text-sm text-neutral-500">
          You need to{' '}
          <Link href="/dashboard" className="text-brand-600 underline">
            create your bot first
          </Link>{' '}
          before viewing analytics.
        </p>
      </div>
    )
  }

  const isEmpty = data && data.total_messages === 0 && data.total_conversations === 0

  // Cap to last 14 entries for readability; use reduce to avoid call-stack overflow on large arrays
  const chartEntries = data
    ? data.daily_messages.slice(-14)
    : []
  const maxDaily = chartEntries.reduce((m, d) => Math.max(m, d.count), 1)

  const statCards = [
    {
      label: 'Conversations',
      value: data?.total_conversations ?? 0,
      icon: Users,
      color: 'bg-brand-50 text-brand-600',
    },
    {
      label: 'Messages',
      value: data?.total_messages ?? 0,
      icon: MessageSquare,
      color: 'bg-accent-50 text-accent-600',
    },
    {
      label: 'Avg messages / conversation',
      value: data?.avg_messages_per_conversation ?? 0,
      icon: TrendingUp,
      color: 'bg-green-50 text-green-600',
    },
  ]

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 mb-1">Analytics</h1>
          <p className="text-sm text-neutral-500">See how fans are using your chatbot.</p>
        </div>
        <div className="flex gap-1 bg-neutral-100 rounded-xl p-1">
          {PERIODS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setPeriod(value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                period === value
                  ? 'bg-white text-neutral-900 shadow-soft'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl shadow-card p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-sm text-neutral-500 mb-1">{label}</p>
            <p className="text-2xl font-bold text-neutral-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Chart or empty state */}
      {isEmpty ? (
        <div className="bg-white rounded-2xl shadow-card p-8 text-center">
          <p className="text-neutral-500 text-sm mb-3">
            No chat activity yet. Share your bot link to start seeing analytics.
          </p>
          <Link
            href="/dashboard"
            className="text-sm text-brand-600 hover:underline font-medium"
          >
            Go to Overview
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card p-5">
          <h2 className="text-sm font-medium text-neutral-700 mb-4">Daily messages</h2>
          <div className="flex items-end gap-1 h-40">
            {chartEntries.map((entry) => {
              const heightPct = Math.max((entry.count / maxDaily) * 100, 4)
              return (
                <div
                  key={entry.date}
                  className="flex-1 flex flex-col items-center justify-end gap-1 min-w-0 group relative"
                >
                  <div className="hidden group-hover:block absolute -top-8 bg-neutral-900 text-white text-xs px-2 py-1 rounded z-10 whitespace-nowrap">
                    {entry.date}: {entry.count}
                  </div>
                  <span className="text-xs text-neutral-500 font-medium">{entry.count}</span>
                  <div
                    className="w-full rounded-t-lg min-w-[4px]"
                    style={{
                      height: `${heightPct}%`,
                      background: 'linear-gradient(to top, #6366f1, #a855f7)',
                    }}
                    title={`${entry.date}: ${entry.count} messages`}
                  />
                  <span className="text-[10px] text-neutral-400 truncate w-full text-center">
                    {entry.date.slice(5)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
