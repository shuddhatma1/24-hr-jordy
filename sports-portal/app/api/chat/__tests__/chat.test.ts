import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach, vi } from 'vitest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn().mockResolvedValue(undefined) }))
vi.mock('@/lib/models/DataSource', () => ({
  DataSource: { find: vi.fn().mockResolvedValue([]) },
}))

// Use vi.hoisted so these refs are available inside the vi.mock factory (which is hoisted)
const { mockSendMessageStream, mockStartChat, mockGetGenerativeModel } = vi.hoisted(() => {
  const mockSendMessageStream = vi.fn()
  const mockStartChat = vi.fn(() => ({ sendMessageStream: mockSendMessageStream }))
  const mockGetGenerativeModel = vi.fn(() => ({ startChat: mockStartChat }))
  return { mockSendMessageStream, mockStartChat, mockGetGenerativeModel }
})

vi.mock('@google/generative-ai', () => ({
  // Use function keyword (not arrow function) so Vitest handles `new` correctly
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  GoogleGenerativeAI: vi.fn(function (this: any) {
    this.getGenerativeModel = mockGetGenerativeModel
  }),
}))

import { POST } from '../route'
import { Bot } from '@/lib/models/Bot'
import { DataSource } from '@/lib/models/DataSource'

let mongod: MongoMemoryServer

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
})

beforeEach(() => {
  // Re-establish mock chain after vi.clearAllMocks() (clearAllMocks resets implementations)
  mockGetGenerativeModel.mockReturnValue({ startChat: mockStartChat })
  mockStartChat.mockReturnValue({ sendMessageStream: mockSendMessageStream })
})

