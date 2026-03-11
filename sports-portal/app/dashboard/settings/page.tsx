'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  SUPPORTED_SPORTS,
  type Sport,
  SPORT_LABELS,
  LEAGUES_BY_SPORT,
} from '@/lib/bot-registry'
import DeleteBotModal from '@/components/dashboard/DeleteBotModal'
import { AlertTriangle } from 'lucide-react'

type PageStatus = 'loading' | 'noBotFound' | 'fetchError' | 'loaded'
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export default function SettingsPage() {
  const router = useRouter()

  const [status, setStatus] = useState<PageStatus>('loading')
  const [botName, setBotName] = useState('')
  const [sport, setSport] = useState<Sport>(SUPPORTED_SPORTS[0])
  const [league, setLeague] = useState(LEAGUES_BY_SPORT[SUPPORTED_SPORTS[0]][0].value)

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Fetch bot data on mount
  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/bots/me', { signal: controller.signal })
      .then(async (res) => {
        if (res.status === 404) {
          setStatus('noBotFound')
          return
        }
        if (!res.ok) {
          setStatus('fetchError')
          return
        }
        const data = await res.json()
        setBotName(data.bot_name ?? '')

        // Defensive: validate sport against known values
        const fetchedSport = SUPPORTED_SPORTS.includes(data.sport as Sport)
          ? (data.sport as Sport)
          : SUPPORTED_SPORTS[0]
        setSport(fetchedSport)

        // Defensive: validate league against sport's leagues
        const validLeagues = LEAGUES_BY_SPORT[fetchedSport]
        const fetchedLeague = validLeagues.some((l) => l.value === data.league)
          ? data.league
          : validLeagues[0].value
        setLeague(fetchedLeague)

        setStatus('loaded')
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setStatus('fetchError')
      })
    return () => controller.abort()
  }, [])

  // Cleanup save timer
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

  function handleSportChange(newSport: Sport) {
    setSport(newSport)
    setLeague(LEAGUES_BY_SPORT[newSport][0].value)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (saveStatus === 'saving') return
    setSaveStatus('saving')
    setErrorMsg('')

    try {
      const res = await fetch('/api/bots/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bot_name: botName,
          sport,
          league,
        }),
      })

      if (res.ok) {
        setSaveStatus('saved')
        if (saveTimer.current) clearTimeout(saveTimer.current)
        saveTimer.current = setTimeout(() => setSaveStatus('idle'), 3000)
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setErrorMsg(data.error ?? 'Failed to save. Please try again.')
        setSaveStatus('error')
      }
    } catch {
      setErrorMsg('Network error. Please try again.')
      setSaveStatus('error')
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    setDeleteError('')
    try {
      const res = await fetch('/api/bots/me', { method: 'DELETE' })
      if (res.ok) {
        router.push('/dashboard')
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setDeleteError(data.error ?? 'Failed to delete. Please try again.')
      }
    } catch {
      setDeleteError('Network error. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  // --- Render states ---

  if (status === 'loading') {
    return (
      <div className="p-6 md:p-8 max-w-2xl">
        <div className="h-7 w-32 bg-neutral-200 rounded animate-pulse mb-2" />
        <div className="h-4 w-56 bg-neutral-200 rounded animate-pulse mb-8" />
        <div className="space-y-4">
          <div className="h-10 bg-neutral-200 rounded animate-pulse" />
          <div className="h-10 bg-neutral-200 rounded animate-pulse" />
          <div className="h-10 w-36 bg-neutral-200 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  if (status === 'noBotFound') {
    return (
      <div className="p-6 md:p-8 max-w-2xl">
        <h1 className="text-xl font-semibold text-neutral-900 mb-1">Settings</h1>
        <p className="text-sm text-neutral-500 mt-4">
          You need to create a chatbot first.{' '}
          <Link href="/dashboard" className="text-brand-600 hover:underline">
            Go to dashboard
          </Link>
        </p>
      </div>
    )
  }

  if (status === 'fetchError') {
    return (
      <div className="p-6 md:p-8 max-w-2xl">
        <h1 className="text-xl font-semibold text-neutral-900 mb-1">Settings</h1>
        <p className="text-sm text-red-600 mt-4">
          Failed to load settings. Please refresh the page.
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <h1 className="text-xl font-semibold text-neutral-900 mb-1">Settings</h1>
      <p className="text-sm text-neutral-500 mb-8">
        Manage your chatbot configuration.
      </p>

      {/* Sport & League */}
      <form onSubmit={handleSave}>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="sport-select"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Sport
            </label>
            <select
              id="sport-select"
              value={sport}
              onChange={(e) => handleSportChange(e.target.value as Sport)}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              {SUPPORTED_SPORTS.map((s) => (
                <option key={s} value={s}>
                  {SPORT_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="league-select"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              League
            </label>
            <select
              id="league-select"
              value={league}
              onChange={(e) => setLeague(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              {LEAGUES_BY_SPORT[sport].map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="submit"
            disabled={saveStatus === 'saving'}
            className="rounded-xl gradient-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            {saveStatus === 'saving' ? 'Saving...' : 'Save changes'}
          </button>
          {saveStatus === 'saved' && (
            <p className="text-sm text-green-600 font-medium">Changes saved</p>
          )}
          {saveStatus === 'error' && (
            <p className="text-sm text-red-600">{errorMsg}</p>
          )}
        </div>
      </form>

      {/* Danger Zone */}
      <section className="mt-10 bg-red-50 border border-red-200 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h2 className="text-base font-semibold text-red-700">
            Danger Zone
          </h2>
        </div>
        <p className="text-sm text-neutral-600 mb-4">
          Permanently delete your chatbot and all associated knowledge
          entries.
        </p>
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="rounded-xl border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Delete my chatbot
        </button>
      </section>

      <DeleteBotModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false)
          setDeleteError('')
        }}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
        error={deleteError}
      />
    </div>
  )
}
