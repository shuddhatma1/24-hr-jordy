'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type Persona = 'friendly' | 'professional' | 'enthusiastic'

const PERSONAS: { value: Persona; label: string; description: string }[] = [
  { value: 'friendly', label: 'Friendly', description: 'Warm and approachable tone' },
  { value: 'professional', label: 'Professional', description: 'Precise and business-like tone' },
  { value: 'enthusiastic', label: 'Enthusiastic', description: 'Energetic and upbeat tone' },
]

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export default function CustomizePage() {
  const [loading, setLoading] = useState(true)
  const [noBotFound, setNoBotFound] = useState(false)

  const [botName, setBotName] = useState('')
  const [welcomeMessage, setWelcomeMessage] = useState('')
  const [persona, setPersona] = useState<Persona | ''>('')
  const [primaryColor, setPrimaryColor] = useState('#3B82F6')

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/bots/me', { signal: controller.signal })
      .then((res) => {
        if (res.status === 404) {
          setNoBotFound(true)
          setLoading(false)
          return null
        }
        return res.json()
      })
      .then((data) => {
        if (!data) return
        setBotName(data.bot_name ?? '')
        setWelcomeMessage(data.welcome_message ?? '')
        setPersona(data.persona ?? '')
        setPrimaryColor(data.primary_color ?? '#3B82F6')
        setLoading(false)
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
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
        <div className="h-6 bg-gray-200 rounded w-32 mb-6 animate-pulse" />
        <div className="space-y-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (noBotFound) {
    return (
      <div className="p-6 md:p-8">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Customize</h1>
        <p className="text-sm text-gray-500">
          You need to{' '}
          <Link href="/dashboard" className="text-blue-600 underline">
            create your bot first
          </Link>{' '}
          before customizing it.
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Customize</h1>
      <p className="text-sm text-gray-500 mb-6">
        Personalize how your chatbot looks and sounds to fans.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Bot name */}
        <div>
          <label htmlFor="bot-name" className="block text-sm font-medium text-gray-700 mb-1">
            Bot name
          </label>
          <input
            id="bot-name"
            type="text"
            value={botName}
            onChange={(e) => setBotName(e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. City FC Bot"
          />
        </div>

        {/* Welcome message */}
        <div>
          <label
            htmlFor="welcome-message"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Welcome message{' '}
            <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <textarea
            id="welcome-message"
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            maxLength={300}
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Hi! Ask me anything about the league."
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{welcomeMessage.length}/300</p>
        </div>

        {/* Persona */}
        <div>
          <span className="block text-sm font-medium text-gray-700 mb-2">
            Persona <span className="font-normal text-gray-400">(optional)</span>
          </span>
          <div className="grid grid-cols-3 gap-3">
            {PERSONAS.map(({ value, label, description }) => {
              const selected = persona === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPersona(selected ? '' : value)}
                  className={`rounded-lg border px-3 py-3 text-left transition-colors ${
                    selected
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Brand color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Brand color <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded border border-gray-300 p-0.5"
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
              className="w-32 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="#3B82F6"
            />
            <div
              className="h-10 w-10 rounded-md border border-gray-200 flex-shrink-0"
              style={{ backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(primaryColor) ? primaryColor : undefined }}
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={saveStatus === 'saving'}
            className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {saveStatus === 'saving' ? 'Saving…' : 'Save changes'}
          </button>

          {saveStatus === 'saved' && (
            <p className="text-sm text-green-600 font-medium">Changes saved</p>
          )}
          {saveStatus === 'error' && (
            <p className="text-sm text-red-600">{errorMsg}</p>
          )}
        </div>
      </form>
    </div>
  )
}