afterEach(async () => {
  await Promise.all(
    Object.values(mongoose.connection.collections).map((c) => c.deleteMany({}))
  )
  vi.clearAllMocks()
  vi.unstubAllEnvs()
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

async function insertBot() {
  return Bot.create({
    owner_id: 'owner-1',
    bot_name: 'Test Bot',
    sport: 'soccer',
    league: 'english-premier-league',
  })
}

/** Sets up mockSendMessageStream to emit the given tokens then done. */
function mockGeminiStream(tokens: string[]) {
  vi.stubEnv('GEMINI_API_KEY', 'test-key')
  async function* gen() {
    for (const t of tokens) {
      yield { text: () => t }
    }
  }
  mockSendMessageStream.mockResolvedValue({ stream: gen() })
}

async function readSSE(res: Response): Promise<string> {
  return res.text()
}

describe('POST /api/chat — validation', () => {
  it('returns 400 when bot_id is missing', async () => {
    const res = await POST(makeReq({ messages: [{ role: 'user', content: 'hi' }] }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('bot_id is required')
  })

  it('returns 404 for invalid ObjectId format', async () => {
    const res = await POST(makeReq({ bot_id: 'not-an-objectid', messages: [{ role: 'user', content: 'hi' }] }))
    expect(res.status).toBe(404)
    expect((await res.json()).error).toBe('Bot not found')
  })

  it('returns 400 when messages is not an array', async () => {
    const res = await POST(makeReq({ bot_id: new mongoose.Types.ObjectId().toString(), messages: 'bad' }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('messages must be a non-empty array')
  })

  it('returns 400 when messages array is empty', async () => {
    const res = await POST(makeReq({ bot_id: new mongoose.Types.ObjectId().toString(), messages: [] }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('messages must be a non-empty array')
  })

  it('returns 400 when a message has invalid role', async () => {
    const res = await POST(makeReq({
      bot_id: new mongoose.Types.ObjectId().toString(),
      messages: [{ role: 'system', content: 'hi' }],
    }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('Invalid message role')
  })

  it('returns 400 when message content is empty string', async () => {
    const res = await POST(makeReq({
      bot_id: new mongoose.Types.ObjectId().toString(),
      messages: [{ role: 'user', content: '   ' }],
    }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('Invalid message content')
  })

  it('returns 400 when body is null JSON', async () => {
    const res = await POST(makeRawReq('null'))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('Invalid request body')
  })

  it('returns 413 when body exceeds 50kb', async () => {
    const bigMessages = Array.from({ length: 500 }, (_, i) => ({
      role: 'user',
      content: 'x'.repeat(100) + i,
    }))
    const res = await POST(makeReq({ bot_id: 'anything', messages: bigMessages }))
    expect(res.status).toBe(413)
    expect((await res.json()).error).toBe('Payload too large')
  })
})

describe('POST /api/chat — DB lookups', () => {
  it('returns 404 when bot_id is valid ObjectId but not in DB', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString()
    const res = await POST(makeReq({ bot_id: fakeId, messages: [{ role: 'user', content: 'hi' }] }))
    expect(res.status).toBe(404)
    expect((await res.json()).error).toBe('Bot not found')
  })

  it('returns 500 when GEMINI_API_KEY is not set', async () => {
    const bot = await insertBot()
    // GEMINI_API_KEY intentionally not set (unstubAllEnvs ran in afterEach)
    const res = await POST(makeReq({ bot_id: bot._id.toString(), messages: [{ role: 'user', content: 'hi' }] }))
    expect(res.status).toBe(500)
    expect((await res.json()).error).toBe('Bot configuration error')
  })
})

describe('POST /api/chat — streaming', () => {
  it('returns 200 with text/event-stream on happy path', async () => {
    const bot = await insertBot()
    mockGeminiStream(['hello', ' world'])

    const res = await POST(makeReq({ bot_id: bot._id.toString(), messages: [{ role: 'user', content: 'hi' }] }))
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('text/event-stream')
    expect(res.headers.get('x-accel-buffering')).toBe('no')

    const text = await readSSE(res)
    expect(text).toContain('data: {"token":"hello"}')
    expect(text).toContain('data: {"token":" world"}')
    expect(text).toContain('data: [DONE]')
  })

  it('strips citation markers from Gemini output', async () => {
    const bot = await insertBot()
    vi.stubEnv('GEMINI_API_KEY', 'test-key')
    async function* gen() {
      yield { text: () => 'Arsenal won[1] the match[23].' }
    }
    mockSendMessageStream.mockResolvedValue({ stream: gen() })

    const res = await POST(makeReq({ bot_id: bot._id.toString(), messages: [{ role: 'user', content: 'hi' }] }))
    const text = await readSSE(res)
    expect(text).toContain('"token":"Arsenal won the match."')
    expect(text).not.toContain('[1]')
    expect(text).not.toContain('[23]')
  })

  it('converts assistant role to model for Gemini history', async () => {
    const bot = await insertBot()
    mockGeminiStream(['ok'])

    await POST(makeReq({
      bot_id: bot._id.toString(),
      messages: [
        { role: 'user', content: 'first' },
        { role: 'assistant', content: 'reply' },
        { role: 'user', content: 'second' },
      ],
    }))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const historyArg = (mockStartChat.mock.calls as any)[0][0].history
    expect(historyArg).toHaveLength(2)
    expect(historyArg[0]).toEqual({ role: 'user', parts: [{ text: 'first' }] })
    expect(historyArg[1]).toEqual({ role: 'model', parts: [{ text: 'reply' }] })
    expect(mockSendMessageStream).toHaveBeenCalledWith('second')
  })
})

describe('POST /api/chat — DataSource injection', () => {
  it('includes DataSource content in system instruction when entries exist', async () => {
    const bot = await insertBot()
    vi.mocked(DataSource.find).mockResolvedValueOnce([
      { title: 'FAQ 1', content: 'Answer 1', _id: 'id1' },
      { title: 'FAQ 2', content: 'Answer 2', _id: 'id2' },
    ] as never)
    mockGeminiStream([])

    await POST(makeReq({ bot_id: bot._id.toString(), messages: [{ role: 'user', content: 'hi' }] }))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const modelArgs = (mockGetGenerativeModel.mock.calls as any)[0][0]
    expect(modelArgs.systemInstruction).toContain('FAQ 1:\nAnswer 1')
    expect(modelArgs.systemInstruction).toContain('FAQ 2:\nAnswer 2')
  })

  it('proceeds normally when DataSource.find throws (non-fatal)', async () => {
    const bot = await insertBot()
    vi.mocked(DataSource.find).mockRejectedValueOnce(new Error('DB error'))
    mockGeminiStream(['ok'])

    const res = await POST(makeReq({ bot_id: bot._id.toString(), messages: [{ role: 'user', content: 'hi' }] }))
    expect(res.status).toBe(200)
  })
})
