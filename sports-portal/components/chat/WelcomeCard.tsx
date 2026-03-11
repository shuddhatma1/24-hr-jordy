'use client'

const SPORT_EMOJIS: Record<string, string> = {
  soccer: '⚽',
  basketball: '🏀',
  nfl: '🏈',
  baseball: '⚾',
}

const SUGGESTED_QUESTIONS: Record<string, string[]> = {
  soccer: ['Who won last night?', 'League standings', 'Top scorers'],
  basketball: ["Last night's scores?", 'Standings', 'Top performers'],
  nfl: ['Latest game results?', 'Standings', 'Top players this week'],
  baseball: ["Yesterday's scores?", 'Standings', 'League leaders'],
}

interface Props {
  botName: string
  sport: string
  welcomeMessage?: string
  onChipClick: (question: string) => void
}

export default function WelcomeCard({ botName, sport, welcomeMessage, onChipClick }: Props) {
  const emoji = SPORT_EMOJIS[sport] ?? '🏆'
  const chips = SUGGESTED_QUESTIONS[sport] ?? SUGGESTED_QUESTIONS.soccer

  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="text-center max-w-sm animate-fade-in">
        <div className="w-16 h-16 rounded-full gradient-primary text-white text-2xl shadow-glow flex items-center justify-center mx-auto mb-4">
          {emoji}
        </div>
        <h2 className="text-lg font-semibold text-neutral-900 mb-1">{botName}</h2>
        {welcomeMessage && (
          <p className="text-neutral-500 text-sm mb-6">{welcomeMessage}</p>
        )}
        {!welcomeMessage && (
          <p className="text-neutral-500 text-sm mb-6">Ask me anything — I&apos;m here to help!</p>
        )}
        <div className="flex flex-wrap justify-center gap-2">
          {chips.map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => onChipClick(question)}
              className="px-4 py-2 rounded-full border border-neutral-200 bg-white text-sm text-neutral-700 hover:bg-brand-50 hover:border-brand-300 hover:text-brand-600 transition-colors shadow-soft"
            >
              {question}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
