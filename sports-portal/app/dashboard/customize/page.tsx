'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ChatPreview from '@/components/dashboard/ChatPreview'

type Persona = 'friendly' | 'professional' | 'enthusiastic'

const PERSONAS: { value: Persona; label: string; description: string; emoji: string }[] = [
  { value: 'friendly', label: 'Friendly', description: 'Warm and approachable tone', emoji: '\uD83D\uDE0A' },
  { value: 'professional', label: 'Professional', description: 'Precise and business-like tone', emoji: '\uD83D\uDCBC' },
  { value: 'enthusiastic', label: 'Enthusiastic', description: 'Energetic and upbeat tone', emoji: '\uD83D\uDE80' },
]

const COLOR_SWATCHES = ['#6366f1', '#dc2626', '#16a34a', '#2563eb', '#ea580c', '#7c3aed', '#ca8a04', '#0d9488']

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export default function CustomizePage() {
  const [loading, setLoading] = useState(true)
  const [noBotFound, setNoBotFound] = useState(false)
  const [fetchError, setFetchError] = useState(false)

  const [botName, setBotName] = useState('')
  const [welcomeMessage, setWelcomeMessage] = useState('')
  const [persona, setPersona] = useState<Persona | ''>('')
  const [primaryColor, setPrimaryColor] = useState('#3B82F6')

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/bots/me', { signal: controller.signal })
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
        const data = await res.json()
        setBotName(data.bot_name ?? '')
        setWelcomeMessage(data.welcome_message ?? '')
        setPersona(data.persona ?? '')
        setPrimaryColor(data.primary_color ?? '#3B82F6')
        setLoading(false)
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setFetchError(true)
        setLoading(false)
      })
    return () => controller.abort()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaveStatus('saving')
    setErrorMsg('')

    const res = await fetch('/api/bots/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bot_name: botName,
        welcome_message: welcomeMessage || null,
        persona: persona || null,
        primary_color: primaryColor || null,
      }),
    })

    if (res.ok) {
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } else {
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      setErrorMsg(data.error ?? 'Failed to save. Please try again.')
      setSaveStatus('error')
    }
  }

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-2xl">
        <div className="h-6 bg-neutral-200 rounded w-32 mb-6 animate-pulse" />
        <div className="space-y-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-neutral-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="p-6 md:p-8">
        <h1 className="text-xl font-semibold text-neutral-900 mb-1">Customize</h1>
        <p className="text-sm text-red-600">Failed to load bot data. Please refresh.</p>
      </div>
    )
  }

  if (noBotFound) {
    return (
      <div className="p-6 md:p-8">
        <h1 className="text-xl font-semibold text-neutral-900 mb-1">Customize</h1>
        <p className="text-sm text-neutral-500">
          You need to{' '}
          <Link href="/dashboard" className="text-brand-600 underline">
            create your bot first
          </Link>{' '}
          before customizing it.
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-xl font-semibold text-neutral-900 mb-1">Customize</h1>
      <p className="text-sm text-neutral-500 mb-6">
        Personalize how your chatbot looks and sounds to fans.
      </p>

      <div className="flex flex-col lg:flex-row gap-8">
        <form onSubmit={handleSubmit} className="flex-1 max-w-lg space-y-6">
          {/* Bot name */}
          <div>
            <label htmlFor="bot-name" className="block text-sm font-medium text-neutral-700 mb-1">
              Bot name
            </label>
            <input
              id="bot-name"
              type="text"
              value={botName}
              onChange={(e) => setBotName(e.target.value)}
              required
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="e.g. City FC Bot"
            />
          </div>

          {/* Welcome message */}
          <div>
            <label
              htmlFor="welcome-message"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Welcome message{' '}
              <span className="font-normal text-neutral-400">(optional)</span>
            </label>
            <textarea
              id="welcome-message"
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              maxLength={300}
              rows={3}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              placeholder="Hi! Ask me anything about the league."
            />
            <p className="text-xs text-neutral-400 mt-1 text-right">{welcomeMessage.length}/300</p>
          </div>

          {/* Persona */}
          <div>
            <span className="block text-sm font-medium text-neutral-700 mb-2">
              Persona <span className="font-normal text-neutral-400">(optional)</span>
            </span>
            <div className="grid grid-cols-3 gap-3">
              {PERSONAS.map(({ value, label, description, emoji }) => {
                const selected = persona === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPersona(selected ? '' : value)}
                    className={`rounded-xl border-2 px-3 py-3 text-left transition-all ${
                      selected
                        ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-glow'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                    }`}
                  >
                    <p className="text-lg mb-1">{emoji}</p>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Brand color */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Brand color <span className="font-normal text-neutral-400">(optional)</span>
            </label>
            {/* Color swatches */}
            <div className="flex gap-2 mb-3 flex-wrap">
              {COLOR_SWATCHES.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  onClick={() => setPrimaryColor(swatch)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    primaryColor === swatch
                      ? 'border-neutral-900 scale-110 shadow-glow'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: swatch }}
                  aria-label={`Select color ${swatch}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-14 cursor-pointer rounded-lg border border-neutral-300 p-0.5"
                aria-label="Pick a color"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => {
                  const val = e.target.value
                  setPrimaryColor(val)
                }}
                pattern="^#[0-9A-Fa-f]{6}$"
                className="w-32 rounded-xl border border-neutral-300 px-3 py-2 text-sm text-neutral-900 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="#3B82F6"
              />
              <div
                className="h-10 w-10 rounded-lg border border-neutral-200 flex-shrink-0"
                style={{ backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(primaryColor) ? primaryColor : undefined }}
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Sticky save bar */}
          <div className="sticky bottom-0 bg-white/80 backdrop-blur-sm border-t border-neutral-200 px-6 py-4 -mx-6 flex items-center gap-4">
            <button
              type="submit"
              disabled={saveStatus === 'saving'}
              className="gradient-primary text-white px-5 py-2 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
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

        {/* Live preview - desktop only */}
        <div className="hidden lg:block lg:w-80 lg:sticky lg:top-6 lg:self-start">
          <p className="text-xs font-medium text-neutral-500 mb-3 uppercase tracking-wide">Live Preview</p>
          <ChatPreview
            botName={botName}
            welcomeMessage={welcomeMessage}
            primaryColor={primaryColor}
            persona={persona}
          />
        </div>
      </div>
    </div>
  )
}
