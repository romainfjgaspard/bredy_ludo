export type LastPlayedFilter = '1month' | '6months' | '1year' | null

export interface GameFilters {
  search: string
  /** Nombre de joueurs exact (le jeu doit supporter ce nombre) */
  players: number | null
  durationMin: number | null
  durationMax: number | null
  /** Âge minimum requis du jeu (age_min >= ageMin) */
  ageMin: number | null
  /** Note famille minimale */
  minRating: number | null
  /** Catégorie BGG */
  category: string | null
  /** Filtre sur la dernière partie */
  lastPlayedFilter: LastPlayedFilter
  includeExtensions: boolean
}

export function defaultFilters(): GameFilters {
  return {
    search: '',
    players: null,
    durationMin: null,
    durationMax: null,
    ageMin: null,
    minRating: null,
    category: null,
    lastPlayedFilter: null,
    includeExtensions: false,
  }
}
