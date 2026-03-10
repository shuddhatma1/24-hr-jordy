import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectDB } from '@/lib/mongodb'
import { Bot } from '@/lib/models/Bot'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const owner_id = session.user.id

  try {
    await connectDB()
    const bot = await Bot.findOne({ owner_id })
    if (!bot) {
      return NextResponse.json({ error: 'No bot found' }, { status: 404 })
    }
    return NextResponse.json({
      bot_id: bot._id.toString(),
      bot_name: bot.bot_name,
      sport: bot.sport,
      league: bot.league,
      created_at: bot.created_at,
      welcome_message: bot.welcome_message ?? null,
      persona: bot.persona ?? null,
      primary_color: bot.primary_color ?? null,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

const VALID_PERSONAS = ['friendly', 'professional', 'enthusiastic'] as const

export async function PUT(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const owner_id = session.user.id

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { bot_name, welcome_message, persona, primary_color } = body as Record<string, unknown>

  if (typeof bot_name !== 'string' || !bot_name.trim()) {
    return NextResponse.json({ error: 'bot_name is required' }, { status: 400 })
  }

  if (persona != null && !VALID_PERSONAS.includes(persona as (typeof VALID_PERSONAS)[number])) {
    return NextResponse.json({ error: 'Invalid persona' }, { status: 400 })
  }

  if (primary_color != null) {
    if (typeof primary_color !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(primary_color)) {
      return NextResponse.json(
        { error: 'Invalid primary_color: must be a 6-digit hex color (e.g. #3B82F6)' },
        { status: 400 }
      )
    }
  }

  if (welcome_message != null) {
    if (typeof welcome_message !== 'string' || welcome_message.length > 300) {
      return NextResponse.json(
        { error: 'welcome_message must be at most 300 characters' },
        { status: 400 }
      )
    }
  }

  try {
    await connectDB()
    const bot = await Bot.findOneAndUpdate(
      { owner_id },
      {
        $set: {
          bot_name: bot_name.trim(),
          welcome_message: (welcome_message as string | null | undefined) || null,
          persona: (persona as string | null | undefined) || null,
          primary_color: (primary_color as string | null | undefined) || null,
        },
      },
      { new: true }
    )
    if (!bot) {
      return NextResponse.json({ error: 'No bot found' }, { status: 404 })
    }
    return NextResponse.json({
      bot_id: bot._id.toString(),
      bot_name: bot.bot_name,
      sport: bot.sport,
      league: bot.league,
      created_at: bot.created_at,
      welcome_message: bot.welcome_message ?? null,
      persona: bot.persona ?? null,
      primary_color: bot.primary_color ?? null,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
