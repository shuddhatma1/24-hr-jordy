import { describe, it, expect } from 'vitest'
import {
  LEAGUES_BY_SPORT,
  SUPPORTED_SPORTS,
  SPORT_LABELS,
} from '@/lib/bot-registry'

describe('LEAGUES_BY_SPORT', () => {
  it('covers all supported sports', () => {
    for (const sport of SUPPORTED_SPORTS) {
      expect(LEAGUES_BY_SPORT[sport].length).toBeGreaterThan(0)
    }
  })

  it('has 3 soccer leagues', () => {
    expect(LEAGUES_BY_SPORT.soccer).toHaveLength(3)
  })

  it('every league entry has value and label', () => {
    for (const sport of SUPPORTED_SPORTS) {
      for (const league of LEAGUES_BY_SPORT[sport]) {
        expect(league.value).toBeTruthy()
        expect(league.label).toBeTruthy()
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
