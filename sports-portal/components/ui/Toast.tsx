'use client'

interface ToastProps {
  type: 'success' | 'error'
  message: string
  onClose: () => void
}

export function Toast({ type, message, onClose }: ToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg text-sm font-medium ${
        type === 'success'
          ? 'bg-green-50 border-green-200 text-green-800'
          : 'bg-red-50 border-red-200 text-red-800'
      }`}
    >
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-2 rounded p-0.5 hover:bg-black/10 transition-colors"
        aria-label="Dismiss"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  )
}
