import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import type { MockedFunction } from 'vitest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn().mockResolvedValue(undefined) }))
vi.mock('@/auth', () => ({ auth: vi.fn() }))

import { DELETE } from '../route'
import { auth } from '@/auth'
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

function makeReq(id: string) {
  return {
    request: new Request(`http://localhost/api/data-sources/${id}`, { method: 'DELETE' }),
    params: { id },
  }
}

async function insertEntry(owner_id = 'owner-1') {
  return DataSource.create({
    owner_id,
    bot_id: 'bot-1',
    type: 'faq' as const,
    title: 'Test entry',
    content: 'Test content',
  })
}

describe('DELETE /api/data-sources/[id]', () => {
  it('returns 401 when no session', async () => {
    mockedAuth.mockResolvedValue(null)
    const { request, params } = makeReq(new mongoose.Types.ObjectId().toString())
    const res = await DELETE(request, { params })
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid ObjectId', async () => {
    mockSession('owner-1')
    const { request, params } = makeReq('not-an-id')
    const res = await DELETE(request, { params })
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Invalid ID')
  })

  it('returns 404 when entry does not exist', async () => {
    mockSession('owner-1')
    const fakeId = new mongoose.Types.ObjectId().toString()
    const { request, params } = makeReq(fakeId)
    const res = await DELETE(request, { params })
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toBe('Not found')
  })

  it('returns 404 when entry belongs to a different owner', async () => {
    mockSession('owner-1')
    const entry = await insertEntry('owner-2')
    const { request, params } = makeReq(entry._id.toString())
    const res = await DELETE(request, { params })
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toBe('Not found')
  })

  it('returns 200 and deletes entry successfully', async () => {
    mockSession('owner-1')
    const entry = await insertEntry('owner-1')
    const { request, params } = makeReq(entry._id.toString())
    const res = await DELETE(request, { params })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
  })

  it('entry is gone from DB after successful delete', async () => {
    mockSession('owner-1')
    const entry = await insertEntry('owner-1')
    const { request, params } = makeReq(entry._id.toString())
    await DELETE(request, { params })

    const found = await DataSource.findById(entry._id)
    expect(found).toBeNull()
  })

  it('returns 500 when DB throws', async () => {
    mockSession('owner-1')
    const fakeId = new mongoose.Types.ObjectId().toString()
    vi.spyOn(DataSource, 'findOneAndDelete').mockRejectedValueOnce(new Error('DB error'))
    const { request, params } = makeReq(fakeId)
    const res = await DELETE(request, { params })
    expect(res.status).toBe(500)
  })
})
