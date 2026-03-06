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

// Registry values are functions (not static strings) so env vars are read at
// call-time, enabling test env overrides without module reloading.
// In production, replace MOCK_BOT_URL with per-league env vars.
const REGISTRY: Record<string, () => string | null> = {
  'soccer:english-premier-league': () => process.env.MOCK_BOT_URL ?? null,
  'soccer:la-liga': () => process.env.MOCK_BOT_URL ?? null,
  'soccer:bundesliga': () => process.env.MOCK_BOT_URL ?? null,
  'basketball:nba': () => process.env.MOCK_BOT_URL ?? null,
  'nfl:nfl': () => process.env.MOCK_BOT_URL ?? null,
  'baseball:mlb': () => process.env.MOCK_BOT_URL ?? null,
}

/**
 * Returns the streaming bot endpoint URL for a given sport + league.
 * Returns null if the combination is not supported or the endpoint env var is unset.
 * Never throws.
 */
export function getEndpointUrl(sport: string, league: string): string | null {
  const resolver = REGISTRY[`${sport}:${league}`]
  if (!resolver) return null
  return resolver()
}
