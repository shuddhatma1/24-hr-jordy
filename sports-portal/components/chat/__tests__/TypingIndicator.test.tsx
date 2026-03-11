// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import TypingIndicator from '../TypingIndicator'

describe('TypingIndicator', () => {
  it('renders three dot elements', () => {
    const { container } = render(<TypingIndicator />)
    const dots = container.querySelectorAll('.rounded-full.bg-neutral-400')
    expect(dots).toHaveLength(3)
  })

  it('has bounce-dot animation class on dots', () => {
    const { container } = render(<TypingIndicator />)
    const dots = container.querySelectorAll('.animate-bounce-dot')
    expect(dots).toHaveLength(3)
  })

  it('has staggered animation delays', () => {
    const { container } = render(<TypingIndicator />)
    const dots = container.querySelectorAll('.animate-bounce-dot')
    expect((dots[0] as HTMLElement).style.animationDelay).toBe('0s')
    expect((dots[1] as HTMLElement).style.animationDelay).toBe('0.15s')
    expect((dots[2] as HTMLElement).style.animationDelay).toBe('0.3s')
  })
})
