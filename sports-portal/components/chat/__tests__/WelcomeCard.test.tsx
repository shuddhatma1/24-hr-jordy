// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import WelcomeCard from '../WelcomeCard'

describe('WelcomeCard', () => {
  it('renders the bot name', () => {
    render(
      <WelcomeCard botName="City FC Bot" sport="soccer" onChipClick={vi.fn()} />
    )
    expect(screen.getByText('City FC Bot')).toBeInTheDocument()
  })

  it('renders the welcome message when provided', () => {
    render(
      <WelcomeCard
        botName="Bot"
        sport="soccer"
        welcomeMessage="Welcome to the chat!"
        onChipClick={vi.fn()}
      />
    )
    expect(screen.getByText('Welcome to the chat!')).toBeInTheDocument()
  })

  it('renders default message when no welcome message provided', () => {
    render(
      <WelcomeCard botName="Bot" sport="soccer" onChipClick={vi.fn()} />
    )
    expect(
      screen.getByText("Ask me anything — I'm here to help!")
    ).toBeInTheDocument()
  })

  it('renders suggested question chips for soccer', () => {
    render(
      <WelcomeCard botName="Bot" sport="soccer" onChipClick={vi.fn()} />
    )
    expect(screen.getByText('Who won last night?')).toBeInTheDocument()
    expect(screen.getByText('League standings')).toBeInTheDocument()
    expect(screen.getByText('Top scorers')).toBeInTheDocument()
  })

  it('renders suggested question chips for basketball', () => {
    render(
      <WelcomeCard botName="Bot" sport="basketball" onChipClick={vi.fn()} />
    )
    expect(screen.getByText("Last night's scores?")).toBeInTheDocument()
    expect(screen.getByText('Standings')).toBeInTheDocument()
    expect(screen.getByText('Top performers')).toBeInTheDocument()
  })

  it('calls onChipClick with the question text when a chip is clicked', () => {
    const onChipClick = vi.fn()
    render(
      <WelcomeCard botName="Bot" sport="soccer" onChipClick={onChipClick} />
    )
    fireEvent.click(screen.getByText('Who won last night?'))
    expect(onChipClick).toHaveBeenCalledWith('Who won last night?')
  })

  it('renders the sport emoji for soccer', () => {
    const { container } = render(
      <WelcomeCard botName="Bot" sport="soccer" onChipClick={vi.fn()} />
    )
    expect(container.textContent).toContain('⚽')
  })

  it('renders a fallback emoji for unknown sport', () => {
    const { container } = render(
      <WelcomeCard botName="Bot" sport="cricket" onChipClick={vi.fn()} />
    )
    expect(container.textContent).toContain('🏆')
  })
})
