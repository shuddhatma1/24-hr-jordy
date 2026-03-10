// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CustomizePage from '../page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

function mockFetch(status: number, body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
    })
  )
}

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

const mockBot = {
  bot_id: 'abc123def456abc123def456',
  bot_name: 'City FC Bot',
  welcome_message: 'Welcome to City FC!',
  persona: 'friendly',
  primary_color: '#3B82F6',
}

describe('CustomizePage', () => {
  it('shows loading skeleton initially', () => {
    mockFetch(200, mockBot)
    render(<CustomizePage />)
    // skeleton pulses are present while loading
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('pre-populates form fields from GET /api/bots/me on 200', async () => {
    mockFetch(200, mockBot)
    render(<CustomizePage />)
    await waitFor(() => expect(screen.getByDisplayValue('City FC Bot')).toBeInTheDocument())
    expect(screen.getByDisplayValue('Welcome to City FC!')).toBeInTheDocument()
  })

  it('shows no-bot state when API returns 404', async () => {
    mockFetch(404, { error: 'No bot found' })
    render(<CustomizePage />)
    await waitFor(() => expect(screen.getByText(/create your bot first/i)).toBeInTheDocument())
  })

  it('shows error state when API returns 500', async () => {
    mockFetch(500, { error: 'Internal server error' })
    render(<CustomizePage />)
    await waitFor(() =>
      expect(screen.getByText(/failed to load bot data/i)).toBeInTheDocument()
    )
  })

  it('shows "Changes saved" feedback on successful PUT', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockBot),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ ...mockBot, bot_name: 'Updated Bot' }),
        })
    )
    render(<CustomizePage />)
    await waitFor(() => expect(screen.getByDisplayValue('City FC Bot')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))
    await waitFor(() => expect(screen.getByText('Changes saved')).toBeInTheDocument())
  })

  it('shows server error message on failed PUT', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockBot),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: 'Internal server error' }),
        })
    )
    render(<CustomizePage />)
    await waitFor(() => expect(screen.getByDisplayValue('City FC Bot')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))
    await waitFor(() => expect(screen.getByText('Internal server error')).toBeInTheDocument())
  })

  it('toggles persona selection — clicking selected persona deselects it', async () => {
    mockFetch(200, mockBot)
    render(<CustomizePage />)
    await waitFor(() => expect(screen.getByDisplayValue('City FC Bot')).toBeInTheDocument())

    const friendlyBtn = screen.getByRole('button', { name: /friendly/i })
    // starts selected (from mockBot.persona = 'friendly')
    expect(friendlyBtn).toHaveClass('border-blue-500')
    // click to deselect
    fireEvent.click(friendlyBtn)
    expect(friendlyBtn).not.toHaveClass('border-blue-500')
  })

  it('selecting a different persona highlights only that one', async () => {
    mockFetch(200, mockBot)
    render(<CustomizePage />)
    await waitFor(() => expect(screen.getByDisplayValue('City FC Bot')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /enthusiastic/i }))
    expect(screen.getByRole('button', { name: /enthusiastic/i })).toHaveClass('border-blue-500')
    expect(screen.getByRole('button', { name: /friendly/i })).not.toHaveClass('border-blue-500')
  })
})
