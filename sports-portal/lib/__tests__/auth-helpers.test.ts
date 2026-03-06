import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import bcrypt from 'bcryptjs'

vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn().mockResolvedValue(undefined) }))

import { validateCredentials } from '../auth-helpers'
import { User } from '../models/User'

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

describe('validateCredentials', () => {
  it('returns user id and email for correct credentials', async () => {
    const hash = await bcrypt.hash('correctpassword', 10)
    await User.create({ email: 'user@example.com', passwordHash: hash })

    const result = await validateCredentials('user@example.com', 'correctpassword')
    expect(result).not.toBeNull()
    expect(result?.email).toBe('user@example.com')
    expect(result?.id).toBeTruthy()
  })

  it('returns null for wrong password', async () => {
    const hash = await bcrypt.hash('correctpassword', 10)
    await User.create({ email: 'user@example.com', passwordHash: hash })

    const result = await validateCredentials('user@example.com', 'wrongpassword')
    expect(result).toBeNull()
  })

  it('returns null for unknown email', async () => {
    const result = await validateCredentials('nobody@example.com', 'anypassword')
    expect(result).toBeNull()
  })

  it('is case-insensitive for email lookup', async () => {
    const hash = await bcrypt.hash('mypassword', 10)
    await User.create({ email: 'mixed@example.com', passwordHash: hash })

    const result = await validateCredentials('MIXED@EXAMPLE.COM', 'mypassword')
    expect(result).not.toBeNull()
    expect(result?.email).toBe('mixed@example.com')
  })
})
