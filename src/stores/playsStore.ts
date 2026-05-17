import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getAllPlays, addPlay as _addPlay, deletePlay as _deletePlay } from '@/services/playsService'
import type { Play } from '@/domain/Play'

export const usePlaysStore = defineStore('plays', () => {
  const plays = ref<Play[]>([])
  const loading = ref(false)

  async function refresh() {
    loading.value = true
    try {
      plays.value = await getAllPlays()
    } finally {
      loading.value = false
    }
  }

  async function addLocalPlay(play: Omit<Play, 'id' | 'createdAt'>): Promise<string> {
    const id = await _addPlay(play)
    await refresh()
    return id
  }

  async function removeLocalPlay(id: string): Promise<void> {
    await _deletePlay(id)
    plays.value = plays.value.filter(p => p.id !== id)
  }

  function getLastPlayByGame(): Map<string, Date> {
    const map = new Map<string, Date>()
    for (const play of plays.value) {
      const d = play.playedAt?.toDate?.() ?? new Date(0)
      const existing = map.get(play.gameId)
      if (!existing || d > existing) map.set(play.gameId, d)
    }
    return map
  }

  return { plays, loading, refresh, addLocalPlay, removeLocalPlay, getLastPlayByGame }
})
