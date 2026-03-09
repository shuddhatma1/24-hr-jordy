import type { Metadata } from 'next'
import mongoose from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import { Bot } from '@/lib/models/Bot'
import { LEAGUES_BY_SPORT, Sport } from '@/lib/bot-registry'
import ChatWindow from '@/components/chat/ChatWindow'

// Always render dynamically — bot data must be fresh on every request
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Sports Chatbot',
}

interface PageProps {
  params: { bot_id: string }
}

function getLeagueLabel(sport: string, league: string): string {
  const leagues = LEAGUES_BY_SPORT[sport as Sport] ?? []
  return leagues.find((l) => l.value === league)?.label ?? league
}

export default async function ChatPage({ params }: PageProps) {
  const { bot_id } = params

  if (!mongoose.Types.ObjectId.isValid(bot_id)) {
    return <BotNotFound />
  }

  try {
    await connectDB()
    const bot = await Bot.findById(bot_id).select('bot_name sport league')
    if (!bot) {
      return <BotNotFound />
    }

    const leagueLabel = getLeagueLabel(
      bot.sport as string,
      bot.league as string
    )

    return (
      <ChatWindow
        botId={bot_id}
        botName={bot.bot_name as string}
        leagueLabel={leagueLabel}
      />
    )
  } catch {
    return <ServerError />
  }
}

function BotNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <p className="text-sm text-gray-600">
        This chatbot doesn&apos;t exist or has been removed.
      </p>
    </div>
  )
}

function ServerError() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <p className="text-sm text-gray-600">
        Something went wrong. Please try again later.
      </p>
    </div>
  )
}
