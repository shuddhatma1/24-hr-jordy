import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import type { MockedFunction } from 'vitest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn().mockResolvedValue(undefined) }))
vi.mock('@/auth', () => ({ auth: vi.fn() }))
vi.mock('pdf-parse/lib/pdf-parse', () => ({
  default: vi.fn().mockResolvedValue({ text: 'Extracted PDF text content' }),
}))

import { POST } from '../route'
import { auth } from '@/auth'
import { Bot } from '@/lib/models/Bot'
import { DataSource } from '@/lib/models/DataSource'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error — no type declarations for internal pdf-parse module
import pdfParse from 'pdf-parse/lib/pdf-parse'

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

function makeUploadRequest(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return new Request('http://localhost/api/data-sources/upload', {
    method: 'POST',
    body: formData,
  })
}

function makeTxtFile(content = 'Hello world', name = 'test.txt') {
  return new File([content], name, { type: 'text/plain' })
}

function makeCsvFile(content = 'col1,col2\nval1,val2', name = 'data.csv') {
  return new File([content], name, { type: 'text/csv' })
}

function makePdfFile(name = 'document.pdf') {
  return new File([new ArrayBuffer(100)], name, { type: 'application/pdf' })
}

describe('POST /api/data-sources/upload', () => {
  it('returns 401 when no session', async () => {
    mockedAuth.mockResolvedValue(null)
    const res = await POST(makeUploadRequest(makeTxtFile()))
    expect(res.status).toBe(401)
  })

  it('returns 400 when no file in form', async () => {
    mockSession('owner-1')
    const formData = new FormData()
    const req = new Request('http://localhost/api/data-sources/upload', {
      method: 'POST',
      body: formData,
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('No file provided')
  })

  it('returns 400 for unsupported extension (.jpg)', async () => {
    mockSession('owner-1')
    const file = new File(['image data'], 'photo.jpg', { type: 'image/jpeg' })
    const res = await POST(makeUploadRequest(file))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/PDF, CSV, and TXT/i)
  })

  it('returns 400 for empty file', async () => {
    mockSession('owner-1')
    const file = new File([], 'empty.txt', { type: 'text/plain' })
    const res = await POST(makeUploadRequest(file))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('File is empty')
  })

  it('returns 400 when file exceeds 5MB', async () => {
    mockSession('owner-1')
    const bigContent = 'x'.repeat(5 * 1024 * 1024 + 1)
    const file = new File([bigContent], 'big.txt', { type: 'text/plain' })
    const res = await POST(makeUploadRequest(file))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/5MB/i)
  })

  it('accepts file exactly at 5MB limit', async () => {
    mockSession('owner-1')
    await insertBot()
    const content = 'x'.repeat(5 * 1024 * 1024)
    const file = new File([content], 'exact.txt', { type: 'text/plain' })
    const res = await POST(makeUploadRequest(file))
    expect(res.status).toBe(201)
  })

  it('returns 201 for TXT file and stores content as text', async () => {
    mockSession('owner-1')
    await insertBot()
    const file = makeTxtFile('Hello world content')
    const res = await POST(makeUploadRequest(file))
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.type).toBe('file')
    expect(data.content).toBe('Hello world content')
    expect(data.original_filename).toBe('test.txt')
    expect(data.file_size).toBeGreaterThan(0)
  })

  it('returns 201 for CSV file and stores content as text', async () => {
    mockSession('owner-1')
    await insertBot()
    const file = makeCsvFile('name,score\nAlice,100')
    const res = await POST(makeUploadRequest(file))
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.type).toBe('file')
    expect(data.content).toBe('name,score\nAlice,100')
  })

  it('returns 201 for PDF file and calls pdf-parse', async () => {
    mockSession('owner-1')
    await insertBot()
    const file = makePdfFile()
    const res = await POST(makeUploadRequest(file))
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.type).toBe('file')
    expect(data.content).toBe('Extracted PDF text content')
  })

  it('returns 422 when extracted text is empty', async () => {
    mockSession('owner-1')
    vi.mocked(pdfParse).mockResolvedValueOnce({ text: '   ' } as never)
    const file = makePdfFile('blank.pdf')
    const res = await POST(makeUploadRequest(file))
    expect(res.status).toBe(422)
    const data = await res.json()
    expect(data.error).toMatch(/no text/i)
  })

  it('returns 422 when pdf-parse throws', async () => {
    mockSession('owner-1')
    vi.mocked(pdfParse).mockRejectedValueOnce(new Error('corrupt pdf'))
    const file = makePdfFile('corrupt.pdf')
    const res = await POST(makeUploadRequest(file))
    expect(res.status).toBe(422)
    const data = await res.json()
    expect(data.error).toMatch(/extract/i)
  })

  it('returns 404 when owner has no bot', async () => {
    mockSession('owner-no-bot')
    const res = await POST(makeUploadRequest(makeTxtFile()))
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toBe('No bot found')
  })

  it('returned entry has correct shape', async () => {
    mockSession('owner-1')
    await insertBot()
    const file = makeTxtFile('content here', 'myfile.txt')
    const res = await POST(makeUploadRequest(file))
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.id).toBeDefined()
    expect(data.type).toBe('file')
    expect(data.title).toBe('myfile.txt')
    expect(data.original_filename).toBe('myfile.txt')
    expect(data.file_size).toBe(file.size)
    expect(data.created_at).toBeDefined()
    expect(data.owner_id).toBeUndefined()
  })

  it('returns 500 when DataSource.create throws', async () => {
    mockSession('owner-1')
    await insertBot()
    vi.spyOn(DataSource, 'create').mockRejectedValueOnce(new Error('DB error'))
    const res = await POST(makeUploadRequest(makeTxtFile()))
    expect(res.status).toBe(500)
  })
})
