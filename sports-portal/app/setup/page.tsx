'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SUPPORTED_SPORTS, SPORT_LABELS, LEAGUES_BY_SPORT, Sport } from '@/lib/bot-registry'

type Step = 1 | 2 | 3

const STEP_LABELS: Record<Step, string> = { 1: 'Name', 2: 'Sport', 3: 'League' }

export default function SetupPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [botName, setBotName] = useState('')
  const [sport, setSport] = useState<Sport>(SUPPORTED_SPORTS[0])
  const [league, setLeague] = useState(LEAGUES_BY_SPORT[SUPPORTED_SPORTS[0]][0].value)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleSportChange(newSport: Sport) {
    setSport(newSport)
    setLeague(LEAGUES_BY_SPORT[newSport][0].value)
  }

  function handleNext() {
    setError('')
    if (step === 1) {
      if (!botName.trim()) {
        setError('Bot name is required')
        return
      }
      setStep(2)
    } else if (step === 2) {
      // No validation needed: sport is constrained to SUPPORTED_SPORTS via select, initialized to SUPPORTED_SPORTS[0]
      setStep(3)
    }
  }

  function handleBack() {
    setError('')
    setStep((s) => (Math.max(1, s - 1) as Step))
  }

  async function handleSubmit() {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/bots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bot_name: botName.trim(), sport, league }),
      })
      if (res.status === 401) {
        router.push('/login')
        return
      }
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Something went wrong')
        return
      }
      router.push('/dashboard')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-8">

        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-8">
          {([1, 2, 3] as Step[]).map((s, i) => {
            const isActive = step === s
            const isDone = step > s
            return (
              <div key={s} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      isActive || isDone ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {isDone ? '✓' : s}
                  </div>
                  <span className="mt-1 text-xs text-gray-500">{STEP_LABELS[s]}</span>
                </div>
                {i < 2 && (
                  <div
                    className={`h-px w-12 mx-2 mb-5 transition-colors ${
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
          <>
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">Name your bot</h1>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleNext() }}>
              <div>
                <label htmlFor="bot_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Bot name
                </label>
                <input
                  id="bot_name"
                  type="text"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  placeholder="e.g. City FC Bot"
                  maxLength={100}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                className="w-full py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
              >
                Next →
              </button>
            </form>
          </>
        )}

        {/* Step 2: Sport */}
        {step === 2 && (
          <>
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">Pick a sport</h1>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleNext() }}>
              <div>
                <label htmlFor="sport" className="block text-sm font-medium text-gray-700 mb-1">
                  Sport
                </label>
                <select
                  id="sport"
                  value={sport}
                  onChange={(e) => handleSportChange(e.target.value as Sport)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 py-2 px-4 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                >
                  Next →
                </button>
              </div>
            </form>
          </>
        )}

        {/* Step 3: League */}
        {step === 3 && (
          <>
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">Pick a league</h1>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void handleSubmit() }}>
              <div>
                <label htmlFor="league" className="block text-sm font-medium text-gray-700 mb-1">
                  League
                </label>
                <select
                  id="league"
                  value={league}
                  onChange={(e) => setLeague(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="flex-1 py-2 px-4 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Setting up...' : 'Set up my bot'}
                </button>
              </div>
            </form>
          </>
        )}

      </div>
    </div>
  )
}
