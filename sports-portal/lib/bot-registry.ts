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

