import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn().mockResolvedValue(undefined) }))

import { GET } from '../route'
import { Bot } from '@/lib/models/Bot'

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

function makeParams(bot_id: string) {
  return { params: { bot_id } }
}

const fakeReq = new Request('http://localhost/api/bots/test')

describe('GET /api/bots/[bot_id]', () => {
  it('returns 404 for an invalid ObjectId format', async () => {
    const res = await GET(fakeReq, makeParams('not-an-id'))
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toBe('Bot not found')
  })

  it('returns 404 for a valid ObjectId that does not exist', async () => {
    const validId = new mongoose.Types.ObjectId().toString()
    const res = await GET(fakeReq, makeParams(validId))
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toBe('Bot not found')
  })

  it('returns 200 with public fields when bot exists', async () => {
    const bot = await Bot.create({
      owner_id: 'owner-1',
      bot_name: 'EPL Bot',
      sport: 'soccer',
      league: 'english-premier-league',
      bot_endpoint_url: 'http://localhost:3001/chat',
    })
    const res = await GET(fakeReq, makeParams(bot._id.toString()))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.bot_name).toBe('EPL Bot')
    expect(data.sport).toBe('soccer')
    expect(data.league).toBe('english-premier-league')
  })

  it('does not return bot_endpoint_url, owner_id, _id, or created_at', async () => {
    const bot = await Bot.create({
      owner_id: 'owner-2',
      bot_name: 'NBA Bot',
      sport: 'basketball',
      league: 'nba',
      bot_endpoint_url: 'http://localhost:3001/chat',
    })
    const res = await GET(fakeReq, makeParams(bot._id.toString()))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.bot_endpoint_url).toBeUndefined()
    expect(data.owner_id).toBeUndefined()
    expect(data._id).toBeUndefined()
    expect(data.created_at).toBeUndefined()
  })

  it('returns 500 on DB error', async () => {
    const validId = new mongoose.Types.ObjectId().toString()
    vi.spyOn(Bot, 'findOne').mockRejectedValueOnce(new Error('DB error'))
    const res = await GET(fakeReq, makeParams(validId))
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toBe('Internal server error')
  })
})
