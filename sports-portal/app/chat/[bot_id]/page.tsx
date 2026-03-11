import { cache } from 'react'
import type { Metadata } from 'next'
import mongoose from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import { Bot } from '@/lib/models/Bot'
import { LEAGUES_BY_SPORT, Sport } from '@/lib/bot-registry'
import ChatWindow from '@/components/chat/ChatWindow'

// Always render dynamically — bot data must be fresh on every request
export const dynamic = 'force-dynamic'

interface PageProps {
  params: { bot_id: string }
  searchParams?: { embed?: string }
}

type BotData = {
  bot_name: string
  sport: string
  league: string
  welcome_message?: string
  primary_color?: string
}

/**
 * React.cache deduplicates this call within a single render tree so
 * generateMetadata and ChatPage share one DB round-trip instead of two.
 * Throws on DB error (caller catches); returns null when bot is not found.
 */
const fetchBotData = cache(async (bot_id: string): Promise<BotData | null> => {
  await connectDB()
  return Bot.findById(bot_id)
    .select('bot_name sport league welcome_message primary_color')
    .lean<BotData>()
})

function getLeagueLabel(sport: string, league: string): string {
  const leagues = LEAGUES_BY_SPORT[sport as Sport] ?? []
  return leagues.find((l) => l.value === league)?.label ?? league
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  if (!mongoose.Types.ObjectId.isValid(params.bot_id)) {
    return { title: 'Sports Chatbot' }
  }
  try {
    const bot = await fetchBotData(params.bot_id)
    if (!bot) return { title: 'Sports Chatbot' }
    return { title: `${bot.bot_name} — Sports Chatbot` }
  } catch {
    return { title: 'Sports Chatbot' }
  }
}

export default async function ChatPage({ params, searchParams }: PageProps) {
  const { bot_id } = params

  if (!mongoose.Types.ObjectId.isValid(bot_id)) {
    return <BotNotFound />
  }

  try {
    const bot = await fetchBotData(bot_id)
    if (!bot) {
      return <BotNotFound />
    }

    const leagueLabel = getLeagueLabel(bot.sport, bot.league)
    const isEmbed = searchParams?.embed === 'true'

    return (
      <ChatWindow
        botId={bot_id}
        botName={bot.bot_name}
        leagueLabel={leagueLabel}
        welcomeMessage={bot.welcome_message}
        primaryColor={bot.primary_color}
        isEmbed={isEmbed}
        sport={bot.sport}
      />
    )
  } catch {
    return <ServerError />
  }
}

function BotNotFound() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <p className="text-sm text-neutral-600">
        This chatbot doesn&apos;t exist or has been removed.
      </p>
    </div>
  )
}

function ServerError() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <p className="text-sm text-neutral-600">
        Something went wrong. Please try again later.
      </p>
    </div>
  )
}
