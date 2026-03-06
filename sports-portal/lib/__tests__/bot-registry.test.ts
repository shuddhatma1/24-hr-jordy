import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  getEndpointUrl,
  LEAGUES_BY_SPORT,
  SUPPORTED_SPORTS,
  SPORT_LABELS,
} from '@/lib/bot-registry'

const MOCK_URL = 'http://localhost:3001/chat'

beforeEach(() => {
  process.env.MOCK_BOT_URL = MOCK_URL
})

afterEach(() => {
  delete process.env.MOCK_BOT_URL
})

describe('getEndpointUrl', () => {
  it('returns MOCK_BOT_URL for soccer:english-premier-league', () => {
    expect(getEndpointUrl('soccer', 'english-premier-league')).toBe(MOCK_URL)
  })

  it('returns MOCK_BOT_URL for soccer:la-liga', () => {
    expect(getEndpointUrl('soccer', 'la-liga')).toBe(MOCK_URL)
  })

  it('returns MOCK_BOT_URL for soccer:bundesliga', () => {
    expect(getEndpointUrl('soccer', 'bundesliga')).toBe(MOCK_URL)
  })

  it('returns MOCK_BOT_URL for basketball:nba', () => {
    expect(getEndpointUrl('basketball', 'nba')).toBe(MOCK_URL)
  })

  it('returns MOCK_BOT_URL for nfl:nfl', () => {
    expect(getEndpointUrl('nfl', 'nfl')).toBe(MOCK_URL)
  })

  it('returns MOCK_BOT_URL for baseball:mlb', () => {
    expect(getEndpointUrl('baseball', 'mlb')).toBe(MOCK_URL)
  })

  it('returns null for unsupported sport', () => {
    expect(getEndpointUrl('cricket', 'ipl')).toBeNull()
  })

  it('returns null for valid sport but unsupported league', () => {
    expect(getEndpointUrl('soccer', 'mls')).toBeNull()
  })

  it('returns null for empty strings', () => {
    expect(getEndpointUrl('', '')).toBeNull()
  })

  it('returns null for valid combo when MOCK_BOT_URL is unset', () => {
    delete process.env.MOCK_BOT_URL
    expect(getEndpointUrl('soccer', 'english-premier-league')).toBeNull()
  })
})

describe('LEAGUES_BY_SPORT', () => {
  it('covers all supported sports', () => {
    for (const sport of SUPPORTED_SPORTS) {
      expect(LEAGUES_BY_SPORT[sport].length).toBeGreaterThan(0)
    }
  })

  it('has 3 soccer leagues', () => {
    expect(LEAGUES_BY_SPORT.soccer).toHaveLength(3)
  })

  it('every league value resolves to a non-null endpoint URL', () => {
    for (const sport of SUPPORTED_SPORTS) {
      for (const league of LEAGUES_BY_SPORT[sport]) {
        expect(
          getEndpointUrl(sport, league.value),
          `${sport}:${league.value} should resolve`
        ).not.toBeNull()
      }
    }
  })
})

describe('SPORT_LABELS', () => {
  it('has a label for every supported sport', () => {
    for (const sport of SUPPORTED_SPORTS) {
      expect(SPORT_LABELS[sport]).toBeTruthy()
    }
  })
})
