<template>
  <div class="min-h-screen bg-gray-50 pb-20">
    <div class="max-w-2xl mx-auto px-4 pt-4 space-y-4">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">Statistiques</h1>
        <RefreshButton :loading="loading" @refresh="loadData" />
      </div>

      <LoadingSpinner v-if="loading" />

      <template v-else>
        <!-- StatCards -->
        <div class="grid grid-cols-3 gap-3">
          <StatCard label="Jeux" :value="totalGames" color="indigo" />
          <StatCard label="Parties" :value="totalPlays" color="green" />
          <StatCard label="Oubliés" :value="forgottenCount" color="amber" />
        </div>

        <!-- Top jeux joués -->
        <div class="bg-white rounded-xl shadow p-4">
          <h2 class="font-semibold mb-3">Top jeux joués</h2>
          <ol class="space-y-2">
            <li v-for="(item, i) in topGames" :key="item.gameId" class="flex items-center gap-2 text-sm">
              <span class="w-5 text-gray-400 font-mono">{{ i + 1 }}.</span>
              <span class="flex-1 truncate">{{ item.name }}</span>
              <span class="font-semibold text-indigo-600">{{ item.count }} partie{{ item.count > 1 ? 's' : '' }}</span>
            </li>
          </ol>
        </div>

        <!-- Parties par mois -->
        <div class="bg-white rounded-xl shadow p-4">
          <h2 class="font-semibold mb-3">Parties par mois</h2>
          <ChartWrapper type="bar" :data="playsPerMonthData" />
        </div>

        <!-- Jeux oubliés -->
        <div v-if="forgottenGames.length > 0" class="bg-white rounded-xl shadow p-4">
          <h2 class="font-semibold mb-3 text-amber-700">Jeux oubliés (> 6 mois)</h2>
          <ul class="space-y-1 text-sm text-gray-600">
            <li v-for="game in forgottenGames" :key="game.id">{{ game.nom }}</li>
          </ul>
        </div>
      </template>
    </div>
    <AppNav />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useGamesStore } from '@/stores/gamesStore'
import { usePlaysStore } from '@/stores/playsStore'
import { isForgotten } from '@/utils/dateUtils'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import RefreshButton from '@/components/common/RefreshButton.vue'
import StatCard from '@/components/stats/StatCard.vue'
import ChartWrapper from '@/components/stats/ChartWrapper.vue'
import AppNav from '@/components/layout/AppNav.vue'

const gamesStore = useGamesStore()
const playsStore = usePlaysStore()
const loading = ref(false)

async function loadData() {
  loading.value = true
  try {
    await Promise.all([gamesStore.refresh(), playsStore.refresh()])
  } finally {
    loading.value = false
  }
}

onMounted(() => loadData())

const totalGames = computed(() => gamesStore.activeGames.length)
const totalPlays = computed(() => playsStore.plays.length)

const lastPlayMap = computed(() => playsStore.getLastPlayByGame())

const forgottenGames = computed(() =>
  gamesStore.activeGames.filter(g => {
    const last = lastPlayMap.value.get(g.id)
    return isForgotten(last ? { toDate: () => last } as any : null)
  })
)
const forgottenCount = computed(() => forgottenGames.value.length)

const topGames = computed(() => {
  const counts = new Map<string, { name: string; count: number }>()
  for (const play of playsStore.plays) {
    const existing = counts.get(play.gameId)
    if (existing) existing.count++
    else counts.set(play.gameId, { name: play.gameName, count: 1 })
  }
  return [...counts.entries()]
    .map(([gameId, v]) => ({ gameId, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
})

const playsPerMonthData = computed(() => {
  const months: Record<string, number> = {}
  for (const play of playsStore.plays) {
    const d = play.playedAt?.toDate?.()
    if (!d) continue
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    months[key] = (months[key] ?? 0) + 1
  }
  const sorted = Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).slice(-12)
  return {
    labels: sorted.map(([k]) => k),
    datasets: [{ label: 'Parties', data: sorted.map(([, v]) => v), backgroundColor: '#6366f1' }],
  }
})
</script>
