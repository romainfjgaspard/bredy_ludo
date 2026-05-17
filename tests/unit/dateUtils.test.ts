import { describe, it, expect } from 'vitest'
import { isForgotten, formatRelative } from '@/utils/dateUtils'
import { Timestamp } from 'firebase/firestore'

describe('isForgotten', () => {
  it('retourne true si lastPlayedAt est null', () => {
    expect(isForgotten(null)).toBe(true)
  })
  it('retourne true si la date est > 6 mois', () => {
    const old = new Date()
    old.setMonth(old.getMonth() - 7)
    expect(isForgotten(Timestamp.fromDate(old))).toBe(true)
  })
  it('retourne false si la date est récente', () => {
    const recent = new Date()
    recent.setMonth(recent.getMonth() - 2)
    expect(isForgotten(Timestamp.fromDate(recent))).toBe(false)
  })
})

describe('formatRelative', () => {
  it('affiche "il y a quelques secondes" pour < 60s', () => {
    const now = new Date()
    expect(formatRelative(now)).toBe('il y a quelques secondes')
  })
  it('affiche les minutes', () => {
    const d = new Date(Date.now() - 5 * 60 * 1000)
    expect(formatRelative(d)).toBe('il y a 5 min')
  })
})
