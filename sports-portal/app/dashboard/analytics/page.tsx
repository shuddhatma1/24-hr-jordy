'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

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
        <div className="h-6 bg-gray-200 rounded w-32 mb-6 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-48 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="p-6 md:p-8">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Analytics</h1>
        <p className="text-sm text-red-600">Failed to load analytics. Please refresh.</p>
      </div>
    )
  }

  if (noBotFound) {
    return (
      <div className="p-6 md:p-8">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Analytics</h1>
        <p className="text-sm text-gray-500">
          You need to{' '}
          <Link href="/dashboard" className="text-blue-600 underline">
            create your bot first
          </Link>{' '}
          before viewing analytics.
        </p>
      </div>
    )
  }

  const isEmpty = data && data.total_messages === 0

  const maxDaily = data
    ? Math.max(...data.daily_messages.map((d) => d.count), 1)
    : 1

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 mb-1">Analytics</h1>
          <p className="text-sm text-gray-500">See how fans are using your chatbot.</p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {PERIODS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setPeriod(value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                period === value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">Conversations</p>
          <p className="text-2xl font-bold text-gray-900">{data?.total_conversations ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">Messages</p>
          <p className="text-2xl font-bold text-gray-900">{data?.total_messages ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">Avg messages / conversation</p>
          <p className="text-2xl font-bold text-gray-900">
            {data?.avg_messages_per_conversation ?? 0}
          </p>
        </div>
      </div>

      {/* Chart or empty state */}
      {isEmpty ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-500 text-sm mb-3">
            No chat activity yet. Share your bot link to start seeing analytics.
          </p>
          <Link
            href="/dashboard"
            className="text-sm text-blue-600 hover:underline font-medium"
          >
            Go to Overview
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Daily messages</h2>
          <div className="flex items-end gap-1 h-40">
            {data?.daily_messages.map((entry) => {
              const heightPct = Math.max((entry.count / maxDaily) * 100, 4)
              return (
                <div
                  key={entry.date}
                  className="flex-1 flex flex-col items-center justify-end gap-1 min-w-0"
                >
                  <span className="text-xs text-gray-500 font-medium">{entry.count}</span>
                  <div
                    className="w-full bg-blue-500 rounded-t-sm min-w-[4px]"
                    style={{ height: `${heightPct}%` }}
                    title={`${entry.date}: ${entry.count} messages`}
                  />
                  <span className="text-[10px] text-gray-400 truncate w-full text-center">
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
