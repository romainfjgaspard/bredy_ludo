import { ref, computed } from 'vue'
import { useWheelStore } from '@/stores/wheelStore'
import { useGamesStore } from '@/stores/gamesStore'
import type { Game } from '@/domain/Game'

export function useWheel() {
  const wheelStore = useWheelStore()
  const gamesStore = useGamesStore()
  const result = ref<Game | null>(null)
  const isSpinning = ref(false)
  const spinTrigger = ref<{ index: number; id: number } | null>(null)
  let spinIdCounter = 0

  function buildCandidatesFromFiltered(games: Game[]) {
    wheelStore.setAll(games)
  }

  function buildCandidatesFromAll(includeExtensions = false) {
    const games = gamesStore.activeGames.filter(g => includeExtensions || g.type === 'base')
    wheelStore.setAll(games)
  }

  function spin() {
    const candidates = wheelStore.uniqueCandidates
    if (candidates.length === 0 || isSpinning.value) return
    result.value = null
    if (candidates.length === 1) {
      result.value = candidates[0]
      return
    }
    const idx = Math.floor(Math.random() * candidates.length)
    spinTrigger.value = { index: idx, id: ++spinIdCounter }
    isSpinning.value = true
  }

  /** Appelé par le composant canvas quand l'animation se termine */
  function handleSpinComplete(idx: number) {
    result.value = wheelStore.uniqueCandidates[idx] ?? null
    isSpinning.value = false
  }

  function reset() {
    result.value = null
    isSpinning.value = false
    spinTrigger.value = null
    wheelStore.clear()
  }

  return {
    candidates: computed(() => wheelStore.uniqueCandidates),
    result,
    isSpinning,
    spinTrigger,
    spin,
    reset,
    handleSpinComplete,
    buildCandidatesFromFiltered,
    buildCandidatesFromAll,
  }
}

