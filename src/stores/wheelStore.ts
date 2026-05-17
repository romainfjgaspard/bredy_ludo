import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Game } from '@/domain/Game'

export const useWheelStore = defineStore('wheel', () => {
  const candidates = ref<Game[]>([])

  const uniqueCandidates = computed(() => {
    const seen = new Set<string>()
    return candidates.value.filter(g => {
      if (seen.has(g.id)) return false
      seen.add(g.id)
      return true
    })
  })

  function add(game: Game) {
    candidates.value.push(game)
  }

  function remove(id: string) {
    candidates.value = candidates.value.filter(g => g.id !== id)
  }

  function clear() {
    candidates.value = []
  }

  function setAll(games: Game[]) {
    candidates.value = [...games]
  }

  return { candidates, uniqueCandidates, add, remove, clear, setAll }
})
