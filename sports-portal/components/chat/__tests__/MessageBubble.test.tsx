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

  it('applies gradient background for user messages', () => {
    render(<MessageBubble role="user" content="Hi" />)
    expect(screen.getByTestId('message-bubble')).toHaveClass('from-brand-500')
  })

  it('applies neutral background for bot messages', () => {
    render(<MessageBubble role="bot" content="Hi" />)
    expect(screen.getByTestId('message-bubble')).toHaveClass('bg-neutral-100')
  })

  it('applies white text for user messages', () => {
    render(<MessageBubble role="user" content="Hi" />)
    expect(screen.getByTestId('message-bubble')).toHaveClass('text-white')
  })

  it('applies neutral text for bot messages', () => {
    render(<MessageBubble role="bot" content="Hi" />)
    expect(screen.getByTestId('message-bubble')).toHaveClass('text-neutral-900')
  })

  it('renders markdown bold in bot messages', () => {
    render(<MessageBubble role="bot" content="This is **bold** text" />)
    const strong = screen.getByText('bold')
    expect(strong.tagName).toBe('STRONG')
  })

  it('does not render markdown in user messages', () => {
    render(<MessageBubble role="user" content="This is **bold** text" />)
    expect(screen.getByText('This is **bold** text')).toBeInTheDocument()
    expect(screen.queryByText('bold')).toBeNull()
  })

  it('shows bot avatar when showAvatar is true', () => {
    render(<MessageBubble role="bot" content="Hi" botName="City Bot" showAvatar />)
    expect(screen.getByText('C')).toBeInTheDocument()
  })

  it('hides avatar (renders spacer) when showAvatar is false', () => {
    const { container } = render(
      <MessageBubble role="bot" content="Hi" botName="City Bot" showAvatar={false} />
    )
    // Should have a spacer div (w-7 flex-shrink-0) instead of avatar
    const spacer = container.querySelector('.w-7.flex-shrink-0')
    expect(spacer).toBeInTheDocument()
    // Should not render the avatar letter
    expect(screen.queryByText('C')).not.toBeInTheDocument()
  })

  it('uses first letter of botName for avatar', () => {
    render(<MessageBubble role="bot" content="Hi" botName="Test Bot" showAvatar />)
    expect(screen.getByText('T')).toBeInTheDocument()
  })
})
