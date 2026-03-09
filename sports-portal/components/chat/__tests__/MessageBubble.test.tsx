// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MessageBubble from '../MessageBubble'

describe('MessageBubble', () => {
  it('renders the message content', () => {
    render(<MessageBubble role="bot" content="Hello world" />)
    expect(screen.getByText('Hello world')).toBeInTheDocument()
  })

  it('aligns user messages to the right', () => {
    const { container } = render(<MessageBubble role="user" content="Hi" />)
    expect(container.firstChild).toHaveClass('justify-end')
  })

  it('aligns bot messages to the left', () => {
    const { container } = render(<MessageBubble role="bot" content="Hi" />)
    expect(container.firstChild).toHaveClass('justify-start')
  })

  it('applies blue background for user messages', () => {
    render(<MessageBubble role="user" content="Hi" />)
    expect(screen.getByTestId('message-bubble')).toHaveClass('bg-blue-600')
  })

  it('applies gray background for bot messages', () => {
    render(<MessageBubble role="bot" content="Hi" />)
    expect(screen.getByTestId('message-bubble')).toHaveClass('bg-gray-100')
  })

  it('applies white text for user messages', () => {
    render(<MessageBubble role="user" content="Hi" />)
    expect(screen.getByTestId('message-bubble')).toHaveClass('text-white')
  })

  it('applies dark text for bot messages', () => {
    render(<MessageBubble role="bot" content="Hi" />)
    expect(screen.getByTestId('message-bubble')).toHaveClass('text-gray-900')
  })

  it('shows streaming cursor when isStreaming is true', () => {
    render(<MessageBubble role="bot" content="Typing..." isStreaming />)
    expect(screen.getByText('▌')).toBeInTheDocument()
  })

  it('does not show streaming cursor when isStreaming is false', () => {
    render(<MessageBubble role="bot" content="Done" isStreaming={false} />)
    expect(screen.queryByText('▌')).not.toBeInTheDocument()
  })

  it('does not show streaming cursor by default', () => {
    render(<MessageBubble role="bot" content="Done" />)
    expect(screen.queryByText('▌')).not.toBeInTheDocument()
  })

  it('renders with empty content and shows cursor when streaming', () => {
    render(<MessageBubble role="bot" content="" isStreaming />)
    expect(screen.getByText('▌')).toBeInTheDocument()
  })

  it('does not render cursor on user messages when isStreaming is false', () => {
    render(<MessageBubble role="user" content="Hi" isStreaming={false} />)
    expect(screen.queryByText('▌')).not.toBeInTheDocument()
  })
})
