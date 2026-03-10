import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import type { MockedFunction } from 'vitest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn().mockResolvedValue(undefined) }))
vi.mock('@/auth', () => ({ auth: vi.fn() }))

import { GET, POST } from '../route'
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

async function insertBot(owner_id = 'owner-1') {
  return Bot.create({
    owner_id,
    bot_name: 'Test Bot',
    sport: 'soccer',
    league: 'english-premier-league',
    bot_endpoint_url: 'http://localhost:3001/chat',
  })
}

async function insertDataSource(overrides: Partial<{
  owner_id: string
  bot_id: string
  type: 'faq' | 'file'
  title: string
  content: string
}> = {}) {
  return DataSource.create({
    owner_id: 'owner-1',
    bot_id: 'bot-1',
    type: 'faq',
    title: 'Test entry',
    content: 'Test content',
    ...overrides,
  })
}

function makeGetReq(search = '') {
  return new Request(`http://localhost/api/data-sources${search}`)
}

function makePostReq(body: unknown) {
  return new Request('http://localhost/api/data-sources', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('GET /api/data-sources', () => {
  it('returns 401 when no session', async () => {
    mockedAuth.mockResolvedValue(null)
    const res = await GET(makeGetReq())
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toBe('Unauthorized')
  })

  it('returns 404 when owner has no bot', async () => {
    mockSession('owner-no-bot')
    const res = await GET(makeGetReq())
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toBe('No bot found')
  })

  it('returns 200 with empty array when no entries', async () => {
    mockSession('owner-1')
    await insertBot()
    const res = await GET(makeGetReq())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual([])
  })

  it('returns entries sorted by created_at desc', async () => {
    mockSession('owner-1')
    const bot = await insertBot()
    await DataSource.create({
      owner_id: 'owner-1',
      bot_id: bot._id.toString(),
      type: 'faq',
      title: 'First',
      content: 'First content',
      created_at: new Date('2026-01-01'),
    })
    await DataSource.create({
      owner_id: 'owner-1',
      bot_id: bot._id.toString(),
      type: 'faq',
      title: 'Second',
      content: 'Second content',
      created_at: new Date('2026-01-02'),
    })

    const res = await GET(makeGetReq())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(2)
    expect(data[0].title).toBe('Second')
    expect(data[1].title).toBe('First')
  })

  it('filters by type=faq', async () => {
    mockSession('owner-1')
    const bot = await insertBot()
    await insertDataSource({ owner_id: 'owner-1', bot_id: bot._id.toString(), type: 'faq', title: 'FAQ' })
    await insertDataSource({ owner_id: 'owner-1', bot_id: bot._id.toString(), type: 'file', title: 'File' })

    const res = await GET(makeGetReq('?type=faq'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(1)
    expect(data[0].type).toBe('faq')
  })

  it('filters by type=file', async () => {
    mockSession('owner-1')
    const bot = await insertBot()
    await insertDataSource({ owner_id: 'owner-1', bot_id: bot._id.toString(), type: 'faq', title: 'FAQ' })
    await insertDataSource({ owner_id: 'owner-1', bot_id: bot._id.toString(), type: 'file', title: 'File' })

    const res = await GET(makeGetReq('?type=file'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(1)
    expect(data[0].type).toBe('file')
  })

  it('returns all entries when type filter is unknown value', async () => {
    mockSession('owner-1')
    const bot = await insertBot()
    await insertDataSource({ owner_id: 'owner-1', bot_id: bot._id.toString(), type: 'faq' })
    await insertDataSource({ owner_id: 'owner-1', bot_id: bot._id.toString(), type: 'file' })

    const res = await GET(makeGetReq('?type=unknown'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(2)
  })

  it('returns 500 when DB throws', async () => {
    mockSession('owner-1')
    await insertBot()
    vi.spyOn(DataSource, 'find').mockImplementation(() => {
      throw new Error('DB error')
    })
    const res = await GET(makeGetReq())
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toBe('Internal server error')
  })
})

describe('POST /api/data-sources', () => {
  it('returns 401 when no session', async () => {
    mockedAuth.mockResolvedValue(null)
    const res = await POST(makePostReq({ title: 'T', content: 'C' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when body is invalid JSON', async () => {
    mockSession('owner-1')
    const req = new Request('http://localhost/api/data-sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Invalid JSON')
  })

  it('returns 400 when body is null JSON', async () => {
    mockSession('owner-1')
    const req = new Request('http://localhost/api/data-sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'null',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Invalid request body')
  })

  it('returns 400 when title is missing', async () => {
    mockSession('owner-1')
    const res = await POST(makePostReq({ content: 'C' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/title/i)
  })

  it('returns 400 when title is whitespace only', async () => {
    mockSession('owner-1')
    const res = await POST(makePostReq({ title: '   ', content: 'C' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/title/i)
  })

  it('returns 400 when title exceeds 200 chars', async () => {
    mockSession('owner-1')
    const res = await POST(makePostReq({ title: 'x'.repeat(201), content: 'C' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/200/i)
  })

  it('returns 400 when content is missing', async () => {
    mockSession('owner-1')
    const res = await POST(makePostReq({ title: 'T' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/content/i)
  })

  it('returns 400 when content is whitespace only', async () => {
    mockSession('owner-1')
    const res = await POST(makePostReq({ title: 'T', content: '   ' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/content/i)
  })

  it('returns 404 when owner has no bot', async () => {
    mockSession('owner-no-bot')
    const res = await POST(makePostReq({ title: 'T', content: 'C' }))
    expect(res.status).toBe(404)
  })

  it('returns 201 and creates FAQ entry with correct fields', async () => {
    mockSession('owner-1')
    await insertBot()

    const res = await POST(makePostReq({ title: '  My Question  ', content: '  My Answer  ' }))
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.type).toBe('faq')
    expect(data.title).toBe('My Question')
    expect(data.content).toBe('My Answer')
    expect(data.file_size).toBeNull()
    expect(data.original_filename).toBeNull()
    expect(data.id).toBeDefined()
    expect(data.created_at).toBeDefined()
  })

  it('does not expose owner_id in response', async () => {
    mockSession('owner-1')
    await insertBot()

    const res = await POST(makePostReq({ title: 'T', content: 'C' }))
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.owner_id).toBeUndefined()
  })

  it('returns 500 when DB throws', async () => {
    mockSession('owner-1')
    await insertBot()
    vi.spyOn(DataSource, 'create').mockRejectedValueOnce(new Error('DB error'))
    const res = await POST(makePostReq({ title: 'T', content: 'C' }))
    expect(res.status).toBe(500)
  })
})
