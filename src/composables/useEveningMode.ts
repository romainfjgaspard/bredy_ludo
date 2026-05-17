import { ref, computed } from 'vue'
import { PROFILES, type Profile } from '@/domain/Profile'
import { useGamesStore } from '@/stores/gamesStore'
import { applyAllFilters } from '@/utils/gameFilters'
import { useFiltersStore } from '@/stores/filtersStore'
import { computeEveningRating } from '@/utils/ratingCalc'
import type { Game } from '@/domain/Game'

export function useEveningMode() {
  const isActive = ref(false)
  const presentProfiles = ref<Profile[]>([...PROFILES])
  const gamesStore = useGamesStore()
  const filtersStore = useFiltersStore()

  function toggle() {
    isActive.value = !isActive.value
  }

  function toggleProfile(profile: Profile) {
    const idx = presentProfiles.value.indexOf(profile)
    if (idx >= 0) presentProfiles.value.splice(idx, 1)
    else presentProfiles.value.push(profile)
  }

  const eveningFilteredGames = computed(() => {
    const games = applyAllFilters(gamesStore.games, filtersStore.filters)
    if (!isActive.value) return games
    const count = presentProfiles.value.length
    return games.filter(g => {
      const min = g.metadata?.nb_joueurs_min ?? 1
      const max = g.metadata?.nb_joueurs_max ?? Infinity
      return count >= min && count <= max
    })
  })

  function getEveningRating(game: Game): number | null {
    return computeEveningRating(game, presentProfiles.value)
  }

  return { isActive, presentProfiles, toggle, toggleProfile, eveningFilteredGames, getEveningRating }
}
