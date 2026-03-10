// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi, beforeAll } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DataSourcesPage from '../page'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

interface DataSourceEntry {
  id: string
  type: 'faq' | 'file'
  title: string
  content: string
  file_size: number | null
  original_filename: string | null
  created_at: string
}

const mockFaqEntry: DataSourceEntry = {
  id: 'entry-1',
  type: 'faq',
  title: 'How to buy tickets?',
  content: 'Visit the official website to purchase tickets.',
  file_size: null,
  original_filename: null,
  created_at: '2026-01-01T00:00:00.000Z',
}

const mockFileEntry: DataSourceEntry = {
  id: 'entry-2',
  type: 'file',
  title: 'roster.csv',
  content: 'name,position\nAlice,Forward',
  file_size: 1024,
  original_filename: 'roster.csv',
  created_at: '2026-01-02T00:00:00.000Z',
}

function stubFetch(...responses: Array<{ ok: boolean; status: number; body: unknown }>) {
  const mock = vi.fn()
  responses.forEach((r) => {
    mock.mockResolvedValueOnce({
      ok: r.ok,
      status: r.status,
      json: () => Promise.resolve(r.body),
    })
  })
  vi.stubGlobal('fetch', mock)
  return mock
}

function okResponse(body: unknown, status = 200) {
  return { ok: true, status, body }
}

function errResponse(body: unknown, status: number) {
  return { ok: false, status, body }
}

