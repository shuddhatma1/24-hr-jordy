import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import type { MockedFunction } from 'vitest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn().mockResolvedValue(undefined) }))
vi.mock('@/auth', () => ({ auth: vi.fn() }))

import { POST } from '../route'
import { auth } from '@/auth'

const mockedAuth = auth as unknown as MockedFunction<() => Promise<unknown>>

let mongod: MongoMemoryServer

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
})

afterEach(async () => {
  await Promise.all(
    Object.values(mongoose.connection.collections).map((c) => c.deleteMany({}))
  )
  vi.clearAllMocks()
  delete process.env.MOCK_BOT_URL
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})

function makeReq(body: unknown) {
  return new Request('http://localhost/api/bots', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function mockSession(id: string) {
  mockedAuth.mockResolvedValue({
    user: { id, email: `${id}@example.com` },
    expires: '9999-12-31T00:00:00.000Z',
  })
}

describe('POST /api/bots', () => {
  it('returns 401 when no session', async () => {
    mockedAuth.mockResolvedValue(null)
    const res = await POST(makeReq({ bot_name: 'Test', sport: 'soccer', league: 'english-premier-league' }))
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toBe('Unauthorized')
  })

  it('returns 201 with bot_id on success', async () => {
    process.env.MOCK_BOT_URL = 'http://localhost:3001/chat'
    mockSession('owner-1')
    const res = await POST(makeReq({ bot_name: 'My Bot', sport: 'soccer', league: 'english-premier-league' }))
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(typeof data.bot_id).toBe('string')
    expect(data.bot_id.length).toBeGreaterThan(0)
  })

  it('returns 409 when owner already has a bot', async () => {
    process.env.MOCK_BOT_URL = 'http://localhost:3001/chat'
    mockSession('owner-2')
    await POST(makeReq({ bot_name: 'Bot 1', sport: 'soccer', league: 'english-premier-league' }))
    const res = await POST(makeReq({ bot_name: 'Bot 2', sport: 'basketball', league: 'nba' }))
    expect(res.status).toBe(409)
    const data = await res.json()
    expect(data.error).toBe('You already have a bot configured')
  })

  it('returns 400 when bot_name is missing', async () => {
    mockSession('owner-3')
    const res = await POST(makeReq({ sport: 'soccer', league: 'english-premier-league' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('bot_name')
  })

  it('returns 400 for unsupported sport', async () => {
    mockSession('owner-4')
    const res = await POST(makeReq({ bot_name: 'Test', sport: 'hockey', league: 'nhl' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Invalid sport')
  })

  it('returns 400 for invalid league within a valid sport', async () => {
    mockSession('owner-5')
    const res = await POST(makeReq({ bot_name: 'Test', sport: 'soccer', league: 'nba' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Invalid league for this sport')
  })
})
