'use client'

import { useEffect, useState } from 'react'
import { SUPPORTED_SPORTS, SPORT_LABELS, LEAGUES_BY_SPORT, type Sport } from '@/lib/bot-registry'

export interface BotData {
  bot_id: string
  bot_name: string
  sport: string
  league: string
  created_at: string
}

interface CreateBotModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (bot: BotData) => void
}

type Step = 1 | 2 | 3

const STEP_LABELS: Record<Step, string> = { 1: 'Name', 2: 'Sport', 3: 'League' }

export default function CreateBotModal({ isOpen, onClose, onSuccess }: CreateBotModalProps) {
  const [step, setStep] = useState<Step>(1)
  const [botName, setBotName] = useState('')
  const [sport, setSport] = useState<Sport>(SUPPORTED_SPORTS[0])
  const [league, setLeague] = useState(LEAGUES_BY_SPORT[SUPPORTED_SPORTS[0]][0].value)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setBotName('')
      setSport(SUPPORTED_SPORTS[0])
      setLeague(LEAGUES_BY_SPORT[SUPPORTED_SPORTS[0]][0].value)
      setError('')
      setLoading(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  function handleSportChange(newSport: Sport) {
    setSport(newSport)
    setLeague(LEAGUES_BY_SPORT[newSport][0].value)
  }

  function handleNext(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (step === 1) {
      if (!botName.trim()) {
        setError('Bot name is required')
        return
      }
      setStep(2)
    } else if (step === 2) {
      setStep(3)
    }
  }

  function handleBack() {
    setError('')
    setStep((s) => (Math.max(1, s - 1) as Step))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/bots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bot_name: botName.trim(), sport, league }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setError(data.error ?? 'Something went wrong')
        return
      }
      const botRes = await fetch('/api/bots/me')
      const botData = await botRes.json() as BotData
      onSuccess(botData)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500'
  const btnPrimary =
    'flex-1 py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
  const btnSecondary =
    'flex-1 py-2 px-4 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative w-full max-w-md bg-white rounded-xl shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
            Create your chatbot
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center mb-6">
          {([1, 2, 3] as Step[]).map((s, i) => {
            const isActive = step === s
            const isDone = step > s
            return (
              <div key={s} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                      isActive || isDone ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {isDone ? '✓' : s}
                  </div>
                  <span className="mt-1 text-xs text-gray-500">{STEP_LABELS[s]}</span>
                </div>
                {i < 2 && (
                  <div
                    className={`h-px w-10 mx-2 mb-4 transition-colors ${
                      step > s ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Step 1: Name */}
        {step === 1 && (
          <form onSubmit={handleNext} className="space-y-4">
            <div>
              <label htmlFor="modal-bot-name" className="block text-sm font-medium text-gray-700 mb-1">
                Bot name
              </label>
              <input
                id="modal-bot-name"
                type="text"
                value={botName}
                onChange={(e) => setBotName(e.target.value)}
                placeholder="e.g. City FC Bot"
                maxLength={100}
                className={inputClass}
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" className={btnPrimary.replace('flex-1 ', '')}>
              Next →
            </button>
          </form>
        )}

        {/* Step 2: Sport */}
        {step === 2 && (
          <form onSubmit={handleNext} className="space-y-4">
            <div>
              <label htmlFor="modal-sport" className="block text-sm font-medium text-gray-700 mb-1">
                Sport
              </label>
              <select
                id="modal-sport"
                value={sport}
                onChange={(e) => handleSportChange(e.target.value as Sport)}
                className={inputClass}
              >
                {SUPPORTED_SPORTS.map((s) => (
                  <option key={s} value={s}>
                    {SPORT_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <button type="button" onClick={handleBack} className={btnSecondary}>
                ← Back
              </button>
              <button type="submit" className={btnPrimary}>
                Next →
              </button>
            </div>
          </form>
        )}

        {/* Step 3: League */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="modal-league" className="block text-sm font-medium text-gray-700 mb-1">
                League
              </label>
              <select
                id="modal-league"
                value={league}
                onChange={(e) => setLeague(e.target.value)}
                disabled={loading}
                className={`${inputClass} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {LEAGUES_BY_SPORT[sport].map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className={btnSecondary}
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className={btnPrimary}
              >
                {loading ? 'Setting up...' : 'Set up my bot'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
