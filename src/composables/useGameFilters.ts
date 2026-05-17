import { computed } from 'vue'
import { useGamesStore } from '@/stores/gamesStore'
import { useFiltersStore } from '@/stores/filtersStore'
import { applyAllFilters } from '@/utils/gameFilters'

export function useGameFilters() {
  const gamesStore = useGamesStore()
  const filtersStore = useFiltersStore()

  const filteredGames = computed(() =>
    applyAllFilters(gamesStore.games, filtersStore.filters)
  )

  return { filteredGames }
}
