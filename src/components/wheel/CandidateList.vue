<template>
  <div class="bg-white rounded-xl shadow overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between px-3 py-2.5 border-b border-gray-100">
      <span class="font-semibold text-sm text-gray-700">
        {{ wheelStore.uniqueCandidates.length }} jeu{{ wheelStore.uniqueCandidates.length > 1 ? 'x' : '' }} sélectionné{{ wheelStore.uniqueCandidates.length > 1 ? 's' : '' }}
      </span>
      <div class="flex items-center gap-2">
        <button class="text-xs text-indigo-500 hover:text-indigo-700 font-medium" @click="selectAll">Tout</button>
        <span class="text-gray-300">|</span>
        <button class="text-xs text-gray-400 hover:text-red-500" @click="wheelStore.clear()">Aucun</button>
      </div>
    </div>

    <!-- Liste des jeux filtrés comme checklist -->
    <div class="max-h-56 overflow-y-auto">
      <label
        v-for="game in filteredGames"
        :key="game.id"
        class="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
      >
        <input
          type="checkbox"
          :checked="isInWheel(game.id)"
          class="rounded accent-indigo-500 shrink-0 w-4 h-4"
          @change="toggle(game)"
        />
        <span class="text-sm text-gray-700 truncate flex-1">{{ game.nom }}</span>
        <span v-if="game.emplacement" class="text-xs text-gray-400 shrink-0">{{ game.emplacement }}</span>
      </label>
      <p v-if="filteredGames.length === 0" class="px-3 py-4 text-sm text-gray-400 text-center">
        Aucun jeu pour ces filtres
      </p>
    </div>

    <!-- Ajouter manuellement -->
    <div class="border-t border-gray-100 px-3 py-2.5">
      <p class="text-xs text-gray-400 mb-1.5 font-medium">Ajouter manuellement</p>
      <div class="relative">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher…"
          class="w-full border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300"
          @input="updateSuggestions"
          @keydown.escape="suggestions = []"
        />
        <ul
          v-if="suggestions.length > 0"
          class="absolute z-20 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto"
        >
          <li
            v-for="game in suggestions"
            :key="game.id"
            class="px-3 py-2 text-xs hover:bg-indigo-50 cursor-pointer truncate flex justify-between items-center"
            @click="addGame(game)"
          >
            <span>{{ game.nom }}</span>
            <span class="text-gray-400 ml-2">{{ game.emplacement }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useWheelStore } from '@/stores/wheelStore'
import { useGamesStore } from '@/stores/gamesStore'
import { useGameFilters } from '@/composables/useGameFilters'
import type { Game } from '@/domain/Game'

const wheelStore = useWheelStore()
const gamesStore = useGamesStore()
const { filteredGames } = useGameFilters()

const searchQuery = ref('')
const suggestions = ref<Game[]>([])

function isInWheel(id: string): boolean {
  return wheelStore.uniqueCandidates.some(g => g.id === id)
}

function toggle(game: Game) {
  if (isInWheel(game.id)) wheelStore.remove(game.id)
  else wheelStore.add(game)
}

function selectAll() {
  filteredGames.value.forEach(g => { if (!isInWheel(g.id)) wheelStore.add(g) })
}

function updateSuggestions() {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) { suggestions.value = []; return }
  // Suggère des jeux pas encore dans la roue
  suggestions.value = gamesStore.activeGames
    .filter(g => !g.archived && g.nom.toLowerCase().includes(q) && !isInWheel(g.id))
    .slice(0, 8)
}

function addGame(game: Game) {
  wheelStore.add(game)
  searchQuery.value = ''
  suggestions.value = []
}
</script>

