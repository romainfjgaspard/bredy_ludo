import type { Game } from '@/domain/Game'
import type { Profile } from '@/domain/Profile'

export function computeFamilyRating(game: Game): number | null {
  const ratings = game.ratings
  if (!ratings) return null
  const values = Object.values(ratings).map(r => r.value).filter(v => typeof v === 'number')
  if (values.length === 0) return null
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
}

export function computeDisplayRating(game: Game, profile: Profile | null): number | null {
  if (!profile) return computeFamilyRating(game)
  return game.ratings?.[profile]?.value ?? null
}

export function computeEveningRating(game: Game, profiles: Profile[]): number | null {
  if (!game.ratings || profiles.length === 0) return null
  const values = profiles
    .map(p => game.ratings![p]?.value)
    .filter((v): v is number => typeof v === 'number')
  if (values.length === 0) return null
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
}
