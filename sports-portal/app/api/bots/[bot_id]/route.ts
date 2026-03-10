import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import { Bot } from '@/lib/models/Bot'

export async function GET(
  _req: Request,
  { params }: { params: { bot_id: string } }
) {
  const { bot_id } = params

  if (!mongoose.Types.ObjectId.isValid(bot_id)) {
    return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
  }

  try {
    await connectDB()
    const bot = await Bot.findOne({ _id: bot_id })
    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
    }
    return NextResponse.json({
      bot_name: bot.bot_name,
      sport: bot.sport,
      league: bot.league,
      welcome_message: bot.welcome_message ?? null,
      primary_color: bot.primary_color ?? null,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
