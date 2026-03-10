import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectDB } from '@/lib/mongodb'
import { Bot } from '@/lib/models/Bot'
import { SUPPORTED_SPORTS, LEAGUES_BY_SPORT, Sport } from '@/lib/bot-registry'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const owner_id = session.user.id

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { bot_name, sport, league } = body as Record<string, unknown>

  if (!bot_name || typeof bot_name !== 'string' || bot_name.trim().length === 0) {
    return NextResponse.json({ error: 'bot_name is required' }, { status: 400 })
  }
  if (bot_name.trim().length > 100) {
    return NextResponse.json({ error: 'bot_name must be 100 characters or fewer' }, { status: 400 })
  }
  if (!sport || typeof sport !== 'string' || !(SUPPORTED_SPORTS as readonly string[]).includes(sport)) {
    return NextResponse.json({ error: 'Invalid sport' }, { status: 400 })
  }
  const validLeagues = LEAGUES_BY_SPORT[sport as Sport]?.map((l) => l.value) ?? []
  if (!league || typeof league !== 'string' || !validLeagues.includes(league)) {
    return NextResponse.json({ error: 'Invalid league for this sport' }, { status: 400 })
  }

  try {
    await connectDB()
    const bot = await Bot.create({
      owner_id,
      bot_name: bot_name.trim(),
      sport,
      league,
    })
    return NextResponse.json({ bot_id: bot._id.toString() }, { status: 201 })
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json({ error: 'You already have a bot configured' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
