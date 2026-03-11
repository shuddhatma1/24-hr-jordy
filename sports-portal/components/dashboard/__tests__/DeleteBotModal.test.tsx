// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DeleteBotModal from '../DeleteBotModal'

vi.mock('lucide-react', () => ({
  AlertTriangle: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="alert-triangle-icon" {...props} />,
  X: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="x-icon" {...props} />,
}))

const mockOnClose = vi.fn()
const mockOnConfirm = vi.fn()

function renderModal(overrides: Partial<Parameters<typeof DeleteBotModal>[0]> = {}) {
  return render(
    <DeleteBotModal
      isOpen={true}
      onClose={mockOnClose}
      onConfirm={mockOnConfirm}
      isDeleting={false}
      error=""
      {...overrides}
    />
  )
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('DeleteBotModal', () => {
  it('renders nothing when isOpen is false', () => {
    renderModal({ isOpen: false })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders dialog when isOpen is true', () => {
    renderModal()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Delete your chatbot?')).toBeInTheDocument()
  })

  it('calls onConfirm when confirm button is clicked', () => {
    renderModal()
    fireEvent.click(screen.getByRole('button', { name: /yes, delete everything/i }))
    expect(mockOnConfirm).toHaveBeenCalledOnce()
  })

  it('calls onClose when cancel button is clicked', () => {
    renderModal()
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(mockOnClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when Escape key is pressed', () => {
    renderModal()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(mockOnClose).toHaveBeenCalledOnce()
  })

  it('displays error message when error is provided', () => {
    renderModal({ error: 'Something went wrong' })
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('shows "Deleting..." when isDeleting is true', () => {
    renderModal({ isDeleting: true })
    expect(screen.getByRole('button', { name: /deleting/i })).toBeInTheDocument()
  })

  it('disables buttons when isDeleting is true', () => {
    renderModal({ isDeleting: true })
    expect(screen.getByRole('button', { name: /deleting/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled()
  })
})
