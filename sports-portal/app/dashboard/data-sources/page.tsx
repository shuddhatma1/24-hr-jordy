'use client'

import { useEffect, useRef, useState } from 'react'
import { Toast } from '@/components/ui/Toast'
import { FileText, Upload, Trash2, ChevronDown, ChevronUp, File, FileSpreadsheet } from 'lucide-react'

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

function getFileIcon(filename: string) {
  const ext = filename.lastIndexOf('.') !== -1 ? filename.slice(filename.lastIndexOf('.')).toLowerCase() : ''
  if (ext === '.pdf') return <FileText className="w-5 h-5 text-red-500" />
  if (ext === '.csv') return <FileSpreadsheet className="w-5 h-5 text-green-600" />
  return <File className="w-5 h-5 text-neutral-400" />
}

const MAX_CLIENT_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.csv', '.txt'])

export default function DataSourcesPage() {
  const [status, setStatus] = useState<PageStatus>('loading')
  const [activeTab, setActiveTab] = useState<ActiveTab>('faq')
  const [entries, setEntries] = useState<DataSourceEntry[]>([])
  const [toast, setToast] = useState<ToastState>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // FAQ form
  const [faqTitle, setFaqTitle] = useState('')
  const [faqContent, setFaqContent] = useState('')
  const [faqTitleError, setFaqTitleError] = useState('')
  const [faqContentError, setFaqContentError] = useState('')
  const [isAddingFaq, setIsAddingFaq] = useState(false)

  // File upload
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
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

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    // Trigger the file input handler by setting files
    if (fileInputRef.current) {
      const dt = new DataTransfer()
      dt.items.add(file)
      fileInputRef.current.files = dt.files
      fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }))
    }
  }

  const faqEntries = entries.filter((e) => e.type === 'faq')
  const fileEntries = entries.filter((e) => e.type === 'file')

  if (status === 'loading') {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-neutral-100 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (status === 'noBotFound') {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
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
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-800 font-medium">Failed to load knowledge base</p>
          <p className="text-red-700 text-sm mt-1">Please refresh the page and try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Knowledge Base</h1>
        <p className="text-neutral-500 text-sm mt-1">
          Add FAQ answers and upload files your bot can reference when talking to fans.
        </p>
      </div>

      {/* Pill tabs */}
      <div role="tablist" className="inline-flex gap-1 bg-neutral-100 rounded-xl p-1">
        <button
          role="tab"
          aria-selected={activeTab === 'faq'}
          onClick={() => setActiveTab('faq')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'faq'
              ? 'bg-white text-neutral-900 shadow-soft'
              : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          FAQ Entries
          {faqEntries.length > 0 && (
            <span className="ml-2 rounded-full bg-brand-100 text-brand-700 text-xs px-2 py-0.5">
              {faqEntries.length}
            </span>
          )}
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'files'}
          onClick={() => setActiveTab('files')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'files'
              ? 'bg-white text-neutral-900 shadow-soft'
              : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          Uploaded Files
          {fileEntries.length > 0 && (
            <span className="ml-2 rounded-full bg-brand-100 text-brand-700 text-xs px-2 py-0.5">
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
            className="rounded-2xl border border-neutral-200 bg-white p-4 space-y-3 shadow-soft"
          >
            <h2 className="text-sm font-semibold text-neutral-700">Add FAQ entry</h2>
            <div>
              <label
                htmlFor="faq-title"
                className="block text-sm font-medium text-neutral-700 mb-1"
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
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
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
                className="block text-sm font-medium text-neutral-700 mb-1"
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
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
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
              className="rounded-xl gradient-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
            >
              {isAddingFaq ? 'Adding...' : 'Add entry'}
            </button>
          </form>

          {faqEntries.length === 0 ? (
            <p className="text-center text-neutral-400 text-sm py-8">
              No FAQ entries yet. Add one above.
            </p>
          ) : (
            <ul className="space-y-2">
              {faqEntries.map((entry) => {
                const isExpanded = expandedId === entry.id
                return (
                  <li
                    key={entry.id}
                    className="rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-soft"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                      className="flex items-center justify-between gap-4 w-full px-4 py-3 text-left"
                      aria-expanded={isExpanded}
                    >
                      <p className="text-sm font-medium text-neutral-900 truncate">{entry.title}</p>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-3 animate-slide-up">
                        <p className="text-xs text-neutral-500 mb-3">{entry.content}</p>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          disabled={deletingIds.has(entry.id)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                          aria-label={`Delete ${entry.title}`}
                        >
                          <Trash2 className="w-3 h-3" />
                          {deletingIds.has(entry.id) ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}

      {/* Files tab */}
      {activeTab === 'files' && (
        <section className="space-y-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
              isDragging
                ? 'border-brand-400 bg-brand-50 scale-[1.02]'
                : 'border-neutral-300 bg-white hover:border-neutral-400'
            }`}
          >
            <label
              htmlFor="file-upload"
              className={`cursor-pointer inline-flex flex-col items-center gap-2 ${
                isUploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Upload className={`h-8 w-8 ${isDragging ? 'text-brand-500' : 'text-neutral-400'}`} />
              <span className="text-sm font-medium text-neutral-700">
                {isUploading ? 'Uploading...' : 'Choose a file to upload'}
              </span>
              <span className="text-xs text-neutral-400">PDF, CSV, or TXT — max 5MB</span>
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
            <p className="text-center text-neutral-400 text-sm py-8">
              No files uploaded yet. Upload one above.
            </p>
          ) : (
            <ul className="space-y-2">
              {fileEntries.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-soft hover:-translate-y-0.5 hover:shadow-card transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {getFileIcon(entry.original_filename ?? entry.title)}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">
                        {entry.original_filename ?? entry.title}
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {entry.file_size != null ? formatBytes(entry.file_size) : ''}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5">
                    Ready
                  </span>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    disabled={deletingIds.has(entry.id)}
                    className="shrink-0 rounded-lg p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                    aria-label={`Delete ${entry.original_filename ?? entry.title}`}
                  >
                    <Trash2 className="w-4 h-4" />
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
