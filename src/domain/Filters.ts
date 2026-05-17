import type { GameType } from './Game'

export interface GameFilters {
  search: string
  playersMin: number | null
  playersMax: number | null
  durationMin: number | null
  durationMax: number | null
  ageMax: number | null
  includeExtensions: boolean
  type: GameType | null
  emplacement: string | null
}

export function defaultFilters(): GameFilters {
  return {
    search: '',
    playersMin: null,
    playersMax: null,
    durationMin: null,
    durationMax: null,
    ageMax: null,
    includeExtensions: false,
    type: null,
    emplacement: null,
  }
}
