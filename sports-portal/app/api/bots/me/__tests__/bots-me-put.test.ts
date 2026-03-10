import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import type { MockedFunction } from 'vitest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn().mockResolvedValue(undefined) }))
vi.mock('@/auth', () => ({ auth: vi.fn() }))

import { PUT } from '../route'
import { auth } from '@/auth'
import { Bot } from '@/lib/models/Bot'

const mockedAuth = auth as unknown as MockedFunction<() => Promise<unknown>>

let mongod: MongoMemoryServer

beforeAll(async () => {
  process.env.MOCK_BOT_URL = 'http://localhost:3001/chat'
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
  delete process.env.MOCK_BOT_URL
  await mongoose.disconnect()
  await mongod.stop()
})

function mockSession(id: string) {
  mockedAuth.mockResolvedValue({
    user: { id, email: `${id}@example.com` },
    expires: '9999-12-31T00:00:00.000Z',
  })
}

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/bots/me', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('PUT /api/bots/me', () => {
  it('returns 401 when no session', async () => {
    mockedAuth.mockResolvedValue(null)
    const res = await PUT(makeRequest({ bot_name: 'Bot' }))
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toBe('Unauthorized')
  })

  it('returns 404 when owner has no bot', async () => {
    mockSession('owner-put-1')
    const res = await PUT(makeRequest({ bot_name: 'Bot' }))
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toBe('No bot found')
  })

  it('returns 400 when bot_name is missing', async () => {
    mockSession('owner-put-2')
    const res = await PUT(makeRequest({ welcome_message: 'Hello' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/bot_name/)
  })

  it('returns 400 when bot_name is empty string', async () => {
    mockSession('owner-put-3')
    const res = await PUT(makeRequest({ bot_name: '   ' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/bot_name/)
  })

  it('returns 400 when bot_name exceeds 100 characters', async () => {
    mockSession('owner-put-3b')
    const res = await PUT(makeRequest({ bot_name: 'a'.repeat(101) }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/bot_name/)
  })

  it('returns 400 for an invalid persona', async () => {
    mockSession('owner-put-4')
    await Bot.create({
      owner_id: 'owner-put-4',
      bot_name: 'Bot',
      sport: 'soccer',
      league: 'english-premier-league',
      bot_endpoint_url: 'http://localhost:3001/chat',
    })
    const res = await PUT(makeRequest({ bot_name: 'Bot', persona: 'sarcastic' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/persona/)
  })

  it('returns 400 for an invalid hex color', async () => {
    mockSession('owner-put-5')
    await Bot.create({
      owner_id: 'owner-put-5',
      bot_name: 'Bot',
      sport: 'soccer',
      league: 'english-premier-league',
      bot_endpoint_url: 'http://localhost:3001/chat',
    })
    const res = await PUT(makeRequest({ bot_name: 'Bot', primary_color: 'blue' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/primary_color/)
  })

  it('returns 400 when welcome_message exceeds 300 characters', async () => {
    mockSession('owner-put-6')
    await Bot.create({
      owner_id: 'owner-put-6',
      bot_name: 'Bot',
      sport: 'soccer',
      league: 'english-premier-league',
      bot_endpoint_url: 'http://localhost:3001/chat',
    })
    const res = await PUT(makeRequest({ bot_name: 'Bot', welcome_message: 'a'.repeat(301) }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/welcome_message/)
  })

  it('updates all fields and returns 200', async () => {
    mockSession('owner-put-7')
    await Bot.create({
      owner_id: 'owner-put-7',
      bot_name: 'Old Name',
      sport: 'soccer',
      league: 'english-premier-league',
      bot_endpoint_url: 'http://localhost:3001/chat',
    })
    const res = await PUT(
      makeRequest({
        bot_name: 'New Name',
        welcome_message: 'Welcome to the chat!',
        persona: 'enthusiastic',
        primary_color: '#FF5733',
      })
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.bot_name).toBe('New Name')
    expect(data.welcome_message).toBe('Welcome to the chat!')
    expect(data.persona).toBe('enthusiastic')
    expect(data.primary_color).toBe('#FF5733')
  })

  it('does not return bot_endpoint_url or owner_id', async () => {
    mockSession('owner-put-8')
    await Bot.create({
      owner_id: 'owner-put-8',
      bot_name: 'Bot',
      sport: 'basketball',
      league: 'nba',
      bot_endpoint_url: 'http://localhost:3001/chat',
    })
    const res = await PUT(makeRequest({ bot_name: 'Updated Bot' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.bot_endpoint_url).toBeUndefined()
    expect(data.owner_id).toBeUndefined()
  })

  it('returns 500 on DB error', async () => {
    mockSession('owner-put-9')
    vi.spyOn(Bot, 'findOneAndUpdate').mockRejectedValueOnce(new Error('DB error'))
    const res = await PUT(makeRequest({ bot_name: 'Bot' }))
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toBe('Internal server error')
  })

  // --- Sport/league change tests ---

  it('updates sport and league when both are provided', async () => {
    mockSession('owner-put-sl-1')
    await Bot.create({
      owner_id: 'owner-put-sl-1',
      bot_name: 'Bot',
      sport: 'soccer',
      league: 'english-premier-league',
      bot_endpoint_url: 'http://localhost:3001/chat',
    })
    const res = await PUT(
      makeRequest({ bot_name: 'Bot', sport: 'basketball', league: 'nba' })
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.sport).toBe('basketball')
    expect(data.league).toBe('nba')
  })

  it('returns 400 when sport is provided without league', async () => {
    mockSession('owner-put-sl-2')
    const res = await PUT(makeRequest({ bot_name: 'Bot', sport: 'soccer' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/sport and league/)
  })

  it('returns 400 when league is provided without sport', async () => {
    mockSession('owner-put-sl-3')
    const res = await PUT(makeRequest({ bot_name: 'Bot', league: 'nba' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/sport and league/)
  })

  it('returns 400 for an invalid sport', async () => {
    mockSession('owner-put-sl-4')
    const res = await PUT(
      makeRequest({ bot_name: 'Bot', sport: 'cricket', league: 'ipl' })
    )
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/sport/)
  })

  it('returns 400 when league does not match sport', async () => {
    mockSession('owner-put-sl-5')
    const res = await PUT(
      makeRequest({ bot_name: 'Bot', sport: 'soccer', league: 'nba' })
    )
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/league/)
  })

  it('does not change sport/league when neither is provided', async () => {
    mockSession('owner-put-sl-6')
    await Bot.create({
      owner_id: 'owner-put-sl-6',
      bot_name: 'Bot',
      sport: 'soccer',
      league: 'english-premier-league',
      bot_endpoint_url: 'http://localhost:3001/chat',
    })
    const res = await PUT(makeRequest({ bot_name: 'Renamed Bot' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.bot_name).toBe('Renamed Bot')
    expect(data.sport).toBe('soccer')
    expect(data.league).toBe('english-premier-league')

    // Also verify DB state directly
    const dbBot = await Bot.findOne({ owner_id: 'owner-put-sl-6' })
    expect(dbBot?.sport).toBe('soccer')
    expect(dbBot?.league).toBe('english-premier-league')
  })

  it('does not wipe customization when only sport/league are sent', async () => {
    mockSession('owner-put-sl-7')
    await Bot.create({
      owner_id: 'owner-put-sl-7',
      bot_name: 'Bot',
      sport: 'soccer',
      league: 'english-premier-league',
      bot_endpoint_url: 'http://localhost:3001/chat',
      welcome_message: 'Hello fans!',
      persona: 'enthusiastic',
      primary_color: '#FF5733',
    })
    // Settings page sends bot_name + sport + league but NOT welcome_message/persona/primary_color
    const res = await PUT(
      makeRequest({ bot_name: 'Bot', sport: 'basketball', league: 'nba' })
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.sport).toBe('basketball')
    expect(data.league).toBe('nba')
    // Customization fields must be preserved
    expect(data.welcome_message).toBe('Hello fans!')
    expect(data.persona).toBe('enthusiastic')
    expect(data.primary_color).toBe('#FF5733')
  })
})
