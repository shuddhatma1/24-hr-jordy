'use client'

import { useEffect, useRef, useState } from 'react'
import { Toast } from '@/components/ui/Toast'

interface DataSourceEntry {
  id: string
  type: 'faq' | 'file'
  title: string
  content: string
  file_size: number | null
  original_filename: string | null
  created_at: string
}

type ToastState = { id: string; type: 'success' | 'error'; message: string } | null
type PageStatus = 'loading' | 'noBotFound' | 'fetchError' | 'loaded'
type ActiveTab = 'faq' | 'files'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const MAX_CLIENT_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.csv', '.txt'])

export default function DataSourcesPage() {
  const [status, setStatus] = useState<PageStatus>('loading')
  const [activeTab, setActiveTab] = useState<ActiveTab>('faq')
  const [entries, setEntries] = useState<DataSourceEntry[]>([])
  const [toast, setToast] = useState<ToastState>(null)

  // FAQ form
  const [faqTitle, setFaqTitle] = useState('')
  const [faqContent, setFaqContent] = useState('')
  const [faqTitleError, setFaqTitleError] = useState('')
  const [faqContentError, setFaqContentError] = useState('')
  const [isAddingFaq, setIsAddingFaq] = useState(false)

  // File upload
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Deleting
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())

  // Toast timer
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [])

  function showToast(type: 'success' | 'error', message: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ id: crypto.randomUUID(), type, message })
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }

  // Initial load
  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/data-sources', { signal: controller.signal })
      .then((res) => {
        if (res.status === 404) {
          setStatus('noBotFound')
          return
        }
        if (!res.ok) {
          setStatus('fetchError')
          return
        }
        return res.json()
      })
      .then((data) => {
        if (data) {
          setEntries(data)
          setStatus('loaded')
        }
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setStatus('fetchError')
      })
    return () => controller.abort()
  }, [])

  async function handleAddFaq(e: React.FormEvent) {
    e.preventDefault()
    if (isAddingFaq) return
    setFaqTitleError('')
    setFaqContentError('')

    let valid = true
    if (!faqTitle.trim()) {
      setFaqTitleError('Title is required')
      valid = false
    }
    if (!faqContent.trim()) {
      setFaqContentError('Content is required')
      valid = false
    }
    if (!valid) return

    setIsAddingFaq(true)
    try {
      const res = await fetch('/api/data-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: faqTitle, content: faqContent }),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast('error', data.error ?? 'Failed to add entry')
        return
      }
      setEntries((prev) => [data, ...prev])
      setFaqTitle('')
      setFaqContent('')
      showToast('success', 'FAQ entry added')
    } catch {
      showToast('error', 'Failed to add entry')
    } finally {
      setIsAddingFaq(false)
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const lastDot = file.name.lastIndexOf('.')
    const ext = lastDot !== -1 ? file.name.slice(lastDot).toLowerCase() : ''
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      showToast('error', 'Only PDF, CSV, and TXT files are supported')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    if (file.size > MAX_CLIENT_FILE_SIZE) {
      showToast('error', 'File must be 5MB or less')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/data-sources/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        showToast('error', data.error ?? 'Upload failed')
        return
      }
      setEntries((prev) => [data, ...prev])
      setActiveTab('files')
      showToast('success', 'File uploaded and processed')
    } catch {
      showToast('error', 'Upload failed')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDelete(id: string) {
    setDeletingIds((prev) => new Set(prev).add(id))
    try {
      const res = await fetch(`/api/data-sources/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        showToast('error', data.error ?? 'Failed to delete')
        return
      }
      setEntries((prev) => prev.filter((e) => e.id !== id))
      showToast('success', 'Deleted')
    } catch {
      showToast('error', 'Failed to delete')
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const faqEntries = entries.filter((e) => e.type === 'faq')
  const fileEntries = entries.filter((e) => e.type === 'file')

  if (status === 'loading') {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (status === 'noBotFound') {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="text-amber-800 font-medium">No chatbot found</p>
          <p className="text-amber-700 text-sm mt-1">
            Create your bot first before adding knowledge entries.
          </p>
        </div>
      </div>
    )
  }

  if (status === 'fetchError') {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-800 font-medium">Failed to load knowledge base</p>
          <p className="text-red-700 text-sm mt-1">Please refresh the page and try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
        <p className="text-gray-500 text-sm mt-1">
          Add FAQ answers and upload files your bot can reference when talking to fans.
        </p>
      </div>

      {/* Tab bar */}
      <div role="tablist" className="flex gap-1 border-b border-gray-200">
        <button
          role="tab"
          aria-selected={activeTab === 'faq'}
          onClick={() => setActiveTab('faq')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'faq'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          FAQ Entries
          {faqEntries.length > 0 && (
            <span className="ml-2 rounded-full bg-blue-100 text-blue-700 text-xs px-2 py-0.5">
              {faqEntries.length}
            </span>
          )}
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'files'}
          onClick={() => setActiveTab('files')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'files'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Uploaded Files
          {fileEntries.length > 0 && (
            <span className="ml-2 rounded-full bg-blue-100 text-blue-700 text-xs px-2 py-0.5">
              {fileEntries.length}
            </span>
          )}
        </button>
      </div>

      {/* FAQ tab */}
      {activeTab === 'faq' && (
        <section className="space-y-4">
          <form
            onSubmit={handleAddFaq}
            className="rounded-lg border border-gray-200 bg-white p-4 space-y-3"
          >
            <h2 className="text-sm font-semibold text-gray-700">Add FAQ entry</h2>
            <div>
              <label
                htmlFor="faq-title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Title
              </label>
              <input
                id="faq-title"
                type="text"
                value={faqTitle}
                onChange={(e) => {
                  setFaqTitle(e.target.value)
                  if (faqTitleError) setFaqTitleError('')
                }}
                placeholder="e.g. How do I buy tickets?"
                maxLength={200}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {faqTitleError && (
                <p role="alert" className="text-red-600 text-xs mt-1">
                  {faqTitleError}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="faq-content"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Answer / Content
              </label>
              <textarea
                id="faq-content"
                value={faqContent}
                onChange={(e) => {
                  setFaqContent(e.target.value)
                  if (faqContentError) setFaqContentError('')
                }}
                placeholder="Write the answer your bot should give..."
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
              {faqContentError && (
                <p role="alert" className="text-red-600 text-xs mt-1">
                  {faqContentError}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={isAddingFaq}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isAddingFaq ? 'Adding...' : 'Add entry'}
            </button>
          </form>

          {faqEntries.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">
              No FAQ entries yet. Add one above.
            </p>
          ) : (
            <ul className="space-y-2">
              {faqEntries.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{entry.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{entry.content}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    disabled={deletingIds.has(entry.id)}
                    className="shrink-0 rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                    aria-label={`Delete ${entry.title}`}
                  >
                    {deletingIds.has(entry.id) ? 'Deleting...' : 'Delete'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Files tab */}
      {activeTab === 'files' && (
        <section className="space-y-4">
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center">
            <label
              htmlFor="file-upload"
              className={`cursor-pointer inline-flex flex-col items-center gap-2 ${
                isUploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <svg
                className="h-8 w-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
              <span className="text-sm font-medium text-gray-700">
                {isUploading ? 'Uploading...' : 'Choose a file to upload'}
              </span>
              <span className="text-xs text-gray-400">PDF, CSV, or TXT — max 5MB</span>
            </label>
            <input
              id="file-upload"
              ref={fileInputRef}
              type="file"
              accept=".pdf,.csv,.txt"
              onChange={handleUpload}
              disabled={isUploading}
              className="sr-only"
            />
          </div>

          {fileEntries.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">
              No files uploaded yet. Upload one above.
            </p>
          ) : (
            <ul className="space-y-2">
              {fileEntries.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {entry.original_filename ?? entry.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {entry.file_size != null ? formatBytes(entry.file_size) : ''}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5">
                    Ready
                  </span>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    disabled={deletingIds.has(entry.id)}
                    className="shrink-0 rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                    aria-label={`Delete ${entry.original_filename ?? entry.title}`}
                  >
                    {deletingIds.has(entry.id) ? 'Deleting...' : 'Delete'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
