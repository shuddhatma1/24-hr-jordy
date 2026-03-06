import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('connectDB', () => {
  const ORIGINAL_URI = process.env.MONGODB_URI

  beforeEach(() => {
    vi.resetModules()
    ;(global as Record<string, unknown>)._mongoose = undefined
  })

  afterEach(() => {
    vi.restoreAllMocks()
    if (ORIGINAL_URI) {
      process.env.MONGODB_URI = ORIGINAL_URI
    } else {
      delete process.env.MONGODB_URI
    }
  })

  it('throws if MONGODB_URI is not set', async () => {
    delete process.env.MONGODB_URI
    const { connectDB } = await import('../mongodb')
    await expect(connectDB()).rejects.toThrow('MONGODB_URI environment variable is not set')
  })

  it('calls mongoose.connect with MONGODB_URI', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test'
    const mongooseModule = await import('mongoose')
    vi.spyOn(mongooseModule.default, 'connect').mockResolvedValueOnce(mongooseModule.default)
    const { connectDB } = await import('../mongodb')
    await connectDB()
    expect(mongooseModule.default.connect).toHaveBeenCalledWith('mongodb://localhost:27017/test')
  })

  it('returns cached connection on second call without reconnecting', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test'
    const mongooseModule = await import('mongoose')
    const connectSpy = vi
      .spyOn(mongooseModule.default, 'connect')
      .mockResolvedValue(mongooseModule.default)
    const { connectDB } = await import('../mongodb')
    await connectDB()
    await connectDB()
    expect(connectSpy).toHaveBeenCalledTimes(1)
  })

  it('resets promise on connection error so next call retries', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test'
    const mongooseModule = await import('mongoose')
    const connectSpy = vi
      .spyOn(mongooseModule.default, 'connect')
      .mockRejectedValueOnce(new Error('connection failed'))
      .mockResolvedValueOnce(mongooseModule.default)
    const { connectDB } = await import('../mongodb')
    await expect(connectDB()).rejects.toThrow('connection failed')
    const result = await connectDB()
    expect(result).toBe(mongooseModule.default)
    expect(connectSpy).toHaveBeenCalledTimes(2)
  })
})