describe('DataSourcesPage', () => {
  it('shows loading skeleton while fetching', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
    render(<DataSourcesPage />)
    // Loading skeletons are animated divs
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('shows no-bot message on 404 response', async () => {
    stubFetch(errResponse({ error: 'No bot found' }, 404))
    render(<DataSourcesPage />)
    await waitFor(() =>
      expect(screen.getByText(/create your bot first/i)).toBeInTheDocument()
    )
  })

  it('shows error message on 500 response', async () => {
    stubFetch(errResponse({ error: 'Internal server error' }, 500))
    render(<DataSourcesPage />)
    await waitFor(() =>
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
    )
  })

  it('renders FAQ entries in FAQ tab by default', async () => {
    stubFetch(okResponse([mockFaqEntry]))
    render(<DataSourcesPage />)
    await waitFor(() =>
      expect(screen.getByText('How to buy tickets?')).toBeInTheDocument()
    )
    expect(screen.getByText(/Visit the official website/)).toBeInTheDocument()
  })

  it('switches to Files tab and shows file entries', async () => {
    stubFetch(okResponse([mockFaqEntry, mockFileEntry]))
    render(<DataSourcesPage />)
    await waitFor(() => screen.getByText('How to buy tickets?'))

    fireEvent.click(screen.getByRole('tab', { name: /uploaded files/i }))

    expect(screen.getByText('roster.csv')).toBeInTheDocument()
    expect(screen.getByText('1.0 KB')).toBeInTheDocument()
    expect(screen.getByText('Ready')).toBeInTheDocument()
  })

  it('FAQ entries not shown in Files tab', async () => {
    stubFetch(okResponse([mockFaqEntry, mockFileEntry]))
    render(<DataSourcesPage />)
    await waitFor(() => screen.getByText('How to buy tickets?'))

    fireEvent.click(screen.getByRole('tab', { name: /uploaded files/i }))

    expect(screen.queryByText('How to buy tickets?')).not.toBeInTheDocument()
  })

  it('adds FAQ entry on success and shows success toast', async () => {
    const newEntry: DataSourceEntry = {
      id: 'new-1',
      type: 'faq',
      title: 'New question',
      content: 'New answer',
      file_size: null,
      original_filename: null,
      created_at: '2026-01-03T00:00:00.000Z',
    }
    stubFetch(
      okResponse([mockFaqEntry]),
      okResponse(newEntry, 201)
    )
    render(<DataSourcesPage />)
    await waitFor(() => screen.getByText('How to buy tickets?'))

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'New question' },
    })
    fireEvent.change(screen.getByLabelText(/answer/i), {
      target: { value: 'New answer' },
    })
    fireEvent.click(screen.getByRole('button', { name: /add entry/i }))

    await waitFor(() => expect(screen.getByText('New question')).toBeInTheDocument())
    await waitFor(() => expect(screen.getByText(/faq entry added/i)).toBeInTheDocument())
  })

  it('shows error toast when add FAQ fails', async () => {
    stubFetch(
      okResponse([]),
      errResponse({ error: 'Internal server error' }, 500)
    )
    render(<DataSourcesPage />)
    await waitFor(() => screen.getByRole('button', { name: /add entry/i }))

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'T' } })
    fireEvent.change(screen.getByLabelText(/answer/i), { target: { value: 'C' } })
    fireEvent.click(screen.getByRole('button', { name: /add entry/i }))

    await waitFor(() =>
      expect(screen.getByText('Internal server error')).toBeInTheDocument()
    )
  })

  it('shows inline error when FAQ title is empty', async () => {
    stubFetch(okResponse([]))
    render(<DataSourcesPage />)
    await waitFor(() => screen.getByRole('button', { name: /add entry/i }))

    fireEvent.change(screen.getByLabelText(/answer/i), { target: { value: 'Some content' } })
    fireEvent.click(screen.getByRole('button', { name: /add entry/i }))

    expect(screen.getByText(/title is required/i)).toBeInTheDocument()
    // fetch should not have been called for POST
    const fetchMock = vi.mocked(global.fetch)
    const postCalls = fetchMock.mock.calls.filter((c) => {
      const init = c[1] as RequestInit | undefined
      return init?.method === 'POST'
    })
    expect(postCalls).toHaveLength(0)
  })

  it('shows inline error when FAQ content is empty', async () => {
    stubFetch(okResponse([]))
    render(<DataSourcesPage />)
    await waitFor(() => screen.getByRole('button', { name: /add entry/i }))

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Some title' } })
    fireEvent.click(screen.getByRole('button', { name: /add entry/i }))

    expect(screen.getByText(/content is required/i)).toBeInTheDocument()
  })

  it('deletes FAQ entry on success and shows success toast', async () => {
    stubFetch(
      okResponse([mockFaqEntry]),
      okResponse({ success: true })
    )
    render(<DataSourcesPage />)
    await waitFor(() => screen.getByText('How to buy tickets?'))

    fireEvent.click(screen.getByRole('button', { name: /delete how to buy tickets/i }))

    await waitFor(() =>
      expect(screen.queryByText('How to buy tickets?')).not.toBeInTheDocument()
    )
    expect(screen.getByText('Deleted')).toBeInTheDocument()
  })

  it('shows error toast when delete fails', async () => {
    stubFetch(
      okResponse([mockFaqEntry]),
      errResponse({ error: 'Not found' }, 404)
    )
    render(<DataSourcesPage />)
    await waitFor(() => screen.getByText('How to buy tickets?'))

    fireEvent.click(screen.getByRole('button', { name: /delete how to buy tickets/i }))

    await waitFor(() => expect(screen.getByText('Not found')).toBeInTheDocument())
    // Entry still shown after failed delete
    expect(screen.getByText('How to buy tickets?')).toBeInTheDocument()
  })

  it('shows success toast after file upload and switches to Files tab', async () => {
    const newFile: DataSourceEntry = {
      id: 'file-1',
      type: 'file',
      title: 'notes.txt',
      content: 'some notes',
      file_size: 512,
      original_filename: 'notes.txt',
      created_at: '2026-01-03T00:00:00.000Z',
    }
    stubFetch(
      okResponse([]),
      okResponse(newFile, 201)
    )
    render(<DataSourcesPage />)
    await waitFor(() => screen.getByRole('tab', { name: /uploaded files/i }))

    // Switch to Files tab first to see the upload input
    fireEvent.click(screen.getByRole('tab', { name: /uploaded files/i }))

    const input = document.getElementById('file-upload') as HTMLInputElement
    const file = new File(['hello world'], 'notes.txt', { type: 'text/plain' })
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    fireEvent.change(input)

    await waitFor(() =>
      expect(screen.getByText(/file uploaded and processed/i)).toBeInTheDocument()
    )
    expect(screen.getByText('notes.txt')).toBeInTheDocument()
  })

  it('shows error toast when upload fails', async () => {
    stubFetch(
      okResponse([]),
      errResponse({ error: 'Failed to extract text from file' }, 422)
    )
    render(<DataSourcesPage />)
    await waitFor(() => screen.getByRole('tab', { name: /uploaded files/i }))

    fireEvent.click(screen.getByRole('tab', { name: /uploaded files/i }))

    const input = document.getElementById('file-upload') as HTMLInputElement
    const file = new File(['content'], 'doc.txt', { type: 'text/plain' })
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    fireEvent.change(input)

    await waitFor(() =>
      expect(screen.getByText('Failed to extract text from file')).toBeInTheDocument()
    )
  })

  it('shows error toast for unsupported file extension (client-side)', async () => {
    stubFetch(okResponse([]))
    render(<DataSourcesPage />)
    await waitFor(() => screen.getByRole('tab', { name: /uploaded files/i }))

    fireEvent.click(screen.getByRole('tab', { name: /uploaded files/i }))

    const input = document.getElementById('file-upload') as HTMLInputElement
    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' })
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    fireEvent.change(input)

    await waitFor(() =>
      expect(screen.getByText(/PDF, CSV, and TXT/i)).toBeInTheDocument()
    )
    // Upload fetch should NOT have been called
    const fetchMock = vi.mocked(global.fetch)
    const uploadCalls = fetchMock.mock.calls.filter((c) => {
      return String(c[0]).includes('upload')
    })
    expect(uploadCalls).toHaveLength(0)
  })

  it('shows error toast for oversized file (client-side)', async () => {
    stubFetch(okResponse([]))
    render(<DataSourcesPage />)
    await waitFor(() => screen.getByRole('tab', { name: /uploaded files/i }))

    fireEvent.click(screen.getByRole('tab', { name: /uploaded files/i }))

    const input = document.getElementById('file-upload') as HTMLInputElement
    // Use a tiny file but mock its size to simulate an oversized file
    const file = new File(['small'], 'big.txt', { type: 'text/plain' })
    Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 + 1 })
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    fireEvent.change(input)

    await waitFor(() =>
      expect(screen.getByText('File must be 5MB or less')).toBeInTheDocument()
    )
  })

  it('toast dismisses when close button is clicked', async () => {
    const newEntry: DataSourceEntry = {
      id: 'new-1',
      type: 'faq',
      title: 'Q',
      content: 'A',
      file_size: null,
      original_filename: null,
      created_at: '2026-01-01T00:00:00.000Z',
    }
    stubFetch(okResponse([]), okResponse(newEntry, 201))
    render(<DataSourcesPage />)
    await waitFor(() => screen.getByRole('button', { name: /add entry/i }))

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Q' } })
    fireEvent.change(screen.getByLabelText(/answer/i), { target: { value: 'A' } })
    fireEvent.click(screen.getByRole('button', { name: /add entry/i }))

    await waitFor(() => expect(screen.getByText(/faq entry added/i)).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }))
    expect(screen.queryByText(/faq entry added/i)).not.toBeInTheDocument()
  })
})
