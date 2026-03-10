import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import type { MockedFunction } from 'vitest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn().mockResolvedValue(undefined) }))
vi.mock('@/auth', () => ({ auth: vi.fn() }))

import { GET } from '../route'
import { auth } from '@/auth'
import { Bot } from '@/lib/models/Bot'
import { ChatEvent } from '@/lib/models/ChatEvent'

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

async function insertBot(owner_id = 'owner-1') {
  return Bot.create({
    owner_id,
    bot_name: 'Test Bot',
    sport: 'soccer',
    league: 'english-premier-league',
  })
}

function makeRequest(period?: string) {
  const url = period
    ? `http://localhost:3000/api/analytics?period=${period}`
    : 'http://localhost:3000/api/analytics'
  return new Request(url, { method: 'GET' })
}

describe('GET /api/analytics', () => {
  it('returns 401 without session', async () => {
    mockedAuth.mockResolvedValue(null)
    const res = await GET(makeRequest())
    expect(res.status).toBe(401)
  })

  it('returns 404 when owner has no bot', async () => {
    mockSession('owner-no-bot')
    const res = await GET(makeRequest())
    expect(res.status).toBe(404)
  })

  it('returns zeros when no events exist', async () => {
    mockSession('owner-1')
    await insertBot('owner-1')
    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.total_conversations).toBe(0)
    expect(data.total_messages).toBe(0)
    expect(data.avg_messages_per_conversation).toBe(0)
    expect(data.daily_messages).toEqual([])
    expect(data.daily_conversations).toEqual([])
    expect(data.period).toBe('7d')
  })

  it('returns correct totals and daily breakdown', async () => {
    mockSession('owner-1')
    const bot = await insertBot('owner-1')
    const bot_id = bot._id.toString()
    const today = new Date()
    today.setHours(12, 0, 0, 0)

    // 2 conversations: first has 3 messages, second has 1
    await ChatEvent.create([
      { bot_id, owner_id: 'owner-1', event_type: 'conversation_start', created_at: today },
      { bot_id, owner_id: 'owner-1', event_type: 'message', created_at: today },
      { bot_id, owner_id: 'owner-1', event_type: 'message', created_at: today },
      { bot_id, owner_id: 'owner-1', event_type: 'conversation_start', created_at: today },
    ])

    const res = await GET(makeRequest())
    const data = await res.json()
    expect(data.total_conversations).toBe(2)
    expect(data.total_messages).toBe(2) // only 'message' events, not 'conversation_start'
    expect(data.avg_messages_per_conversation).toBe(1)
    expect(data.daily_messages.length).toBeGreaterThanOrEqual(1)
    expect(data.daily_conversations.length).toBeGreaterThanOrEqual(1)
  })

  it('respects period=30d parameter', async () => {
    mockSession('owner-1')
    const bot = await insertBot('owner-1')
    const bot_id = bot._id.toString()

    // Events 15 days ago (within 30d, outside 7d)
    const fifteenDaysAgo = new Date()
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15)
    await ChatEvent.create([
      { bot_id, owner_id: 'owner-1', event_type: 'conversation_start', created_at: fifteenDaysAgo },
      { bot_id, owner_id: 'owner-1', event_type: 'message', created_at: fifteenDaysAgo },
    ])

    // 7d should return 0 messages
    const res7d = await GET(makeRequest('7d'))
    const data7d = await res7d.json()
    expect(data7d.total_messages).toBe(0)

    // 30d should return 1 message (conversation_start excluded from messages count)
    const res30d = await GET(makeRequest('30d'))
    const data30d = await res30d.json()
    expect(data30d.total_messages).toBe(1)
    expect(data30d.total_conversations).toBe(1)
  })

  it('defaults to 7d for invalid period param', async () => {
    mockSession('owner-1')
    await insertBot('owner-1')
    const res = await GET(makeRequest('invalid'))
    const data = await res.json()
    expect(data.period).toBe('7d')
  })

  it('does not return events from other owners', async () => {
    mockSession('owner-1')
    await insertBot('owner-1')
    const bot2 = await insertBot('owner-2')

    await ChatEvent.create({
      bot_id: bot2._id.toString(), owner_id: 'owner-2',
      event_type: 'conversation_start',
    })

    const res = await GET(makeRequest())
    const data = await res.json()
    expect(data.total_messages).toBe(0)
  })
})
