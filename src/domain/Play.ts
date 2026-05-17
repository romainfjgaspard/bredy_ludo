import type { Timestamp } from 'firebase/firestore'
import type { Profile } from './Profile'

export interface Play {
  id: string
  gameId: string
  gameName: string
  players: Profile[]
  playedAt: Timestamp
  createdAt: Timestamp
}
