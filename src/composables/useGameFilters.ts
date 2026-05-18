import { computed } from 'vue'
import { useGamesStore } from '@/stores/gamesStore'
import { useFiltersStore } from '@/stores/filtersStore'
import { usePlaysStore } from '@/stores/playsStore'
import { applyAllFilters } from '@/utils/gameFilters'

export function useGameFilters() {
  const gamesStore = useGamesStore()
  const filtersStore = useFiltersStore()
  const playsStore = usePlaysStore()

  const filteredGames = computed(() => {
    const lastPlayMap = playsStore.getLastPlayByGame()
    return applyAllFilters(gamesStore.games, filtersStore.filters, lastPlayMap)
  })

  return { filteredGames }
}
