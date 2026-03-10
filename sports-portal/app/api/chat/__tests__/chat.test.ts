import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn().mockResolvedValue(undefined) }))
vi.mock('@/lib/models/DataSource', () => ({
  DataSource: { find: vi.fn().mockResolvedValue([]) },
}))

import { POST } from '../route'
import { Bot } from '@/lib/models/Bot'
import { DataSource } from '@/lib/models/DataSource'

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
  vi.unstubAllGlobals()
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})

function makeReq(body: unknown) {
  return new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeRawReq(raw: string) {
  return new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: raw,
  })
}

async function insertBot(overrides: Partial<{
  owner_id: string
  bot_name: string
  sport: string
  league: string
  bot_endpoint_url: string
}> = {}) {
  return Bot.create({
    owner_id: 'owner-1',
    bot_name: 'Test Bot',
    sport: 'soccer',
    league: 'english-premier-league',
    bot_endpoint_url: 'http://localhost:3001/chat',
    ...overrides,
  })
}

function mockBotFetch(stream: ReadableStream) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(stream, { status: 200 }))
  )
}

describe('POST /api/chat', () => {
  it('returns 200 with text/event-stream and pipes stream body', async () => {
    const bot = await insertBot()
    const stream = new ReadableStream({
      start(c) {
        c.enqueue(new TextEncoder().encode('data: {"token":"hello"}\n\n'))
        c.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
        c.close()
      },
    })
    mockBotFetch(stream)

    const res = await POST(makeReq({ bot_id: bot._id.toString(), messages: [{ role: 'user', content: 'hi' }] }))
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('text/event-stream')
    const text = await res.text()
    expect(text).toContain('{"token":"hello"}')
  })

  it('returns 404 when bot_id is a valid ObjectId but not in DB', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString()
    const res = await POST(makeReq({ bot_id: fakeId, messages: [] }))
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toBe('Bot not found')
  })

  it('returns 404 for invalid ObjectId format', async () => {
    const res = await POST(makeReq({ bot_id: 'not-an-objectid', messages: [] }))
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toBe('Bot not found')
  })

  it('returns 502 when bot endpoint throws (unreachable)', async () => {
    const bot = await insertBot()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')))

    const res = await POST(makeReq({ bot_id: bot._id.toString(), messages: [] }))
    expect(res.status).toBe(502)
    const data = await res.json()
    expect(data.error).toBe('Bot endpoint unreachable')
  })

  it('returns 502 when bot endpoint returns non-ok status', async () => {
    const bot = await insertBot()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 500 })))

    const res = await POST(makeReq({ bot_id: bot._id.toString(), messages: [] }))
    expect(res.status).toBe(502)
    const data = await res.json()
    expect(data.error).toBe('Bot endpoint error')
  })

  it('returns 413 when body exceeds 50kb', async () => {
    const bigMessages = Array.from({ length: 500 }, (_, i) => ({
      role: 'user',
      content: 'x'.repeat(100) + i,
    }))
    const res = await POST(makeReq({ bot_id: 'anything', messages: bigMessages }))
    expect(res.status).toBe(413)
    const data = await res.json()
    expect(data.error).toBe('Payload too large')
  })

  it('returns 400 when bot_id is missing', async () => {
    const res = await POST(makeReq({ messages: [] }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('bot_id is required')
  })

  it('returns 400 when messages is not an array', async () => {
    const res = await POST(makeReq({ bot_id: 'some-id', messages: 'not-an-array' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('messages must be an array')
  })

  it('returns 400 when body is null JSON', async () => {
    const res = await POST(makeRawReq('null'))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Invalid request body')
  })

  it('sends empty system_context when no DataSources exist', async () => {
    const bot = await insertBot()
    const stream = new ReadableStream({
      start(c) { c.enqueue(new TextEncoder().encode('data: [DONE]\n\n')); c.close() },
    })
    const fetchMock = vi.fn().mockResolvedValue(new Response(stream, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await POST(makeReq({ bot_id: bot._id.toString(), messages: [] }))

    const callBody = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(callBody.system_context).toBe('')
  })

  it('sends formatted system_context when DataSources exist', async () => {
    const bot = await insertBot()
    const stream = new ReadableStream({
      start(c) { c.enqueue(new TextEncoder().encode('data: [DONE]\n\n')); c.close() },
    })
    const fetchMock = vi.fn().mockResolvedValue(new Response(stream, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    vi.mocked(DataSource.find).mockResolvedValueOnce([
      { title: 'FAQ 1', content: 'Answer 1', _id: 'id1' },
      { title: 'FAQ 2', content: 'Answer 2', _id: 'id2' },
    ] as never)

    await POST(makeReq({ bot_id: bot._id.toString(), messages: [] }))

    const callBody = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(callBody.system_context).toBe('FAQ 1:\nAnswer 1\n\n---\n\nFAQ 2:\nAnswer 2')
  })

  it('proceeds normally when DataSource.find throws (non-fatal)', async () => {
    const bot = await insertBot()
    const stream = new ReadableStream({
      start(c) {
        c.enqueue(new TextEncoder().encode('data: {"token":"hi"}\n\n'))
        c.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
        c.close()
      },
    })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(stream, { status: 200 })))
    vi.mocked(DataSource.find).mockRejectedValueOnce(new Error('DB error'))

    const res = await POST(makeReq({ bot_id: bot._id.toString(), messages: [] }))
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('text/event-stream')
  })
})
