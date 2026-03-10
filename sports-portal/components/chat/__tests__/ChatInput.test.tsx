// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ChatInput from '../ChatInput'

describe('ChatInput', () => {
  it('renders the text input and send button', () => {
    render(<ChatInput onSend={vi.fn()} disabled={false} />)
    expect(screen.getByPlaceholderText('Type a question...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument()
  })

  it('calls onSend with trimmed text when Send is clicked', () => {
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} disabled={false} />)
    fireEvent.change(screen.getByPlaceholderText('Type a question...'), {
      target: { value: '  hello world  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    expect(onSend).toHaveBeenCalledOnce()
    expect(onSend).toHaveBeenCalledWith('hello world')
  })

  it('calls onSend when Enter is pressed (no modifier)', () => {
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} disabled={false} />)
    const input = screen.getByPlaceholderText('Type a question...')
    fireEvent.change(input, { target: { value: 'hello' } })
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false })
    expect(onSend).toHaveBeenCalledWith('hello')
  })

  it('does not call onSend on Shift+Enter', () => {
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} disabled={false} />)
    const input = screen.getByPlaceholderText('Type a question...')
    fireEvent.change(input, { target: { value: 'hello' } })
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true })
    expect(onSend).not.toHaveBeenCalled()
  })

  it('clears the input after a successful send', () => {
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} disabled={false} />)
    const input = screen.getByPlaceholderText('Type a question...')
    fireEvent.change(input, { target: { value: 'hello' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    expect(input).toHaveValue('')
  })

  it('does not call onSend for whitespace-only input', () => {
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} disabled={false} />)
    fireEvent.change(screen.getByPlaceholderText('Type a question...'), {
      target: { value: '   ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    expect(onSend).not.toHaveBeenCalled()
  })

  it('does not call onSend for empty input', () => {
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} disabled={false} />)
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    expect(onSend).not.toHaveBeenCalled()
  })

  it('disables input and button when disabled prop is true', () => {
    render(<ChatInput onSend={vi.fn()} disabled={true} />)
    expect(screen.getByPlaceholderText('Type a question...')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled()
  })

  it('does not call onSend when disabled (button click)', () => {
    const onSend = vi.fn()
    // Type a message, then disable, then click
    const { rerender } = render(<ChatInput onSend={onSend} disabled={false} />)
    fireEvent.change(screen.getByPlaceholderText('Type a question...'), {
      target: { value: 'hello' },
    })
    rerender(<ChatInput onSend={onSend} disabled={true} />)
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    expect(onSend).not.toHaveBeenCalled()
  })

  it('does not call onSend when disabled (Enter key)', () => {
    const onSend = vi.fn()
    const { rerender } = render(<ChatInput onSend={onSend} disabled={false} />)
    const input = screen.getByPlaceholderText('Type a question...')
    fireEvent.change(input, { target: { value: 'hello' } })
    rerender(<ChatInput onSend={onSend} disabled={true} />)
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onSend).not.toHaveBeenCalled()
  })

  it('send button is disabled when input is empty', () => {
    render(<ChatInput onSend={vi.fn()} disabled={false} />)
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled()
  })

  it('send button is disabled when input is whitespace only', () => {
    render(<ChatInput onSend={vi.fn()} disabled={false} />)
    fireEvent.change(screen.getByPlaceholderText('Type a question...'), {
      target: { value: '   ' },
    })
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled()
  })

  it('send button becomes enabled when input has text', () => {
    render(<ChatInput onSend={vi.fn()} disabled={false} />)
    fireEvent.change(screen.getByPlaceholderText('Type a question...'), {
      target: { value: 'hi' },
    })
    expect(screen.getByRole('button', { name: 'Send' })).not.toBeDisabled()
  })

  it('renders a textarea (not a text input)', () => {
    render(<ChatInput onSend={vi.fn()} disabled={false} />)
    const el = screen.getByPlaceholderText('Type a question...')
    expect(el.tagName).toBe('TEXTAREA')
  })

  it('does not show character count below threshold', () => {
    render(<ChatInput onSend={vi.fn()} disabled={false} />)
    fireEvent.change(screen.getByPlaceholderText('Type a question...'), {
      target: { value: 'short message' },
    })
    expect(screen.queryByText(/\/1000/)).not.toBeInTheDocument()
  })

  it('shows character count at 900+ characters', () => {
    render(<ChatInput onSend={vi.fn()} disabled={false} />)
    const longText = 'a'.repeat(950)
    fireEvent.change(screen.getByPlaceholderText('Type a question...'), {
      target: { value: longText },
    })
    expect(screen.getByText('950/1000')).toBeInTheDocument()
  })

  it('send button has accessible aria-label', () => {
    render(<ChatInput onSend={vi.fn()} disabled={false} />)
    const btn = screen.getByRole('button', { name: 'Send' })
    expect(btn).toHaveAttribute('aria-label', 'Send')
  })

  it('allows Shift+Enter without sending (multiline support)', () => {
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} disabled={false} />)
    const textarea = screen.getByPlaceholderText('Type a question...')
    fireEvent.change(textarea, { target: { value: 'line one' } })
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true })
    expect(onSend).not.toHaveBeenCalled()
  })
})
