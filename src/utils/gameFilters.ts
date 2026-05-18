import type { Game } from '@/domain/Game'
import type { GameFilters, LastPlayedFilter } from '@/domain/Filters'
import { normalize } from './textNormalize'
import { computeFamilyRating } from './ratingCalc'

export function filterBySearch(games: Game[], search: string): Game[] {
  if (!search) return games
  const q = normalize(search)
  return games.filter(g => normalize(g.nom).includes(q))
}

/** Filtre par nombre de joueurs exact (le jeu doit supporter ce nombre) */
export function filterByPlayers(games: Game[], players: number | null): Game[] {
  if (players === null) return games
  return games.filter(g => {
    const gMin = g.metadata?.nb_joueurs_min ?? 1
    const gMax = g.metadata?.nb_joueurs_max ?? 99
    return gMin <= players && players <= gMax
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

/** ageMin = seuil bas de l'âge du jeu ; ageMax = seuil haut */
export function filterByAge(games: Game[], ageMin: number | null, ageMax: number | null): Game[] {
  return games.filter(g => {
    const gAge = g.metadata?.age_min ?? 0
    if (ageMin !== null && gAge < ageMin) return false
    if (ageMax !== null && gAge > ageMax) return false
    return true
  })
}

/** Note famille minimale */
export function filterByMinRating(games: Game[], minRating: number | null): Game[] {
  if (minRating === null) return games
  return games.filter(g => {
    const r = computeFamilyRating(g)
    return r !== null && r >= minRating
  })
}

/** Filtre par catégorie BGG */
export function filterByCategory(games: Game[], category: string | null): Game[] {
  if (!category) return games
  return games.filter(g => g.metadata?.categories?.includes(category) ?? false)
}

/** Filtre sur la dernière partie enregistrée */
export function filterByLastPlayed(
  games: Game[],
  filter: LastPlayedFilter,
  lastPlayMap: Map<string, Date>,
): Game[] {
  if (!filter) return games
  const now = Date.now()
  const DAY = 86_400_000
  const cutoff: Record<NonNullable<LastPlayedFilter>, number> = {
    '1month': 30 * DAY,
    '6months': 180 * DAY,
    '1year': 365 * DAY,
  }
  const ms = cutoff[filter]
  return games.filter(g => {
    const last = lastPlayMap.get(g.id)
    if (!last) return true // jamais joué → inclus (considéré oublié)
    return now - last.getTime() > ms
  })
}

export function applyAllFilters(
  games: Game[],
  filters: GameFilters,
  lastPlayMap?: Map<string, Date>,
): Game[] {
  let result = games.filter(g => !g.archived)
  if (!filters.includeExtensions) result = result.filter(g => g.type === 'base')
  result = filterBySearch(result, filters.search)
  result = filterByPlayers(result, filters.players)
  result = filterByDuration(result, filters.durationMin, filters.durationMax)
  result = filterByAge(result, filters.ageMin, filters.ageMax)
  result = filterByMinRating(result, filters.minRating)
  result = filterByCategory(result, filters.category)
  if (lastPlayMap) result = filterByLastPlayed(result, filters.lastPlayedFilter, lastPlayMap)
  return result
}
