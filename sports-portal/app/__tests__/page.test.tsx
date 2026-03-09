// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Home from '../page'

describe('Landing page', () => {
  it('renders the headline', () => {
    render(<Home />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Launch an AI Stats Chatbot for Your League'
    )
  })

  it('renders a Sign Up link to /signup', () => {
    render(<Home />)
    const link = screen.getByRole('link', { name: /get started free/i })
    expect(link).toHaveAttribute('href', '/signup')
  })

  it('renders a Log In link to /login', () => {
    render(<Home />)
    const link = screen.getByRole('link', { name: /log in/i })
    expect(link).toHaveAttribute('href', '/login')
  })
})
