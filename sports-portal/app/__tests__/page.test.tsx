// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import Home from '../page'

describe('Landing page', () => {
  it('renders the headline', () => {
    render(<Home />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Launch an AI Stats Chatbot for Your League'
    )
  })

  it('renders a skip-to-content link', () => {
    render(<Home />)
    const skip = screen.getByText('Skip to content')
    expect(skip).toHaveAttribute('href', '#main-content')
  })

  describe('nav bar', () => {
    it('renders logo text', () => {
      render(<Home />)
      expect(screen.getByText('Sports Chatbot Portal')).toBeInTheDocument()
    })

    it('renders Log in and Get started links', () => {
      render(<Home />)
      const nav = screen.getByRole('navigation', { name: /main/i })
      expect(within(nav).getByRole('link', { name: /log in/i })).toHaveAttribute('href', '/login')
      expect(within(nav).getByRole('link', { name: /get started free/i })).toHaveAttribute('href', '/signup')
    })
  })

  describe('hero section', () => {
    it('renders Sign Up and Log In links', () => {
      render(<Home />)
      const hero = screen.getByRole('region', { name: /launch an ai stats chatbot/i })
      expect(within(hero).getByRole('link', { name: /get started free/i })).toHaveAttribute('href', '/signup')
      expect(within(hero).getByRole('link', { name: /log in/i })).toHaveAttribute('href', '/login')
    })
  })

  describe('how it works section', () => {
    it('renders the heading', () => {
      render(<Home />)
      expect(screen.getByRole('heading', { name: /how it works/i })).toBeInTheDocument()
    })

    it('renders 3 steps', () => {
      render(<Home />)
      const section = screen.getByRole('region', { name: /how it works/i })
      expect(within(section).getByText('Create your bot')).toBeInTheDocument()
      expect(within(section).getByText('Add your knowledge')).toBeInTheDocument()
      expect(within(section).getByText('Share with fans')).toBeInTheDocument()
    })
  })

  describe('features section', () => {
    it('renders the heading', () => {
      render(<Home />)
      expect(screen.getByRole('heading', { name: /everything you need/i })).toBeInTheDocument()
    })

    it('renders 3 feature cards', () => {
      render(<Home />)
      const section = screen.getByRole('region', { name: /everything you need/i })
      expect(within(section).getByText('Instant answers')).toBeInTheDocument()
      expect(within(section).getByText('Custom knowledge')).toBeInTheDocument()
      expect(within(section).getByText('Embed anywhere')).toBeInTheDocument()
    })
  })

  describe('bottom CTA section', () => {
    it('renders heading and link to /signup', () => {
      render(<Home />)
      const section = screen.getByRole('region', { name: /ready to launch/i })
      expect(within(section).getByRole('heading', { name: /ready to launch/i })).toBeInTheDocument()
      expect(within(section).getByRole('link', { name: /get started free/i })).toHaveAttribute('href', '/signup')
    })
  })

  it('renders the footer inside a footer element', () => {
    render(<Home />)
    const footer = screen.getByRole('contentinfo')
    expect(within(footer).getByText(/built for league owners and team operators/i)).toBeInTheDocument()
  })
})
