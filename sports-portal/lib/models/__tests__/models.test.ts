import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { User } from '../User'
import { Bot } from '../Bot'

let mongod: MongoMemoryServer

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
})

afterEach(async () => {
  await Promise.all(
    Object.values(mongoose.connection.collections).map((c) => c.deleteMany({}))
  )
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})

describe('User model', () => {
  it('saves a valid user', async () => {
    const user = await User.create({ email: 'test@example.com', passwordHash: 'hash123' })
    expect(user.email).toBe('test@example.com')
    expect(user.passwordHash).toBe('hash123')
    expect(user.createdAt).toBeInstanceOf(Date)
  })

  it('requires email', async () => {
    await expect(User.create({ passwordHash: 'hash123' })).rejects.toThrow()
  })

  it('requires passwordHash', async () => {
    await expect(User.create({ email: 'a@b.com' })).rejects.toThrow()
  })

  it('enforces unique email', async () => {
    await User.create({ email: 'dup@example.com', passwordHash: 'hash1' })
    await expect(
      User.create({ email: 'dup@example.com', passwordHash: 'hash2' })
    ).rejects.toThrow()
  })

  it('lowercases email', async () => {
    const user = await User.create({ email: 'UPPER@EXAMPLE.COM', passwordHash: 'hash' })
    expect(user.email).toBe('upper@example.com')
  })
})

describe('Bot model', () => {
  it('saves a valid bot', async () => {
    const bot = await Bot.create({
      owner_id: 'user-1',
      bot_name: 'EPL Bot',
      sport: 'soccer',
      league: 'english-premier-league',
      bot_endpoint_url: 'http://localhost:3001/chat',
    })
    expect(bot.owner_id).toBe('user-1')
    expect(bot.bot_name).toBe('EPL Bot')
    expect(bot.created_at).toBeInstanceOf(Date)
  })

  it('requires owner_id', async () => {
    await expect(
      Bot.create({ bot_name: 'x', sport: 'soccer', league: 'epl', bot_endpoint_url: 'http://x' })
    ).rejects.toThrow()
  })

  it('requires bot_name', async () => {
    await expect(
      Bot.create({ owner_id: 'u1', sport: 'soccer', league: 'epl', bot_endpoint_url: 'http://x' })
    ).rejects.toThrow()
  })

  it('requires sport', async () => {
    await expect(
      Bot.create({ owner_id: 'u1', bot_name: 'x', league: 'epl', bot_endpoint_url: 'http://x' })
    ).rejects.toThrow()
  })

  it('requires league', async () => {
    await expect(
      Bot.create({ owner_id: 'u1', bot_name: 'x', sport: 'soccer', bot_endpoint_url: 'http://x' })
    ).rejects.toThrow()
  })

  it('requires bot_endpoint_url', async () => {
    await expect(
      Bot.create({ owner_id: 'u1', bot_name: 'x', sport: 'soccer', league: 'epl' })
    ).rejects.toThrow()
  })

  it('enforces one bot per owner (unique owner_id)', async () => {
    await Bot.create({
      owner_id: 'user-dup',
      bot_name: 'Bot 1',
      sport: 'soccer',
      league: 'epl',
      bot_endpoint_url: 'http://x',
    })
    await expect(
      Bot.create({
        owner_id: 'user-dup',
        bot_name: 'Bot 2',
        sport: 'nba',
        league: 'nba',
        bot_endpoint_url: 'http://y',
      })
    ).rejects.toThrow()
  })
})
