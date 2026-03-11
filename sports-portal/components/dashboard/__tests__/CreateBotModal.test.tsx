// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CreateBotModal from '../CreateBotModal'

vi.mock('lucide-react', () => ({
  X: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="x-icon" {...props} />,
}))

const mockOnClose = vi.fn()
const mockOnSuccess = vi.fn()

function renderModal(isOpen = true) {
  return render(
    <CreateBotModal isOpen={isOpen} onClose={mockOnClose} onSuccess={mockOnSuccess} />
  )
}

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

describe('CreateBotModal', () => {
  it('renders nothing when isOpen is false', () => {
    renderModal(false)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders step 1 with name input when isOpen is true', () => {
    renderModal()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText(/bot name/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('e.g. City FC Bot')).toBeInTheDocument()
  })

  it('shows error when bot name is empty and Next is clicked', () => {
    renderModal()
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByText('Bot name is required')).toBeInTheDocument()
  })

  it('advances to step 2 on valid name submission', () => {
    renderModal()
    fireEvent.change(screen.getByPlaceholderText('e.g. City FC Bot'), {
      target: { value: 'My Bot' },
    })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    // Step 2 shows sport cards with radio buttons
    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
  })

  it('advances to step 3 from step 2', () => {
    renderModal()
    fireEvent.change(screen.getByPlaceholderText('e.g. City FC Bot'), {
      target: { value: 'My Bot' },
    })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByLabelText(/^league$/i)).toBeInTheDocument()
  })

  it('back button from step 2 returns to step 1', () => {
    renderModal()
    fireEvent.change(screen.getByPlaceholderText('e.g. City FC Bot'), {
      target: { value: 'My Bot' },
    })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.click(screen.getByRole('button', { name: /back/i }))
    expect(screen.getByPlaceholderText('e.g. City FC Bot')).toBeInTheDocument()
  })

  it('back button from step 3 returns to step 2', () => {
    renderModal()
    fireEvent.change(screen.getByPlaceholderText('e.g. City FC Bot'), {
      target: { value: 'My Bot' },
    })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.click(screen.getByRole('button', { name: /back/i }))
    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
  })

  it('calls onSuccess with bot data on successful submit', async () => {
    const botPayload = {
      bot_id: 'abc123def456abc123def456',
      bot_name: 'My Bot',
      sport: 'soccer',
      league: 'english-premier-league',
      created_at: '2026-03-10T00:00:00.000Z',
    }
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ bot_id: 'abc123def456abc123def456' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(botPayload),
        })
    )

    renderModal()
    fireEvent.change(screen.getByPlaceholderText('e.g. City FC Bot'), {
      target: { value: 'My Bot' },
    })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.click(screen.getByRole('button', { name: /set up my bot/i }))

    await waitFor(() =>
      expect(mockOnSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ bot_id: 'abc123def456abc123def456' })
      )
    )
  })

  it('shows error message on API failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'You already have a bot configured' }),
      })
    )

    renderModal()
    fireEvent.change(screen.getByPlaceholderText('e.g. City FC Bot'), {
      target: { value: 'My Bot' },
    })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.click(screen.getByRole('button', { name: /set up my bot/i }))

    await waitFor(() =>
      expect(screen.getByText('You already have a bot configured')).toBeInTheDocument()
    )
  })

  it('calls onClose when close button is clicked', () => {
    renderModal()
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(mockOnClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when backdrop is clicked', () => {
    renderModal()
    // The backdrop is the first child of the fixed overlay (aria-hidden)
    const backdrop = document.querySelector('[aria-hidden="true"]') as HTMLElement
    fireEvent.click(backdrop)
    expect(mockOnClose).toHaveBeenCalledOnce()
  })
})
