'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { LayoutGrid, Pencil, Database, BarChart3, Settings, Menu, X, ChevronLeft, ChevronRight, LogOut } from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', href: '/dashboard', icon: LayoutGrid },
  { label: 'Customize', href: '/dashboard/customize', icon: Pencil },
  { label: 'Knowledge', href: '/dashboard/data-sources', icon: Database },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]

interface DashboardShellProps {
  userEmail: string
  children: React.ReactNode
}

export default function DashboardShell({ userEmail, children }: DashboardShellProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  // Hydrate collapsed state from localStorage on mount (avoids SSR mismatch)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('sidebar-collapsed')
      if (stored === 'true') setCollapsed(true)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('sidebar-collapsed', String(collapsed))
    } catch {
      // ignore
    }
  }, [collapsed])

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const activeNavItem = NAV_ITEMS.find((item) => isActive(item.href))
  const userInitial = (userEmail[0] ?? '?').toUpperCase()

  const sidebarContent = (showCollapsed: boolean) => (
    <nav className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5">
        {showCollapsed ? (
          <div className="w-8 h-8 rounded-lg gradient-primary text-white flex items-center justify-center text-xs font-bold mx-auto">
            B
          </div>
        ) : (
          <span className="text-base font-bold gradient-text">Bot Portal</span>
        )}
      </div>

      {/* Nav links */}
      <div className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setSidebarOpen(false)}
            title={showCollapsed ? item.label : undefined}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              isActive(item.href)
                ? 'bg-gradient-to-r from-brand-500/10 to-accent-500/10 text-brand-700 border-l-2 border-brand-500'
                : 'text-neutral-600 hover:bg-neutral-100 hover:translate-x-0.5'
            } ${showCollapsed ? 'justify-center' : ''}`}
          >
            <span className={isActive(item.href) ? 'text-brand-600' : 'text-neutral-400'}>
              <item.icon className="w-4 h-4" />
            </span>
            {!showCollapsed && item.label}
          </Link>
        ))}

        {/* Collapse toggle - desktop only */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="hidden md:flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-neutral-400 hover:text-neutral-600 transition-all duration-150 w-full mt-2"
          title={showCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {showCollapsed ? (
            <ChevronRight className="w-4 h-4 mx-auto" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>

      {/* User + Logout */}
      <div className="px-4 py-4 border-t border-neutral-100">
        {showCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full gradient-primary text-white flex items-center justify-center text-xs font-semibold">
              {userInitial}
            </div>
            <button
              onClick={() => void signOut({ callbackUrl: '/login' })}
              className="text-neutral-500 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 rounded p-1"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full gradient-primary text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                {userInitial}
              </div>
              <p className="text-xs text-neutral-500 truncate">{userEmail}</p>
            </div>
            <button
              onClick={() => void signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-2 text-xs text-neutral-500 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 rounded"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </>
        )}
      </div>
    </nav>
  )

  return (
    <div className="flex h-screen bg-neutral-50">
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-neutral-50 shadow-soft flex-shrink-0 transition-all duration-200 ${
          collapsed ? 'w-16' : 'w-56'
        }`}
      >
        {sidebarContent(collapsed)}
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-neutral-950/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar */}
      <aside
        id="mobile-sidebar"
        className={`fixed inset-y-0 left-0 z-50 w-56 bg-neutral-50 shadow-soft flex flex-col md:hidden transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent(false)}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-neutral-200">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={sidebarOpen}
            aria-controls="mobile-sidebar"
            className="p-1.5 rounded-md text-neutral-500 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="text-sm font-semibold text-neutral-900">
            {activeNavItem?.label ?? 'Bot Portal'}
          </span>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div key={pathname} className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
