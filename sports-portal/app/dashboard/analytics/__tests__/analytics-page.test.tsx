// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AnalyticsPage from '../page'

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

const emptyData = {
  total_conversations: 0,
  total_messages: 0,
  avg_messages_per_conversation: 0,
  daily_messages: [],
  daily_conversations: [],
  period: '7d',
}

const sampleData = {
  total_conversations: 5,
  total_messages: 23,
  avg_messages_per_conversation: 4.6,
  daily_messages: [
    { date: '2026-03-10', count: 12 },
    { date: '2026-03-11', count: 11 },
  ],
  daily_conversations: [
    { date: '2026-03-10', count: 3 },
    { date: '2026-03-11', count: 2 },
  ],
  period: '7d',
}

describe('AnalyticsPage', () => {
  it('shows loading skeleton initially', () => {
    mockFetch(200, sampleData)
    render(<AnalyticsPage />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows stat cards with data on 200', async () => {
    mockFetch(200, sampleData)
    render(<AnalyticsPage />)
    await waitFor(() => expect(screen.getByText('23')).toBeInTheDocument())
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('4.6')).toBeInTheDocument()
  })

  it('shows no-bot state when API returns 404', async () => {
    mockFetch(404, { error: 'No bot found' })
    render(<AnalyticsPage />)
    await waitFor(() =>
      expect(screen.getByText(/create your bot first/i)).toBeInTheDocument()
    )
  })

  it('shows error state when API returns 500', async () => {
    mockFetch(500, { error: 'Internal server error' })
    render(<AnalyticsPage />)
    await waitFor(() =>
      expect(screen.getByText(/failed to load analytics/i)).toBeInTheDocument()
    )
  })

  it('shows empty state when no activity', async () => {
    mockFetch(200, emptyData)
    render(<AnalyticsPage />)
    await waitFor(() =>
      expect(screen.getByText(/no chat activity yet/i)).toBeInTheDocument()
    )
    expect(screen.getByText(/go to overview/i)).toBeInTheDocument()
  })

  it('renders bar chart when data has daily messages', async () => {
    mockFetch(200, sampleData)
    render(<AnalyticsPage />)
    await waitFor(() => expect(screen.getByText('Daily messages')).toBeInTheDocument())
    // Bars show counts
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('11')).toBeInTheDocument()
  })

  it('re-fetches when period toggle is clicked', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(sampleData),
    })
    vi.stubGlobal('fetch', fetchMock)
    render(<AnalyticsPage />)
    await waitFor(() => expect(screen.getByText('23')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: '30 days' }))
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('period=30d'),
        expect.any(Object)
      )
    )
  })

  it('shows all three period buttons', async () => {
    mockFetch(200, sampleData)
    render(<AnalyticsPage />)
    await waitFor(() => expect(screen.getByText('23')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: '7 days' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '30 days' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'All time' })).toBeInTheDocument()
  })
})
