import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import type { MockedFunction } from 'vitest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn().mockResolvedValue(undefined) }))
vi.mock('@/auth', () => ({ auth: vi.fn() }))

import { GET } from '../route'
import { auth } from '@/auth'
import { Bot } from '@/lib/models/Bot'

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
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})

function mockSession(id: string) {
  mockedAuth.mockResolvedValue({
    user: { id, email: `${id}@example.com` },
    expires: '9999-12-31T00:00:00.000Z',
  })
}

describe('GET /api/bots/me', () => {
  it('returns 401 when no session', async () => {
    mockedAuth.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toBe('Unauthorized')
  })

  it('returns 404 when owner has no bot', async () => {
    mockSession('owner-1')
    const res = await GET()
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toBe('No bot found')
  })

  it('returns 200 with bot data when bot exists', async () => {
    mockSession('owner-2')
    await Bot.create({
      owner_id: 'owner-2',
      bot_name: 'Test Bot',
      sport: 'soccer',
      league: 'english-premier-league',
      bot_endpoint_url: 'http://localhost:3001/chat',
    })
    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.bot_id).toMatch(/^[0-9a-f]{24}$/)
    expect(data.bot_name).toBe('Test Bot')
    expect(data.sport).toBe('soccer')
    expect(data.league).toBe('english-premier-league')
  })

  it('does not return bot_endpoint_url or owner_id', async () => {
    mockSession('owner-3')
    await Bot.create({
      owner_id: 'owner-3',
      bot_name: 'Test Bot',
      sport: 'basketball',
      league: 'nba',
      bot_endpoint_url: 'http://localhost:3001/chat',
    })
    const res = await GET()
    const data = await res.json()
    expect(data.bot_endpoint_url).toBeUndefined()
    expect(data.owner_id).toBeUndefined()
  })

  it('returns 500 on DB error', async () => {
    mockSession('owner-4')
    vi.spyOn(Bot, 'findOne').mockRejectedValueOnce(new Error('DB error'))
    const res = await GET()
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toBe('Internal server error')
  })
})
