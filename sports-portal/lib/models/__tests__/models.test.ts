import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { User } from '../User'
import { Bot } from '../Bot'
import { DataSource } from '../DataSource'

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

  it('rejects invalid email format', async () => {
    await expect(User.create({ email: 'notanemail', passwordHash: 'hash' })).rejects.toThrow()
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

describe('DataSource model', () => {
  it('saves a valid FAQ entry', async () => {
    const ds = await DataSource.create({
      owner_id: 'owner-1',
      bot_id: 'bot-1',
      type: 'faq',
      title: 'Test question',
      content: 'Test answer',
    })
    expect(ds.owner_id).toBe('owner-1')
    expect(ds.bot_id).toBe('bot-1')
    expect(ds.type).toBe('faq')
    expect(ds.title).toBe('Test question')
    expect(ds.content).toBe('Test answer')
    expect(ds.created_at).toBeInstanceOf(Date)
    expect(ds.file_size).toBeUndefined()
    expect(ds.original_filename).toBeUndefined()
  })

  it('saves a valid file entry with optional fields', async () => {
    const ds = await DataSource.create({
      owner_id: 'owner-1',
      bot_id: 'bot-1',
      type: 'file',
      title: 'roster.csv',
      content: 'name,score\nAlice,100',
      file_size: 1024,
      original_filename: 'roster.csv',
    })
    expect(ds.type).toBe('file')
    expect(ds.file_size).toBe(1024)
    expect(ds.original_filename).toBe('roster.csv')
  })

  it('requires owner_id', async () => {
    await expect(
      DataSource.create({ bot_id: 'b1', type: 'faq', title: 'T', content: 'C' })
    ).rejects.toThrow()
  })

  it('requires bot_id', async () => {
    await expect(
      DataSource.create({ owner_id: 'o1', type: 'faq', title: 'T', content: 'C' })
    ).rejects.toThrow()
  })

  it('requires title', async () => {
    await expect(
      DataSource.create({ owner_id: 'o1', bot_id: 'b1', type: 'faq', content: 'C' })
    ).rejects.toThrow()
  })

  it('requires content', async () => {
    await expect(
      DataSource.create({ owner_id: 'o1', bot_id: 'b1', type: 'faq', title: 'T' })
    ).rejects.toThrow()
  })

  it('rejects invalid type', async () => {
    await expect(
      DataSource.create({ owner_id: 'o1', bot_id: 'b1', type: 'invalid', title: 'T', content: 'C' })
    ).rejects.toThrow()
  })

  it('enforces title maxlength of 200', async () => {
    await expect(
      DataSource.create({
        owner_id: 'o1',
        bot_id: 'b1',
        type: 'faq',
        title: 'x'.repeat(201),
        content: 'C',
      })
    ).rejects.toThrow()
  })
})
