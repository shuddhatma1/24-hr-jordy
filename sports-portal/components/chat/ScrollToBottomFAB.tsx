'use client'

import { ChevronDown } from 'lucide-react'

interface Props {
  visible: boolean
  onClick: () => void
}

export default function ScrollToBottomFAB({ visible, onClick }: Props) {
  if (!visible) return null

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Scroll to latest messages"
      className="absolute -top-14 right-4 w-10 h-10 rounded-full bg-white shadow-card border border-neutral-200 flex items-center justify-center text-neutral-500 hover:text-brand-600 hover:shadow-glow transition-all animate-scale-in"
    >
      <ChevronDown size={20} />
    </button>
  )
}
