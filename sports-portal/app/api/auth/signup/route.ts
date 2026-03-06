import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/lib/models/User'

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { email, password } = body as Record<string, unknown>

  if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters' },
      { status: 400 }
    )
  }

  await connectDB()

  const passwordHash = await bcrypt.hash(password, 12)
  // TODO: add rate limiting before production (bcrypt at work factor 12 is CPU-heavy)
  try {
    await User.create({ email: email.toLowerCase(), passwordHash })
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }
    throw err
  }

  return NextResponse.json({ message: 'Account created' }, { status: 201 })
}
