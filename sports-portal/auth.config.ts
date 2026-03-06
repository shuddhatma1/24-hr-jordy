import type { NextAuthConfig } from 'next-auth'

// Edge-safe auth config: no DB imports, no Node.js-only modules.
// Used by middleware.ts (Edge Runtime). auth.ts extends this with the
// Credentials provider (which imports mongoose and runs server-side only).
export const authConfig: NextAuthConfig = {
  // AUTH_SECRET is the v5 primary name; NEXTAUTH_SECRET kept for backwards compat
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  // Required when running behind a proxy (Netlify, Vercel, etc.)
  // Without this, NextAuth v5 rejects requests with "server configuration" error
  trustHost: true,
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
  providers: [],
  callbacks: {
    // 'auth' renamed to 'session' to avoid shadowing the exported 'auth' in auth.ts
    authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user
      const isProtected = ['/dashboard', '/setup'].some((p) =>
        nextUrl.pathname.startsWith(p)
      )
      if (isProtected) return isLoggedIn
      return true
    },
  },
}
