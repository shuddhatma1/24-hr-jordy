import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import { Bot } from '@/lib/models/Bot'

/** CORS headers — this endpoint is public and used by the embed widget from external origins */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

/** Preflight handler for CORS */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function GET(
  _req: Request,
  { params }: { params: { bot_id: string } }
) {
  const { bot_id } = params

  if (!mongoose.Types.ObjectId.isValid(bot_id)) {
    return NextResponse.json({ error: 'Bot not found' }, { status: 404, headers: corsHeaders })
  }

  try {
    await connectDB()
    const bot = await Bot.findOne({ _id: bot_id })
    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404, headers: corsHeaders })
    }
    return NextResponse.json({
      bot_name: bot.bot_name,
      sport: bot.sport,
      league: bot.league,
      welcome_message: bot.welcome_message ?? null,
      primary_color: bot.primary_color ?? null,
    }, { headers: corsHeaders })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders })
  }
}
