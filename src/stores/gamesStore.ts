import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getAllGames } from '@/services/gamesService'
import type { Game } from '@/domain/Game'

export const useGamesStore = defineStore('games', () => {
  const games = ref<Game[]>([])
  const loading = ref(false)
  const lastRefresh = ref<Date | null>(null)
  const error = ref<string | null>(null)

  const activeGames = computed(() => games.value.filter(g => !g.archived))

  async function refresh(): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      games.value = await getAllGames()
      lastRefresh.value = new Date()
      return true
    } catch (e) {
      error.value = 'Impossible de charger les jeux. Vérifiez votre connexion.'
      return false
    } finally {
      loading.value = false
    }
  }

  function getById(id: string): Game | undefined {
    return games.value.find(g => g.id === id)
  }

  return { games, loading, lastRefresh, error, activeGames, refresh, getById }
})
