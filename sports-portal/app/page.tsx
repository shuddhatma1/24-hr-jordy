import type { Metadata } from 'next'
import Link from 'next/link'
import StickyNav from '@/components/landing/StickyNav'
import ScrollReveal from '@/components/landing/ScrollReveal'
import AnimatedCounter from '@/components/landing/AnimatedCounter'

export const metadata: Metadata = {
  title: 'Sports Chatbot Portal — Launch an AI Stats Chatbot for Your League',
  description: 'Configure and deploy an AI sports stats chatbot in under 5 minutes. No engineering required.',
}

const steps = [
  {
    number: '1',
    title: 'Create your bot',
    description: 'Pick your sport and league. Your AI chatbot is ready in seconds.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    number: '2',
    title: 'Add your knowledge',
    description: 'Upload FAQs, documents, and custom content so your bot knows your league inside out.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 19l7-7 3 3-7 7-3-3z" />
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
        <path d="M2 2l7.586 7.586" />
        <circle cx="11" cy="11" r="2" />
      </svg>
    ),
  },
  {
    number: '3',
    title: 'Share with fans',
    description: 'Send a link or embed the chat widget on your website. Fans start chatting instantly.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
    ),
  },
]

const features = [
  {
    title: 'Instant answers',
    description:
      'Powered by AI with real-time Google Search grounding. Fans get accurate, up-to-date stats and scores in seconds.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    title: 'Custom knowledge',
    description:
      'Add FAQs, upload PDFs and CSVs — your bot learns your league-specific info and answers questions about it.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    title: 'Embed anywhere',
    description:
      'Drop a single script tag on your website to add a floating chat widget. Works on any site, any device.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
]

const stats = [
  { value: 500, suffix: '+', label: 'Bots created' },
  { value: 10000, suffix: '+', label: 'Messages sent' },
  { value: 5, suffix: ' min', label: 'Avg setup time' },
]

const footerColumns = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Get started', href: '/signup' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '#' },
      { label: 'API Reference', href: '#' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '#' },
      { label: 'Terms', href: '#' },
    ],
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Skip to content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Skip to content
      </a>

      {/* Nav */}
      <StickyNav />

      <main id="main-content">
        {/* Hero */}
        <section aria-labelledby="hero-heading" className="relative overflow-hidden gradient-hero py-20 sm:py-28 lg:py-32">
          <div className="absolute inset-0 bg-dot-pattern" aria-hidden="true" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left column */}
              <div>
                <div
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-brand-50 border border-brand-200 text-brand-700 animate-fade-in"
                >
                  Set up in 5 minutes
                </div>
                <h1
                  id="hero-heading"
                  className="mt-6 text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 leading-tight animate-slide-up"
                >
                  Launch an <span className="gradient-text">AI Stats Chatbot</span> for Your League
                </h1>
                <p
                  className="mt-6 text-lg text-neutral-500 leading-relaxed max-w-xl animate-slide-up"
                  style={{ animationDelay: '100ms' }}
                >
                  Let fans ask questions and get instant, conversational answers — powered by AI.
                  Set up in under 5 minutes, no engineering required.
                </p>
                <div
                  className="mt-10 flex flex-col sm:flex-row gap-3 animate-slide-up"
                  style={{ animationDelay: '200ms' }}
                >
                  <Link
                    href="/signup"
                    className="px-6 py-3 gradient-primary text-white rounded-lg hover:opacity-90 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 shadow-glow"
                  >
                    Get started free
                  </Link>
                  <Link
                    href="/login"
                    className="px-6 py-3 bg-white text-neutral-700 rounded-lg border border-neutral-300 hover:bg-neutral-50 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                  >
                    Log in
                  </Link>
                </div>
              </div>

              {/* Right column — chat mockup */}
              <div className="hidden lg:block" aria-hidden="true">
                <div className="relative">
                  {/* Glow background */}
                  <div className="absolute -inset-4 bg-gradient-to-r from-brand-400/20 to-accent-400/20 blur-2xl rounded-3xl" />
                  {/* Chat card */}
                  <div className="relative bg-white rounded-2xl shadow-card border border-neutral-200/50 overflow-hidden animate-scale-in" style={{ animationDelay: '300ms' }}>
                    {/* Bot header */}
                    <div className="gradient-primary px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-white font-semibold text-sm">Premier League Bot</p>
                          <p className="text-white/70 text-xs">Online</p>
                        </div>
                      </div>
                    </div>
                    {/* Messages */}
                    <div className="px-5 py-4 space-y-3">
                      <div className="flex justify-start">
                        <div className="bg-neutral-100 rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-[80%]">
                          <p className="text-sm text-neutral-700">Hi! Ask me anything about the Premier League.</p>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <div className="gradient-primary rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[80%]">
                          <p className="text-sm text-white">Who won the last match?</p>
                        </div>
                      </div>
                      <div className="flex justify-start items-end gap-2">
                        <div className="bg-neutral-100 rounded-2xl rounded-bl-sm px-4 py-3">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce-dot" />
                            <span className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce-dot" style={{ animationDelay: '0.2s' }} />
                            <span className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce-dot" style={{ animationDelay: '0.4s' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats bar */}
        <section aria-label="Statistics" className="bg-gradient-to-r from-neutral-50 via-brand-50/30 to-neutral-50 border-y border-neutral-200/50 py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="text-3xl sm:text-4xl font-bold text-neutral-900">
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="mt-1 text-sm text-neutral-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section aria-labelledby="how-it-works-heading" id="how-it-works" className="bg-white py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <h2 id="how-it-works-heading" className="text-2xl sm:text-3xl font-bold text-neutral-900 text-center">
                How it works
              </h2>
              <p className="mt-3 text-neutral-500 text-center max-w-xl mx-auto">
                Go from sign-up to a live chatbot in three simple steps.
              </p>
            </ScrollReveal>
            <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-10">
              {steps.map((step, i) => (
                <ScrollReveal key={step.number} delay={i * 150}>
                  <div className="group text-center">
                    <div className="mx-auto w-14 h-14 rounded-2xl gradient-primary text-white flex items-center justify-center shadow-glow group-hover:-translate-y-1 transition-transform duration-200">
                      {step.icon}
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-neutral-900">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm text-neutral-500 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Feature highlights */}
        <section aria-labelledby="features-heading" id="features" className="bg-neutral-50 py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <h2 id="features-heading" className="text-2xl sm:text-3xl font-bold text-neutral-900 text-center">
                Everything you need
              </h2>
              <p className="mt-3 text-neutral-500 text-center max-w-xl mx-auto">
                A fully configured AI chatbot — no engineering team required.
              </p>
            </ScrollReveal>
            <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, i) => (
                <ScrollReveal
                  key={feature.title}
                  delay={i * 100}
                  className={i === 0 ? 'md:row-span-2' : ''}
                >
                  <div className={`bg-white rounded-2xl shadow-soft hover:shadow-card hover:ring-2 hover:ring-brand-500/10 transition-all duration-200 h-full ${i === 0 ? 'p-8' : 'p-6'}`}>
                    <div className={`gradient-primary text-white rounded-xl flex items-center justify-center ${i === 0 ? 'w-12 h-12' : 'w-10 h-10'}`}>
                      {feature.icon}
                    </div>
                    <h3 className={`mt-4 font-semibold text-neutral-900 ${i === 0 ? 'text-xl' : 'text-lg'}`}>
                      {feature.title}
                    </h3>
                    <p className={`mt-3 text-neutral-500 leading-relaxed ${i === 0 ? 'text-base' : 'text-sm'}`}>
                      {feature.description}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section aria-labelledby="cta-heading" className="gradient-primary py-20 overflow-hidden relative">
          <div className="absolute inset-0 bg-radial-glow" aria-hidden="true" />
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <ScrollReveal>
              <h2 id="cta-heading" className="text-2xl sm:text-3xl font-bold text-white">
                Ready to launch your chatbot?
              </h2>
              <p className="mt-3 text-white/80">
                Free to set up. Live in minutes.
              </p>
              <div className="mt-8">
                <Link
                  href="/signup"
                  className="inline-block px-8 py-3 bg-white text-brand-600 rounded-xl shadow-card hover:bg-neutral-50 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-600"
                >
                  Get started free
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-neutral-50 border-t border-neutral-200/50 pt-12 pb-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Brand column */}
            <div className="col-span-2 md:col-span-1">
              <span className="text-lg font-bold text-neutral-900">Sports Chatbot Portal</span>
              <p className="mt-2 text-sm text-neutral-500 leading-relaxed">
                AI-powered chatbots for sports leagues. Set up in minutes, no engineering required.
              </p>
            </div>
            {/* Link columns */}
            {footerColumns.map((col) => (
              <div key={col.title}>
                <h3 className="text-sm font-semibold text-neutral-900">{col.title}</h3>
                <ul className="mt-3 space-y-2">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 pt-6 border-t border-neutral-200/50">
            <p className="text-center text-xs text-neutral-400">
              Sports Chatbot Portal — built for league owners and team operators.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
