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
    const links = screen.getAllByRole('link', { name: /get started free/i })
    expect(links[0]).toHaveAttribute('href', '/signup')
  })

  it('renders a Log In link to /login', () => {
    render(<Home />)
    const link = screen.getAllByRole('link', { name: /log in/i })[0]
    expect(link).toHaveAttribute('href', '/login')
  })

  it('renders the nav bar with logo text', () => {
    render(<Home />)
    expect(screen.getByText('Sports Chatbot Portal')).toBeInTheDocument()
  })

  it('renders the "How it works" section', () => {
    render(<Home />)
    expect(screen.getByRole('heading', { name: /how it works/i })).toBeInTheDocument()
  })

  it('renders 3 steps in how-it-works', () => {
    render(<Home />)
    expect(screen.getByText('Create your bot')).toBeInTheDocument()
    expect(screen.getByText('Add your knowledge')).toBeInTheDocument()
    expect(screen.getByText('Share with fans')).toBeInTheDocument()
  })

  it('renders the "Everything you need" section', () => {
    render(<Home />)
    expect(screen.getByRole('heading', { name: /everything you need/i })).toBeInTheDocument()
  })

  it('renders 3 feature cards', () => {
    render(<Home />)
    expect(screen.getByText('Instant answers')).toBeInTheDocument()
    expect(screen.getByText('Custom knowledge')).toBeInTheDocument()
    expect(screen.getByText('Embed anywhere')).toBeInTheDocument()
  })

  it('renders the bottom CTA with link to /signup', () => {
    render(<Home />)
    expect(screen.getByRole('heading', { name: /ready to launch/i })).toBeInTheDocument()
    // The bottom CTA is the last "Get started free" link
    const links = screen.getAllByRole('link', { name: /get started free/i })
    expect(links[links.length - 1]).toHaveAttribute('href', '/signup')
  })

  it('renders the footer', () => {
    render(<Home />)
    expect(
      screen.getByText(/built for league owners and team operators/i)
    ).toBeInTheDocument()
  })
})
