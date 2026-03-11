'use client'

import { useEffect, useRef, useState } from 'react'
import { SUPPORTED_SPORTS, SPORT_LABELS, LEAGUES_BY_SPORT, type Sport } from '@/lib/bot-registry'
import { X } from 'lucide-react'

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

const SPORT_EMOJI: Record<string, string> = {
  soccer: '\u26BD',
  basketball: '\uD83C\uDFC0',
  nfl: '\uD83C\uDFC8',
  baseball: '\u26BE',
}

export default function CreateBotModal({ isOpen, onClose, onSuccess }: CreateBotModalProps) {
  const [step, setStep] = useState<Step>(1)
  const [botName, setBotName] = useState('')
  const [sport, setSport] = useState<Sport>(SUPPORTED_SPORTS[0])
  const [league, setLeague] = useState(LEAGUES_BY_SPORT[SUPPORTED_SPORTS[0]][0].value)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

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

  // Escape to close + focus trap
  useEffect(() => {
    if (!isOpen) return

    const dialog = dialogRef.current
    if (!dialog) return

    // Focus first focusable element when the modal opens or step changes
    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.hasAttribute('disabled'))

    focusable[0]?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return

      // Re-query on each keydown so the list stays current after re-renders
      const focusableNow = Array.from(
        dialog!.querySelectorAll<HTMLElement>(
          'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute('disabled'))

      if (focusableNow.length === 0) { e.preventDefault(); return }

      const first = focusableNow[0]
      const last = focusableNow[focusableNow.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, step])

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
      if (!botRes.ok) {
        const errData = await botRes.json() as { error?: string }
        setError(errData.error ?? 'Failed to load bot data. Please refresh.')
        return
      }
      const botData = await botRes.json() as BotData
      onSuccess(botData)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500'
  const btnPrimary =
    'flex-1 py-2 px-4 gradient-primary text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2'
  const btnSecondary =
    'flex-1 py-2 px-4 bg-white text-neutral-700 text-sm font-medium rounded-lg border border-neutral-300 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-neutral-950/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative w-full max-w-md bg-white rounded-2xl shadow-card p-6 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 id="modal-title" className="text-lg font-semibold text-neutral-900">
            Create your chatbot
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator - progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-neutral-500 mb-2">
            {([1, 2, 3] as Step[]).map((s) => (
              <span key={s} className={step >= s ? 'text-brand-600 font-medium' : ''}>
                {STEP_LABELS[s]}
              </span>
            ))}
          </div>
          <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className="h-full gradient-primary rounded-full transition-all duration-500"
              style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
            />
          </div>
        </div>

        {/* Step 1: Name */}
        {step === 1 && (
          <div key={1} className="animate-slide-in-right">
            <form onSubmit={handleNext} className="space-y-4">
              <div>
                <label htmlFor="modal-bot-name" className="block text-sm font-medium text-neutral-700 mb-1">
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
                Next
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Sport */}
        {step === 2 && (
          <div key={2} className="animate-slide-in-right">
            <form onSubmit={handleNext} className="space-y-4">
              <div>
                <label id="sport-label" className="block text-sm font-medium text-neutral-700 mb-2">
                  Sport
                </label>
                <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-labelledby="sport-label">
                  {SUPPORTED_SPORTS.map((s) => {
                    const selected = sport === s
                    return (
                      <button
                        key={s}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => handleSportChange(s)}
                        className={`flex flex-col items-center gap-2 rounded-xl p-4 border-2 transition-all ${
                          selected
                            ? 'border-brand-500 bg-brand-50 shadow-glow'
                            : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-soft'
                        }`}
                      >
                        <span className="text-2xl">{SPORT_EMOJI[s] ?? '\uD83C\uDFC6'}</span>
                        <span className={`text-sm font-medium ${selected ? 'text-brand-700' : 'text-neutral-700'}`}>
                          {SPORT_LABELS[s]}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={handleBack} className={btnSecondary}>
                  Back
                </button>
                <button type="submit" className={btnPrimary}>
                  Next
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: League */}
        {step === 3 && (
          <div key={3} className="animate-slide-in-right">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="modal-league" className="block text-sm font-medium text-neutral-700 mb-1">
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
                  Back
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
          </div>
        )}
      </div>
    </div>
  )
}
