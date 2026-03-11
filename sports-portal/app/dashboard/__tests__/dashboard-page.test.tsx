// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DashboardPage from '../page'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

const mockBot = {
  bot_id: 'abc123def456abc123def456',
  bot_name: 'City FC Bot',
  sport: 'soccer',
  league: 'english-premier-league',
  created_at: '2026-03-10T00:00:00.000Z',
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

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

describe('DashboardPage', () => {
  it('shows loading state initially', () => {
    mockFetch(200, mockBot)
    const { container } = render(<DashboardPage />)
    // Dashboard uses skeleton loaders for loading state
    expect(container.querySelector('.skeleton')).toBeInTheDocument()
  })

  it('shows empty state when API returns 404', async () => {
    mockFetch(404, { error: 'No bot found' })
    render(<DashboardPage />)
    await waitFor(() => expect(screen.getByText(/no chatbot yet/i)).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /create your chatbot/i })).toBeInTheDocument()
  })

  it('shows bot name in overview on 200', async () => {
    mockFetch(200, mockBot)
    render(<DashboardPage />)
    await waitFor(() => expect(screen.getByText('City FC Bot')).toBeInTheDocument())
  })

  it('shows sport and league labels in overview', async () => {
    mockFetch(200, mockBot)
    render(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText('Soccer')).toBeInTheDocument()
      expect(screen.getByText('English Premier League')).toBeInTheDocument()
    })
  })

  it('shows formatted creation date', async () => {
    mockFetch(200, mockBot)
    render(<DashboardPage />)
    await waitFor(() => expect(screen.getByText(/march 10, 2026/i)).toBeInTheDocument())
  })

  it('chat URL appears in the shareable link card', async () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com'
    mockFetch(200, mockBot)
    render(<DashboardPage />)
    await waitFor(() =>
      expect(screen.getByText(/example\.com\/chat\/abc123/i)).toBeInTheDocument()
    )
  })

  it('embed code snippet contains bot_id', async () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com'
    mockFetch(200, mockBot)
    render(<DashboardPage />)
    await waitFor(() =>
      expect(screen.getByText(/data-bot-id="abc123/i)).toBeInTheDocument()
    )
  })

  it('redirects to /login on 401', async () => {
    mockFetch(401, { error: 'Unauthorized' })
    render(<DashboardPage />)
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/login'))
  })

  it('shows error state on non-401 non-404 error', async () => {
    mockFetch(500, { error: 'Internal server error' })
    render(<DashboardPage />)
    await waitFor(() => expect(screen.getByText(/failed to load/i)).toBeInTheDocument())
  })

  it('Create chatbot button opens the modal', async () => {
    mockFetch(404, { error: 'No bot found' })
    render(<DashboardPage />)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /create your chatbot/i })).toBeInTheDocument()
    )
    fireEvent.click(screen.getByRole('button', { name: /create your chatbot/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
