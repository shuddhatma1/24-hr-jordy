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
    expect(data.bot_id).toMatch(/^[0-9a-f]{24}$/)
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

  it('returns 400 for whitespace-only bot_name', async () => {
    mockSession('owner-6')
    const res = await POST(makeReq({ bot_name: '   ', sport: 'soccer', league: 'english-premier-league' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('bot_name')
  })

  it('returns 400 for bot_name exceeding 100 characters', async () => {
    process.env.MOCK_BOT_URL = 'http://localhost:3001/chat'
    mockSession('owner-7')
    const res = await POST(makeReq({ bot_name: 'a'.repeat(101), sport: 'soccer', league: 'english-premier-league' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('100')
  })

  it('returns 400 when MOCK_BOT_URL is unset (league not available)', async () => {
    // MOCK_BOT_URL is deleted in afterEach; ensure it's absent here
    mockSession('owner-8')
    const res = await POST(makeReq({ bot_name: 'Test', sport: 'soccer', league: 'english-premier-league' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe("This league isn't available yet")
  })

  it('returns 400 for invalid JSON body', async () => {
    mockSession('owner-9')
    const req = new Request('http://localhost/api/bots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Invalid JSON')
  })
})
