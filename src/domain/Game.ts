import type { Timestamp } from 'firebase/firestore'
import type { Profile } from './Profile'
import type { Location } from './Location'

export interface GameRating {
  value: number // 1–5
  updatedAt: Timestamp
}

export interface GameMetadata {
  nb_joueurs_min: number
  nb_joueurs_max: number
  duree_min: number
  duree_max: number
  age_min: number
  bgg_rating?: number
  bgg_weight?: number
  /** Nombre de joueurs idéal selon la communauté BGG */
  community_best_players?: number
  /** Âge minimum selon la communauté BGG */
  community_min_age?: number
  /** Lien vers la fiche sur BoardGameGeek */
  bgg_link?: string
  description?: string
  tutorial_url?: string
}

export type GameType = 'base' | 'extension'

export interface Game {
  id: string
  nom: string
  type: GameType
  baseGameId?: string // si extension
  emplacement: Location
  archived: boolean
  image_url?: string // "{bggId}.jpg"
  bgg_id?: number
  metadata?: GameMetadata
  ratings?: Partial<Record<Profile, GameRating>>
  createdAt: Timestamp
  updatedAt: Timestamp
}
