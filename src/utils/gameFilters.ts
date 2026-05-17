import type { Game } from '@/domain/Game'
import type { GameFilters } from '@/domain/Filters'
import { normalize } from './textNormalize'

export function filterBySearch(games: Game[], search: string): Game[] {
  if (!search) return games
  const q = normalize(search)
  return games.filter(g => normalize(g.nom).includes(q))
}

export function filterByPlayers(games: Game[], min: number | null, max: number | null): Game[] {
  return games.filter(g => {
    const gMin = g.metadata?.nb_joueurs_min ?? 0
    const gMax = g.metadata?.nb_joueurs_max ?? Infinity
    if (min !== null && gMax < min) return false
    if (max !== null && gMin > max) return false
    return true
  })
}

export function filterByDuration(games: Game[], min: number | null, max: number | null): Game[] {
  return games.filter(g => {
    const gMin = g.metadata?.duree_min ?? 0
    const gMax = g.metadata?.duree_max ?? Infinity
    if (min !== null && gMax < min) return false
    if (max !== null && gMin > max) return false
    return true
  })
}

export function filterByAge(games: Game[], ageMax: number | null): Game[] {
  if (ageMax === null) return games
  return games.filter(g => (g.metadata?.age_min ?? 0) <= ageMax)
}

export function applyAllFilters(games: Game[], filters: GameFilters): Game[] {
  let result = games.filter(g => !g.archived)
  if (!filters.includeExtensions) result = result.filter(g => g.type === 'base')
  result = filterBySearch(result, filters.search)
  result = filterByPlayers(result, filters.playersMin, filters.playersMax)
  result = filterByDuration(result, filters.durationMin, filters.durationMax)
  result = filterByAge(result, filters.ageMax)
  if (filters.emplacement) result = result.filter(g => g.emplacement === filters.emplacement)
  return result
}
