import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectDB } from '@/lib/mongodb'
import { Bot } from '@/lib/models/Bot'
import { ChatEvent } from '@/lib/models/ChatEvent'

const VALID_PERIODS = ['7d', '30d', 'all'] as const
type Period = (typeof VALID_PERIODS)[number]

function getPeriodStart(period: Period): Date | null {
  if (period === 'all') return null
  const days = period === '7d' ? 7 : 30
  const start = new Date()
  start.setDate(start.getDate() - days)
  start.setHours(0, 0, 0, 0)
  return start
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const owner_id = session.user.id

  const { searchParams } = new URL(req.url)
  const periodParam = searchParams.get('period') ?? '7d'
  const period = VALID_PERIODS.includes(periodParam as Period)
    ? (periodParam as Period)
    : '7d'

  try {
    await connectDB()
    const bot = await Bot.findOne({ owner_id })
    if (!bot) {
      return NextResponse.json({ error: 'No bot found' }, { status: 404 })
    }

    const bot_id = bot._id.toString()
    const periodStart = getPeriodStart(period)

    const matchStage: Record<string, unknown> = { bot_id }
    if (periodStart) {
      matchStage.created_at = { $gte: periodStart }
    }

    // Totals
    const [totals] = await ChatEvent.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          total_messages: { $sum: 1 },
          total_conversations: {
            $sum: { $cond: [{ $eq: ['$event_type', 'conversation_start'] }, 1, 0] },
          },
        },
      },
    ])

    const total_messages = totals?.total_messages ?? 0
    const total_conversations = totals?.total_conversations ?? 0
    const avg_messages_per_conversation =
      total_conversations > 0
        ? Math.round((total_messages / total_conversations) * 10) / 10
        : 0

    // Daily breakdown
    const dailyAgg = await ChatEvent.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
            event_type: '$event_type',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.date': 1 } },
    ])

    // Build daily maps
    const messagesMap = new Map<string, number>()
    const conversationsMap = new Map<string, number>()

    for (const row of dailyAgg) {
      const date = row._id.date as string
      if (row._id.event_type === 'conversation_start') {
        conversationsMap.set(date, (conversationsMap.get(date) ?? 0) + row.count)
      }
      messagesMap.set(date, (messagesMap.get(date) ?? 0) + row.count)
    }

    // Merge into sorted array of all dates
    const dateSet = new Set<string>()
    messagesMap.forEach((_, k) => dateSet.add(k))
    conversationsMap.forEach((_, k) => dateSet.add(k))
    const allDates = Array.from(dateSet).sort()
    const daily_messages = allDates.map((date) => ({ date, count: messagesMap.get(date) ?? 0 }))
    const daily_conversations = allDates.map((date) => ({ date, count: conversationsMap.get(date) ?? 0 }))

    return NextResponse.json({
      total_conversations,
      total_messages,
      avg_messages_per_conversation,
      daily_messages,
      daily_conversations,
      period,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
