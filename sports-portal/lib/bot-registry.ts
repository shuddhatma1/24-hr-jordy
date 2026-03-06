export const SUPPORTED_SPORTS = ['soccer', 'basketball', 'nfl', 'baseball'] as const
export type Sport = (typeof SUPPORTED_SPORTS)[number]

export const SPORT_LABELS: Record<Sport, string> = {
  soccer: 'Soccer',
  basketball: 'Basketball',
  nfl: 'NFL',
  baseball: 'Baseball',
}

export const LEAGUES_BY_SPORT: Record<Sport, { value: string; label: string }[]> = {
  soccer: [
    { value: 'english-premier-league', label: 'English Premier League' },
    { value: 'la-liga', label: 'La Liga' },
    { value: 'bundesliga', label: 'Bundesliga' },
  ],
  basketball: [{ value: 'nba', label: 'NBA' }],
  nfl: [{ value: 'nfl', label: 'NFL' }],
  baseball: [{ value: 'mlb', label: 'MLB' }],
}

// Registry values are functions (not static strings) so MOCK_BOT_URL is read
// at call-time — enables test env overrides without vi.resetModules().
const REGISTRY: Record<string, () => string> = {
  'soccer:english-premier-league': () => process.env.MOCK_BOT_URL ?? '',
  'soccer:la-liga': () => process.env.MOCK_BOT_URL ?? '',
  'soccer:bundesliga': () => process.env.MOCK_BOT_URL ?? '',
  'basketball:nba': () => process.env.MOCK_BOT_URL ?? '',
  'nfl:nfl': () => process.env.MOCK_BOT_URL ?? '',
  'baseball:mlb': () => process.env.MOCK_BOT_URL ?? '',
}

/**
 * Returns the streaming bot endpoint URL for a given sport + league.
 * Returns null if the combination is not supported — never throws.
 */
export function getEndpointUrl(sport: string, league: string): string | null {
  const resolver = REGISTRY[`${sport}:${league}`]
  if (!resolver) return null
  return resolver()
}
