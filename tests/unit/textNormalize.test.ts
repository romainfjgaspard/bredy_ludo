import { describe, it, expect } from 'vitest'
import { normalize } from '@/utils/textNormalize'

describe('normalize', () => {
  it('met en minuscules', () => {
    expect(normalize('CATAN')).toBe('catan')
  })
  it('supprime les accents', () => {
    expect(normalize('Évolution')).toBe('evolution')
  })
  it('supprime la ponctuation', () => {
    expect(normalize("Ticket to Ride: Europe")).toBe('ticket to ride europe')
  })
  it('gère les chaînes vides', () => {
    expect(normalize('')).toBe('')
  })
  it('gère les espaces multiples', () => {
    expect(normalize('  Catan  ')).toBe('catan')
  })
  it('normalise les caractères composés', () => {
    expect(normalize('Château')).toBe('chateau')
  })
})
