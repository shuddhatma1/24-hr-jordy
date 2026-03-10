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
