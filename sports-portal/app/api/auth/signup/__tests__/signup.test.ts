import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'

vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn().mockResolvedValue(undefined) }))

import { POST } from '../route'
import { User } from '@/lib/models/User'

let mongod: MongoMemoryServer

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
})

afterEach(async () => {
  await Promise.all(
    Object.values(mongoose.connection.collections).map((c) => c.deleteMany({}))
  )
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})

describe('POST /api/auth/signup', () => {
  it('creates a user and returns 201', async () => {
    const req = new Request('http://localhost/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const user = await User.findOne({ email: 'test@example.com' })
    expect(user).not.toBeNull()
    expect(user?.passwordHash).not.toBe('password123')
  })

  it('returns 409 for duplicate email', async () => {
    await User.create({ email: 'dup@example.com', passwordHash: 'hash' })
    const req = new Request('http://localhost/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'dup@example.com', password: 'password123' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(409)
  })

  it('returns 400 for missing email', async () => {
    const req = new Request('http://localhost/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'password123' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 for password shorter than 8 characters', async () => {
    const req = new Request('http://localhost/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'short' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
