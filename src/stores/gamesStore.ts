import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getAllGames } from '@/services/gamesService'
import type { Game } from '@/domain/Game'

export const useGamesStore = defineStore('games', () => {
  const games = ref<Game[]>([])
  const loading = ref(false)
  const lastRefresh = ref<Date | null>(null)

  const activeGames = computed(() => games.value.filter(g => !g.archived))

  async function refresh() {
    loading.value = true
    try {
      games.value = await getAllGames()
      lastRefresh.value = new Date()
    } finally {
      loading.value = false
    }
  }

  function getById(id: string): Game | undefined {
    return games.value.find(g => g.id === id)
  }

  return { games, loading, lastRefresh, activeGames, refresh, getById }
})
