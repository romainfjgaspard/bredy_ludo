import { ref, computed } from 'vue'
import { useWheelStore } from '@/stores/wheelStore'
import { useGamesStore } from '@/stores/gamesStore'
import type { Game } from '@/domain/Game'

export function useWheel() {
  const wheelStore = useWheelStore()
  const gamesStore = useGamesStore()
  const result = ref<Game | null>(null)
  const isSpinning = ref(false)

  function buildCandidatesFromFiltered(games: Game[]) {
    wheelStore.setAll(games)
  }

  function buildCandidatesFromAll(includeExtensions = false) {
    const games = gamesStore.activeGames.filter(g => includeExtensions || g.type === 'base')
    wheelStore.setAll(games)
  }

  async function spin() {
    const candidates = wheelStore.uniqueCandidates
    if (candidates.length === 0) return
    if (candidates.length === 1) {
      result.value = candidates[0]
      return
    }
    isSpinning.value = true
    await new Promise(resolve => setTimeout(resolve, 3000))
    const idx = Math.floor(Math.random() * candidates.length)
    result.value = candidates[idx]
    isSpinning.value = false
  }

  function reset() {
    result.value = null
    wheelStore.clear()
  }

  return {
    candidates: computed(() => wheelStore.uniqueCandidates),
    result,
    isSpinning,
    spin,
    reset,
    buildCandidatesFromFiltered,
    buildCandidatesFromAll,
  }
}
