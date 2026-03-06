import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { validateCredentials } from '@/lib/auth-helpers'

export const { auth, signIn, signOut, handlers } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        return validateCredentials(
          credentials.email as string,
          credentials.password as string
        )
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    session({ session, token }) {
      if (session.user) session.user.id = token.id as string
      return session
    },
    // 'auth' renamed to 'session' to avoid shadowing the exported 'auth' above
    authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user
      const isProtected = ['/dashboard', '/setup'].some((p) =>
        nextUrl.pathname.startsWith(p)
      )
      if (isProtected) return isLoggedIn
      return true
    },
  },
  session: { strategy: 'jwt' },
})
