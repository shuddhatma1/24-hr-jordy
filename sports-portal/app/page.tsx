import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Sports Chatbot Portal — Launch an AI Stats Chatbot for Your League',
  description: 'Configure and deploy an AI sports stats chatbot in under 5 minutes. No engineering required.',
}

const steps = [
  {
    number: '1',
    title: 'Create your bot',
    description: 'Pick your sport and league. Your AI chatbot is ready in seconds.',
  },
  {
    number: '2',
    title: 'Add your knowledge',
    description: 'Upload FAQs, documents, and custom content so your bot knows your league inside out.',
  },
  {
    number: '3',
    title: 'Share with fans',
    description: 'Send a link or embed the chat widget on your website. Fans start chatting instantly.',
  },
]

const features = [
  {
    title: 'Instant answers',
    description:
      'Powered by AI with real-time Google Search grounding. Fans get accurate, up-to-date stats and scores in seconds.',
  },
  {
    title: 'Custom knowledge',
    description:
      'Add FAQs, upload PDFs and CSVs — your bot learns your league-specific info and answers questions about it.',
  },
  {
    title: 'Embed anywhere',
    description:
      'Drop a single script tag on your website to add a floating chat widget. Works on any site, any device.',
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip to content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Skip to content
      </a>

      {/* Nav */}
      <header className="bg-white border-b border-gray-200">
        <nav aria-label="Main" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <span className="text-lg font-semibold text-gray-900">
            Sports Chatbot Portal
          </span>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Get started free
            </Link>
          </div>
        </nav>
      </header>

      <main id="main-content">
        {/* Hero */}
        <section aria-labelledby="hero-heading" className="bg-gray-50 py-20 sm:py-28">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 id="hero-heading" className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              Launch an AI Stats Chatbot for Your League
            </h1>
            <p className="mt-6 text-lg text-gray-500 leading-relaxed max-w-2xl mx-auto">
              Let fans ask questions and get instant, conversational answers — powered by AI.
              Set up in under 5 minutes, no engineering required.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/signup"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Get started free
              </Link>
              <Link
                href="/login"
                className="px-6 py-3 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Log in
              </Link>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section aria-labelledby="how-it-works-heading" className="bg-white py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 id="how-it-works-heading" className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">
              How it works
            </h2>
            <p className="mt-3 text-gray-500 text-center max-w-xl mx-auto">
              Go from sign-up to a live chatbot in three simple steps.
            </p>
            <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-10">
              {steps.map((step) => (
                <div key={step.number} className="text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-bold">
                    {step.number}
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-gray-900">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature highlights */}
        <section aria-labelledby="features-heading" className="bg-gray-50 py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 id="features-heading" className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">
              Everything you need
            </h2>
            <p className="mt-3 text-gray-500 text-center max-w-xl mx-auto">
              A fully configured AI chatbot — no engineering team required.
            </p>
            <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="bg-white border border-gray-200 rounded-xl p-6"
                >
                  <h3 className="text-lg font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm text-gray-500 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section aria-labelledby="cta-heading" className="bg-white py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 id="cta-heading" className="text-2xl sm:text-3xl font-bold text-gray-900">
              Ready to launch your chatbot?
            </h2>
            <p className="mt-3 text-gray-500">
              Free to set up. Live in minutes.
            </p>
            <div className="mt-8">
              <Link
                href="/signup"
                className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Get started free
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-8">
        <p className="text-center text-xs text-gray-400">
          Sports Chatbot Portal — built for league owners and team operators.
        </p>
      </footer>
    </div>
  )
}
