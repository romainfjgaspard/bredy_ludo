import { computed } from 'vue'
import { useProfileStore } from '@/stores/profileStore'
import type { Game } from '@/domain/Game'
import { computeDisplayRating, computeFamilyRating } from '@/utils/ratingCalc'

export function useFamilyRating(game: Game) {
  const profileStore = useProfileStore()

  const displayRating = computed(() =>
    computeDisplayRating(game, profileStore.activeProfile)
  )

  const familyRating = computed(() => computeFamilyRating(game))

  return { displayRating, familyRating }
}
