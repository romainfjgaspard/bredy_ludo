import { describe, it, expect } from 'vitest'
import { computeFamilyRating, computeDisplayRating, computeEveningRating } from '@/utils/ratingCalc'
import type { Game } from '@/domain/Game'
import { Timestamp } from 'firebase/firestore'

function makeGame(ratings: Partial<Record<string, number>>): Game {
  const ts = Timestamp.now()
  return {
    id: 'test',
    nom: 'Test Game',
    type: 'base',
    emplacement: 'A1',
    archived: false,
    createdAt: ts,
    updatedAt: ts,
    ratings: Object.fromEntries(
      Object.entries(ratings).map(([k, v]) => [k, { value: v!, updatedAt: ts }])
    ) as any,
  }
}

describe('computeFamilyRating', () => {
  it('retourne null si aucune note', () => {
    expect(computeFamilyRating(makeGame({}))).toBeNull()
  })
  it('calcule la moyenne', () => {
    expect(computeFamilyRating(makeGame({ Nicolas: 4, Valérie: 2 }))).toBe(3)
  })
  it('arrondit à 1 décimale', () => {
    expect(computeFamilyRating(makeGame({ Nicolas: 5, Valérie: 4, Romane: 3 }))).toBe(4)
  })
})

describe('computeEveningRating', () => {
  it('retourne null si aucun profil', () => {
    expect(computeEveningRating(makeGame({ Nicolas: 4 }), [])).toBeNull()
  })
  it('ne prend que les profils présents', () => {
    const game = makeGame({ Nicolas: 5, Valérie: 1 })
    expect(computeEveningRating(game, ['Nicolas'] as any)).toBe(5)
  })
})
