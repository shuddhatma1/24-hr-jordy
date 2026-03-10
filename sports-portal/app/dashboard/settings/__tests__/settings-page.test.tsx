// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SettingsPage from '../page'

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

const MOCK_BOT = {
  bot_id: '507f1f77bcf86cd799439011',
  bot_name: 'Test Bot',
  sport: 'soccer',
  league: 'english-premier-league',
  created_at: '2026-01-01T00:00:00.000Z',
  welcome_message: null,
  persona: null,
  primary_color: null,
}

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

function mockFetchSequence(
  ...responses: { status: number; body: unknown }[]
) {
  const fn = vi.fn()
  for (const { status, body } of responses) {
    fn.mockResolvedValueOnce({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
    })
  }
  vi.stubGlobal('fetch', fn)
  return fn
}

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

describe('SettingsPage', () => {
  it('shows loading skeleton initially', () => {
    // Never-resolving fetch to keep loading state
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))
    render(<SettingsPage />)
    expect(document.querySelector('.animate-pulse')).not.toBeNull()
  })

  it('pre-populates sport and league on 200', async () => {
    mockFetch(200, MOCK_BOT)
    render(<SettingsPage />)

    await waitFor(() => {
      const sportSelect = screen.getByLabelText('Sport') as HTMLSelectElement
      expect(sportSelect.value).toBe('soccer')
    })
    const leagueSelect = screen.getByLabelText('League') as HTMLSelectElement
    expect(leagueSelect.value).toBe('english-premier-league')
  })

  it('shows no-bot message on 404', async () => {
    mockFetch(404, { error: 'No bot found' })
    render(<SettingsPage />)

    await waitFor(() => {
      expect(screen.getByText(/create a chatbot first/i)).toBeInTheDocument()
    })
  })

  it('shows error message on 500', async () => {
    mockFetch(500, { error: 'Internal server error' })
    render(<SettingsPage />)

    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
    })
  })

  it('shows "Changes saved" on successful save', async () => {
    mockFetchSequence(
      { status: 200, body: MOCK_BOT },
      { status: 200, body: { ...MOCK_BOT, sport: 'basketball', league: 'nba' } }
    )
    render(<SettingsPage />)

    await waitFor(() => {
      expect(screen.getByLabelText('Sport')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(screen.getByText('Changes saved')).toBeInTheDocument()
    })
  })

  it('shows error message on save failure', async () => {
    mockFetchSequence(
      { status: 200, body: MOCK_BOT },
      { status: 400, body: { error: 'Invalid sport' } }
    )
    render(<SettingsPage />)

    await waitFor(() => {
      expect(screen.getByLabelText('Sport')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(screen.getByText('Invalid sport')).toBeInTheDocument()
    })
  })

  it('cascades league when sport changes', async () => {
    mockFetch(200, MOCK_BOT)
    render(<SettingsPage />)

    await waitFor(() => {
      expect(screen.getByLabelText('Sport')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText('Sport'), {
      target: { value: 'basketball' },
    })

    const leagueSelect = screen.getByLabelText('League') as HTMLSelectElement
    expect(leagueSelect.value).toBe('nba')
  })

  it('shows delete confirmation on click', async () => {
    mockFetch(200, MOCK_BOT)
    render(<SettingsPage />)

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /delete my chatbot/i })
      ).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /delete my chatbot/i }))

    expect(
      screen.getByRole('button', { name: /yes, delete everything/i })
    ).toBeInTheDocument()
  })

  it('hides confirmation on cancel', async () => {
    mockFetch(200, MOCK_BOT)
    render(<SettingsPage />)

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /delete my chatbot/i })
      ).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /delete my chatbot/i }))
    expect(
      screen.getByRole('button', { name: /yes, delete everything/i })
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(
      screen.queryByRole('button', { name: /yes, delete everything/i })
    ).not.toBeInTheDocument()
  })

  it('redirects to /dashboard on successful delete', async () => {
    mockFetchSequence(
      { status: 200, body: MOCK_BOT },
      { status: 200, body: { success: true } }
    )
    render(<SettingsPage />)

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /delete my chatbot/i })
      ).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /delete my chatbot/i }))
    fireEvent.click(
      screen.getByRole('button', { name: /yes, delete everything/i })
    )

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('shows error on delete failure', async () => {
    mockFetchSequence(
      { status: 200, body: MOCK_BOT },
      { status: 500, body: { error: 'Internal server error' } }
    )
    render(<SettingsPage />)

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /delete my chatbot/i })
      ).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /delete my chatbot/i }))
    fireEvent.click(
      screen.getByRole('button', { name: /yes, delete everything/i })
    )

    await waitFor(() => {
      expect(screen.getByText('Internal server error')).toBeInTheDocument()
    })
  })
})
