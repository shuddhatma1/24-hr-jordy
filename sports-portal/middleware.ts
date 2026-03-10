import NextAuth from 'next-auth'
import { authConfig } from '@/auth.config'

export const { auth: middleware } = NextAuth(authConfig)

export const config = {
  // Only run middleware on routes that actually need auth protection.
  // Scoping this prevents unnecessary JWT overhead on every public request
  // (landing page, chat page, API routes, static assets).
  matcher: ['/dashboard/:path*', '/setup/:path*'],
}
