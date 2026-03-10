import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import type { MockedFunction } from 'vitest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn().mockResolvedValue(undefined) }))
vi.mock('@/auth', () => ({ auth: vi.fn() }))

import { DELETE } from '../route'
import { auth } from '@/auth'
import { Bot } from '@/lib/models/Bot'
import { DataSource } from '@/lib/models/DataSource'

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
  vi.restoreAllMocks()
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

describe('DELETE /api/bots/me', () => {
  it('returns 401 when no session', async () => {
    mockedAuth.mockResolvedValue(null)
    const res = await DELETE()
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toBe('Unauthorized')
  })

  it('returns 404 when owner has no bot', async () => {
    mockSession('del-owner-1')
    const res = await DELETE()
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toBe('No bot found')
  })

  it('returns 200 and deletes bot', async () => {
    mockSession('del-owner-2')
    await Bot.create({
      owner_id: 'del-owner-2',
      bot_name: 'Test Bot',
      sport: 'soccer',
      league: 'english-premier-league',
      bot_endpoint_url: 'http://localhost:3001/chat',
    })
    const res = await DELETE()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)

    // Verify bot is actually deleted
    const bot = await Bot.findOne({ owner_id: 'del-owner-2' })
    expect(bot).toBeNull()
  })

  it('cascade deletes all DataSources for the bot', async () => {
    mockSession('del-owner-3')
    const bot = await Bot.create({
      owner_id: 'del-owner-3',
      bot_name: 'Test Bot',
      sport: 'basketball',
      league: 'nba',
      bot_endpoint_url: 'http://localhost:3001/chat',
    })
    const botId = bot._id.toString()
    await DataSource.create([
      {
        owner_id: 'del-owner-3',
        bot_id: botId,
        type: 'faq',
        title: 'FAQ 1',
        content: 'Answer 1',
      },
      {
        owner_id: 'del-owner-3',
        bot_id: botId,
        type: 'file',
        title: 'File 1',
        content: 'Extracted text',
      },
    ])

    const res = await DELETE()
    expect(res.status).toBe(200)

    // Verify DataSources are deleted
    const remaining = await DataSource.find({ bot_id: botId })
    expect(remaining).toHaveLength(0)
  })

  it('returns 200 even if DataSource deletion fails', async () => {
    mockSession('del-owner-4')
    await Bot.create({
      owner_id: 'del-owner-4',
      bot_name: 'Test Bot',
      sport: 'soccer',
      league: 'la-liga',
      bot_endpoint_url: 'http://localhost:3001/chat',
    })
    vi.spyOn(DataSource, 'deleteMany').mockRejectedValueOnce(new Error('DS error'))

    const res = await DELETE()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
  })

  it('returns 500 on DB error', async () => {
    mockSession('del-owner-5')
    vi.spyOn(Bot, 'findOneAndDelete').mockRejectedValueOnce(new Error('DB error'))
    const res = await DELETE()
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toBe('Internal server error')
  })
})
