// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ChatWindow from '../ChatWindow'

// jsdom does not implement scrollIntoView — stub it to prevent test errors
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a mock fetch that returns an SSE stream delivering the given tokens
 * followed by a [DONE] terminator.
 */
function stubFetchWithStream(tokens: string[]) {
  const encoder = new TextEncoder()
  const chunks = [
    ...tokens.map((t) => `data: ${JSON.stringify({ token: t })}\n\n`),
    'data: [DONE]\n\n',
  ]
  const stream = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk))
      }
      controller.close()
    },
  })

  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: stream,
      json: () => Promise.resolve({}),
    })
  )
}

/**
 * Build a mock fetch whose stream reader is fully controlled by the caller.
 * Returns `resolveRead` — call it with a chunk string to push data, or call
 * it with null to signal stream end (done=true).
 */
function stubFetchWithControlledStream() {
  const encoder = new TextEncoder()
  let resolveRead!: (result: ReadableStreamReadResult<Uint8Array>) => void

  const mockReader = {
    read: vi.fn().mockImplementation(
      () =>
        new Promise<ReadableStreamReadResult<Uint8Array>>((resolve) => {
          resolveRead = resolve
        })
    ),
    cancel: vi.fn(),
    releaseLock: vi.fn(),
  }

  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: { getReader: () => mockReader },
      json: () => Promise.resolve({}),
    })
  )

  function pushChunk(text: string) {
    resolveRead({ done: false, value: encoder.encode(text) })
  }

  function closeStream() {
    resolveRead({ done: true, value: undefined })
  }

  return { pushChunk, closeStream }
}

/**
 * Stub fetch to return a non-OK response.
 */
function stubFetchWithError(status: number, errorMsg: string) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: false,
      status,
      body: null,
      json: () => Promise.resolve({ error: errorMsg }),
    })
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ChatWindow — initial render', () => {
  it('renders the bot name in the header', () => {
    render(
      <ChatWindow botId="abc" botName="City FC Bot" leagueLabel="English Premier League" />
    )
    // Bot name appears in both header (h1) and WelcomeCard (h2)
    const headings = screen.getAllByText('City FC Bot')
    expect(headings.length).toBeGreaterThanOrEqual(1)
    // The first one should be the h1 in the header
    expect(headings[0].tagName).toBe('H1')
  })

  it('shows the welcome message in the WelcomeCard on mount', () => {
    render(
      <ChatWindow botId="abc" botName="City FC Bot" leagueLabel="English Premier League" />
    )
    expect(
      screen.getByText('Hi! Ask me anything about the English Premier League.')
    ).toBeInTheDocument()
  })

  it('shows Online status in the header', () => {
    render(
      <ChatWindow botId="abc" botName="City FC Bot" leagueLabel="English Premier League" />
    )
    expect(screen.getByText('Online')).toBeInTheDocument()
  })

  it('input is enabled on mount', () => {
    render(<ChatWindow botId="abc" botName="Bot" leagueLabel="EPL" />)
    expect(screen.getByPlaceholderText('Type a question...')).not.toBeDisabled()
  })

  it('shows WelcomeCard with suggested chips on mount', () => {
    render(<ChatWindow botId="abc" botName="Bot" leagueLabel="EPL" sport="soccer" />)
    expect(screen.getByText('Who won last night?')).toBeInTheDocument()
  })
})

