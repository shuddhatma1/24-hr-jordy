'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function StickyNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 border-b backdrop-blur-xl ${
        scrolled
          ? 'bg-white/90 border-neutral-200/50 shadow-soft'
          : 'bg-white/70 border-white/20'
      }`}
    >
      <nav
        aria-label="Main"
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between"
      >
        <Link href="/">
          <span className="text-lg font-bold text-neutral-900">
            Sports Chatbot Portal
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 gradient-primary text-white rounded-lg hover:opacity-90 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            Get started free
          </Link>
        </div>
      </nav>
    </header>
  )
}
