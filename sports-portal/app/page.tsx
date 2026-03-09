import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Sports Chatbot Portal — Launch an AI Stats Chatbot for Your League',
  description: 'Configure and deploy an AI sports stats chatbot in under 5 minutes. No engineering required.',
}

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
          Launch an AI Stats Chatbot for Your League
        </h1>
        <p className="text-lg text-gray-500 mb-8 leading-relaxed">
          Let fans ask questions and get instant, conversational answers — powered by AI.
          Set up in under 5 minutes, no engineering required.
        </p>
        <ul className="mb-10 space-y-2 text-left inline-block">
          {[
            'Pick your sport and league',
            'Get a hosted URL to share with fans',
            'Fans chat instantly — no login needed',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
              <span className="text-blue-600 font-bold mt-0.5">✓</span>
              {item}
            </li>
          ))}
        </ul>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
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
        <p className="mt-10 text-xs text-gray-400">
          Sports Chatbot Portal — built for league owners and team operators.
        </p>
      </div>
    </main>
  )
}