describe('ChatWindow — sending a message', () => {
  it('appends the user message to the chat', async () => {
    stubFetchWithStream(['ok'])
    render(<ChatWindow botId="abc" botName="Bot" leagueLabel="EPL" />)

    fireEvent.change(screen.getByPlaceholderText('Type a question...'), {
      target: { value: 'Who scored?' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() =>
      expect(screen.getByText('Who scored?')).toBeInTheDocument()
    )
  })

  it('hides WelcomeCard after sending a message', async () => {
    stubFetchWithStream(['ok'])
    render(<ChatWindow botId="abc" botName="Bot" leagueLabel="EPL" sport="soccer" />)

    // WelcomeCard should be visible initially
    expect(screen.getByText('Who won last night?')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Type a question...'), {
      target: { value: 'question' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() =>
      expect(screen.queryByText('Who won last night?')).not.toBeInTheDocument()
    )
  })

  it('clicking a chip fires the send handler', async () => {
    stubFetchWithStream(['Salah'])
    render(<ChatWindow botId="abc" botName="Bot" leagueLabel="EPL" sport="soccer" />)

    fireEvent.click(screen.getByText('Top scorers'))

    await waitFor(() =>
      expect(screen.getByText('Top scorers')).toBeInTheDocument()
    )
    // Should have called fetch with the chip text
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        '/api/chat',
        expect.objectContaining({
          body: expect.stringContaining('Top scorers'),
        })
      )
    )
  })

  it('clears the input immediately after send', async () => {
    stubFetchWithStream(['ok'])
    render(<ChatWindow botId="abc" botName="Bot" leagueLabel="EPL" />)

    const input = screen.getByPlaceholderText('Type a question...')
    fireEvent.change(input, { target: { value: 'question' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    // Input clears synchronously inside ChatInput on submit
    expect(input).toHaveValue('')
  })

  it('calls /api/chat with the correct bot_id', async () => {
    stubFetchWithStream(['ok'])
    render(<ChatWindow botId="bot123" botName="Bot" leagueLabel="EPL" />)

    fireEvent.change(screen.getByPlaceholderText('Type a question...'), {
      target: { value: 'hello' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        '/api/chat',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"bot_id":"bot123"'),
        })
      )
    )
  })

  it('includes user message in the API payload', async () => {
    stubFetchWithStream(['ok'])
    render(<ChatWindow botId="abc" botName="Bot" leagueLabel="EPL" />)

    fireEvent.change(screen.getByPlaceholderText('Type a question...'), {
      target: { value: 'Top scorer?' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() => {
      const calls = vi.mocked(fetch).mock.calls
      const body = JSON.parse(calls[0][1]!.body as string) as {
        messages: { role: string; content: string }[]
      }
      expect(body.messages).toContainEqual({
        role: 'user',
        content: 'Top scorer?',
      })
    })
  })
})

describe('ChatWindow — streaming', () => {
  it('concatenates tokens into the bot message', async () => {
    stubFetchWithStream(['Top', ' scorer', ' is', ' Salah'])
    render(<ChatWindow botId="abc" botName="Bot" leagueLabel="EPL" />)

    fireEvent.change(screen.getByPlaceholderText('Type a question...'), {
      target: { value: 'Top scorer?' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() =>
      expect(screen.getByText('Top scorer is Salah')).toBeInTheDocument()
    )
  })

  it('shows typing indicator while streaming with empty bot content', async () => {
    const { pushChunk, closeStream } = stubFetchWithControlledStream()
    render(<ChatWindow botId="abc" botName="Bot" leagueLabel="EPL" />)

    fireEvent.change(screen.getByPlaceholderText('Type a question...'), {
      target: { value: 'question' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    // Wait for streaming state — typing indicator dots should appear
    await waitFor(() => {
      const dots = document.querySelectorAll('.animate-bounce-dot')
      expect(dots.length).toBe(3)
    })

    // Resolve the stream
    pushChunk('data: {"token":"hi"}\n\ndata: [DONE]\n\n')
    closeStream()

    // After streaming completes, typing indicator should be gone
    await waitFor(() => {
      const dots = document.querySelectorAll('.animate-bounce-dot')
      expect(dots.length).toBe(0)
    })
  })

  it('disables input and send button while streaming', async () => {
    const { pushChunk, closeStream } = stubFetchWithControlledStream()
    render(<ChatWindow botId="abc" botName="Bot" leagueLabel="EPL" />)

    const input = screen.getByPlaceholderText('Type a question...')
    fireEvent.change(input, { target: { value: 'question' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    // Wait for streaming state to propagate
    await waitFor(() => expect(input).toBeDisabled())
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled()

    // Resolve the stream
    pushChunk('data: {"token":"hi"}\n\ndata: [DONE]\n\n')
    closeStream()

    await waitFor(() => expect(input).not.toBeDisabled())
  })

  it('re-enables input after streaming completes', async () => {
    stubFetchWithStream(['Done'])
    render(<ChatWindow botId="abc" botName="Bot" leagueLabel="EPL" />)

    fireEvent.change(screen.getByPlaceholderText('Type a question...'), {
      target: { value: 'question' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() =>
      expect(screen.getByPlaceholderText('Type a question...')).not.toBeDisabled()
    )
  })

  it('handles stream that ends without [DONE]', async () => {
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode('data: {"token":"partial"}\n\n')
        )
        // Close without [DONE]
        controller.close()
      },
    })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        body: stream,
        json: () => Promise.resolve({}),
      })
    )

    render(<ChatWindow botId="abc" botName="Bot" leagueLabel="EPL" />)
    fireEvent.change(screen.getByPlaceholderText('Type a question...'), {
      target: { value: 'question' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    // Input should re-enable even without [DONE]
    await waitFor(() =>
      expect(screen.getByPlaceholderText('Type a question...')).not.toBeDisabled()
    )
    expect(screen.getByText('partial')).toBeInTheDocument()
  })

  it('skips malformed SSE data lines without crashing', async () => {
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        // Mix of malformed and valid lines
        controller.enqueue(
          encoder.encode(
            'data: not-json\n\ndata: {"token":"good"}\n\ndata: [DONE]\n\n'
          )
        )
        controller.close()
      },
    })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        body: stream,
        json: () => Promise.resolve({}),
      })
    )

    render(<ChatWindow botId="abc" botName="Bot" leagueLabel="EPL" />)
    fireEvent.change(screen.getByPlaceholderText('Type a question...'), {
      target: { value: 'question' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() => expect(screen.getByText('good')).toBeInTheDocument())
  })

  it('accumulates tokens split across chunk boundaries', async () => {
    // Simulate a chunk boundary in the middle of a JSON token
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        // First chunk: partial SSE line (no trailing \n\n yet)
        controller.enqueue(encoder.encode('data: {"tok'))
        // Second chunk: completes the line + DONE
        controller.enqueue(
          encoder.encode('en":"hello"}\n\ndata: [DONE]\n\n')
        )
        controller.close()
      },
    })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        body: stream,
        json: () => Promise.resolve({}),
      })
    )

    render(<ChatWindow botId="abc" botName="Bot" leagueLabel="EPL" />)
    fireEvent.change(screen.getByPlaceholderText('Type a question...'), {
      target: { value: 'question' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() => expect(screen.getByText('hello')).toBeInTheDocument())
  })
})

describe('ChatWindow — error handling', () => {
  it('shows error message when bot endpoint returns a non-OK response', async () => {
    stubFetchWithError(502, 'Bot endpoint unreachable')
    render(<ChatWindow botId="abc" botName="Bot" leagueLabel="EPL" />)

    fireEvent.change(screen.getByPlaceholderText('Type a question...'), {
      target: { value: 'question' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() =>
      expect(
        screen.getByText('Sorry, something went wrong. Please try again.')
      ).toBeInTheDocument()
    )
  })

  it('shows error message on network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    render(<ChatWindow botId="abc" botName="Bot" leagueLabel="EPL" />)

    fireEvent.change(screen.getByPlaceholderText('Type a question...'), {
      target: { value: 'question' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() =>
      expect(
        screen.getByText('Sorry, something went wrong. Please try again.')
      ).toBeInTheDocument()
    )
  })

  it('re-enables input after an error', async () => {
    stubFetchWithError(500, 'Internal error')
    render(<ChatWindow botId="abc" botName="Bot" leagueLabel="EPL" />)

    fireEvent.change(screen.getByPlaceholderText('Type a question...'), {
      target: { value: 'question' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() =>
      expect(screen.getByPlaceholderText('Type a question...')).not.toBeDisabled()
    )
  })

  it('does not show error on AbortError (unmount / navigation)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError'))
    )
    render(<ChatWindow botId="abc" botName="Bot" leagueLabel="EPL" />)

    fireEvent.change(screen.getByPlaceholderText('Type a question...'), {
      target: { value: 'question' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    // Give async error path time to run; error message must NOT appear
    await new Promise((r) => setTimeout(r, 50))
    expect(
      screen.queryByText('Sorry, something went wrong. Please try again.')
    ).not.toBeInTheDocument()
  })
})

describe('ChatWindow — multi-turn conversation', () => {
  it('includes previous exchange in the next API call', async () => {
    stubFetchWithStream(['Salah'])
    render(<ChatWindow botId="abc" botName="Bot" leagueLabel="EPL" />)

    // First turn
    fireEvent.change(screen.getByPlaceholderText('Type a question...'), {
      target: { value: 'Who scored?' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    // Wait for first turn to complete and input to re-enable
    await waitFor(() =>
      expect(screen.getByPlaceholderText('Type a question...')).not.toBeDisabled()
    )

    // Second turn — re-stub with fresh stream
    stubFetchWithStream(['Yes'])
    fireEvent.change(screen.getByPlaceholderText('Type a question...'), {
      target: { value: 'And goals?' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() => {
      const calls = vi.mocked(fetch).mock.calls
      const body = JSON.parse(calls[0][1]!.body as string) as {
        messages: { role: string; content: string }[]
      }
      // Second call must carry the complete prior exchange with correct roles
      expect(body.messages).toEqual([
        { role: 'user', content: 'Who scored?' },
        { role: 'assistant', content: 'Salah' },
        { role: 'user', content: 'And goals?' },
      ])
    })
  })
})
