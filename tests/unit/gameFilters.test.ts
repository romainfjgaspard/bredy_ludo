import { describe, it, expect } from 'vitest'
import { applyAllFilters, filterByPlayers, filterByDuration } from '@/utils/gameFilters'
import type { Game } from '@/domain/Game'
import { Timestamp } from 'firebase/firestore'
import type { GameFilters } from '@/domain/Filters'
import { defaultFilters } from '@/domain/Filters'

function makeGame(overrides: Partial<Game> = {}): Game {
  const ts = Timestamp.now()
  return {
    id: 'g1',
    nom: 'Catan',
    type: 'base',
    emplacement: 'A1',
    archived: false,
    createdAt: ts,
    updatedAt: ts,
    metadata: {
      nb_joueurs_min: 3,
      nb_joueurs_max: 6,
      duree_min: 60,
      duree_max: 120,
      age_min: 10,
    },
    ...overrides,
  }
}

describe('filterByPlayers', () => {
  it('filtre si nb joueurs insuffisant', () => {
    expect(filterByPlayers([makeGame()], 7, null)).toHaveLength(0)
  })
  it('accepte si dans la plage', () => {
    expect(filterByPlayers([makeGame()], 3, 6)).toHaveLength(1)
  })
  it('accepte si overlap partiel', () => {
    expect(filterByPlayers([makeGame()], 5, 8)).toHaveLength(1)
  })
})

describe('filterByDuration', () => {
  it('filtre si durée max trop courte', () => {
    expect(filterByDuration([makeGame()], null, 30)).toHaveLength(0)
  })
  it('accepte si overlap', () => {
    expect(filterByDuration([makeGame()], 90, 180)).toHaveLength(1)
  })
})

describe('applyAllFilters', () => {
  it('exclut les extensions par défaut', () => {
    const games = [makeGame(), makeGame({ id: 'g2', type: 'extension' })]
    const result = applyAllFilters(games, defaultFilters())
    expect(result.every(g => g.type === 'base')).toBe(true)
  })
  it('inclut les extensions si le filtre est actif', () => {
    const games = [makeGame(), makeGame({ id: 'g2', type: 'extension' })]
    const filters: GameFilters = { ...defaultFilters(), includeExtensions: true }
    expect(applyAllFilters(games, filters)).toHaveLength(2)
  })
  it('filtre par recherche normalisée', () => {
    const games = [makeGame(), makeGame({ id: 'g2', nom: 'Évolution' })]
    const filters: GameFilters = { ...defaultFilters(), search: 'evolution' }
    expect(applyAllFilters(games, filters)).toHaveLength(1)
  })
  it('exclut les jeux archivés', () => {
    const games = [makeGame(), makeGame({ id: 'g2', archived: true })]
    expect(applyAllFilters(games, defaultFilters())).toHaveLength(1)
  })
})
