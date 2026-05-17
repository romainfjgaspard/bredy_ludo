<template>
  <div class="bg-white rounded-xl shadow p-3 space-y-3">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <span class="font-semibold text-sm">Candidats ({{ wheelStore.uniqueCandidates.length }})</span>
      <button class="text-xs text-red-400 hover:text-red-600" @click="wheelStore.clear()">Vider</button>
    </div>

    <!-- Options -->
    <label class="flex items-center gap-2 text-xs text-gray-600">
      <input v-model="includeExtensions" type="checkbox" class="rounded" />
      Inclure les extensions
    </label>

    <!-- Presets -->
    <div class="space-y-1">
      <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Presets</p>
      <div class="grid grid-cols-1 gap-1">
        <button
          class="text-left text-xs px-2 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
          @click="loadPreset('courts')"
        >
          ⏱ Jeux courts (≤ 30 min)
        </button>
        <button
          class="text-left text-xs px-2 py-1.5 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors"
          @click="loadPreset('oublies')"
        >
          💤 Jeux oubliés (> 6 mois)
        </button>
        <button
          class="text-left text-xs px-2 py-1.5 rounded-lg bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition-colors"
          @click="loadPreset('top')"
        >
          ⭐ Top famille (≥ 4 étoiles)
        </button>
        <button
          class="text-left text-xs px-2 py-1.5 rounded-lg transition-colors"
          :class="eveningActive
            ? 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'"
          :disabled="!eveningActive"
          @click="loadPreset('soiree')"
        >
          🌙 Compatibles présents
        </button>
        <button
          class="text-left text-xs px-2 py-1.5 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
          @click="loadFiltered"
        >
          🔍 Depuis les filtres actifs
        </button>
        <button
          class="text-left text-xs px-2 py-1.5 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
          @click="loadAll"
        >
          📚 Tous les jeux
        </button>
      </div>
    </div>

    <!-- Manual search -->
    <div class="space-y-1">
      <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Ajouter manuellement</p>
      <div class="relative">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher un jeu…"
          class="w-full border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300"
          @input="updateSuggestions"
          @keydown.escape="closeSuggestions"
        />
        <ul
          v-if="suggestions.length > 0"
          class="absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto"
        >
          <li
            v-for="game in suggestions"
            :key="game.id"
            class="px-3 py-2 text-xs hover:bg-indigo-50 cursor-pointer truncate"
            @click="addGame(game)"
          >
            {{ game.nom }}
          </li>
        </ul>
      </div>
    </div>

    <!-- Candidate list -->
    <ul v-if="wheelStore.uniqueCandidates.length > 0" class="space-y-1 max-h-52 overflow-y-auto">
      <li
        v-for="game in wheelStore.uniqueCandidates"
        :key="game.id"
        class="flex items-center justify-between text-xs py-0.5"
      >
        <span class="truncate flex-1 mr-2 text-gray-700">{{ game.nom }}</span>
        <button class="text-gray-300 hover:text-red-500 shrink-0 text-base leading-none" @click="wheelStore.remove(game.id)">×</button>
      </li>
    </ul>
    <p v-else class="text-xs text-gray-400 text-center py-2">Aucun candidat — sélectionnez un preset</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useWheelStore } from '@/stores/wheelStore'
import { useGamesStore } from '@/stores/gamesStore'
import { useGameFilters } from '@/composables/useGameFilters'
import { useEveningMode } from '@/composables/useEveningMode'
import { usePlaysStore } from '@/stores/playsStore'
import { isForgotten } from '@/utils/dateUtils'
import { computeFamilyRating } from '@/utils/ratingCalc'
import type { Game } from '@/domain/Game'

const props = defineProps<{ includeExtensions?: boolean }>()
const includeExtensions = ref(props.includeExtensions ?? false)

const wheelStore = useWheelStore()
const gamesStore = useGamesStore()
const playsStore = usePlaysStore()
const { filteredGames } = useGameFilters()
const { isActive: eveningActive, eveningFilteredGames } = useEveningMode()

const searchQuery = ref('')
const suggestions = ref<Game[]>([])

function filterGame(game: Game): boolean {
  if (game.archived) return false
  if (!includeExtensions.value && game.type === 'extension') return false
  return true
}

function loadAll() {
  const games = gamesStore.activeGames.filter(filterGame)
  wheelStore.setAll(games)
}

function loadFiltered() {
  const games = filteredGames.value.filter(filterGame)
  wheelStore.setAll(games)
}

function loadPreset(preset: 'courts' | 'oublies' | 'top' | 'soiree') {
  const lastPlayByGame = playsStore.getLastPlayByGame()
  let games: Game[] = []

  switch (preset) {
    case 'courts':
      games = gamesStore.activeGames.filter(g =>
        filterGame(g) && (g.metadata?.duree_max ?? 999) <= 30
      )
      break
    case 'oublies':
      games = gamesStore.activeGames.filter(g => {
        if (!filterGame(g)) return false
        const last = lastPlayByGame.get(g.id)
        return isForgotten(last ? { toDate: () => last } as any : null)
      })
      break
    case 'top':
      games = gamesStore.activeGames.filter(g => {
        if (!filterGame(g)) return false
        const rating = computeFamilyRating(g)
        return rating !== null && rating >= 4
      })
      break
    case 'soiree':
      if (!eveningActive.value) return
      games = eveningFilteredGames.value.filter(filterGame)
      break
  }

  wheelStore.setAll(games)
}

function updateSuggestions() {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) { suggestions.value = []; return }
  suggestions.value = gamesStore.activeGames
    .filter(g => filterGame(g) && g.nom.toLowerCase().includes(q))
    .slice(0, 8)
}

function addGame(game: Game) {
  wheelStore.add(game)
  searchQuery.value = ''
  suggestions.value = []
}

function closeSuggestions() {
  suggestions.value = []
}
</script>
