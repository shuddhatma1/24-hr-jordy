// @vitest-environment jsdom

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ChatPreview from '../ChatPreview'

describe('ChatPreview', () => {
  it('renders the bot name in the header', () => {
    render(
      <ChatPreview botName="City FC Bot" welcomeMessage="" primaryColor="" persona="" />
    )
    expect(screen.getByText('City FC Bot')).toBeInTheDocument()
  })

  it('shows fallback name when botName is empty', () => {
    render(
      <ChatPreview botName="" welcomeMessage="" primaryColor="" persona="" />
    )
    expect(screen.getByText('Your Bot')).toBeInTheDocument()
  })

  it('shows welcome message when provided', () => {
    render(
      <ChatPreview
        botName="Bot"
        welcomeMessage="Hello fans!"
        primaryColor=""
        persona=""
      />
    )
    expect(screen.getByText('Hello fans!')).toBeInTheDocument()
  })

  it('shows fallback welcome message when empty', () => {
    render(
      <ChatPreview botName="Bot" welcomeMessage="" primaryColor="" persona="" />
    )
    expect(screen.getByText('Hi! Ask me anything.')).toBeInTheDocument()
  })

  it('applies custom primary color to the header', () => {
    const { container } = render(
      <ChatPreview
        botName="Bot"
        welcomeMessage=""
        primaryColor="#dc2626"
        persona=""
      />
    )
    // The header div should have the background color applied
    const header = container.querySelector('[style*="background-color"]')
    expect(header).toBeTruthy()
  })

  it('shows friendly persona response', () => {
    render(
      <ChatPreview botName="Bot" welcomeMessage="" primaryColor="" persona="friendly" />
    )
    expect(screen.getByText('Great question! Let me check...')).toBeInTheDocument()
  })

  it('shows professional persona response', () => {
    render(
      <ChatPreview botName="Bot" welcomeMessage="" primaryColor="" persona="professional" />
    )
    expect(screen.getByText('Let me look that up for you.')).toBeInTheDocument()
  })

  it('shows enthusiastic persona response', () => {
    render(
      <ChatPreview botName="Bot" welcomeMessage="" primaryColor="" persona="enthusiastic" />
    )
    expect(screen.getByText('Ooh, great question!!')).toBeInTheDocument()
  })

  it('renders the user message', () => {
    render(
      <ChatPreview botName="Bot" welcomeMessage="" primaryColor="" persona="" />
    )
    expect(screen.getByText('Who won last night?')).toBeInTheDocument()
  })
})
