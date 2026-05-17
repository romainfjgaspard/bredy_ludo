<template>
  <div class="min-h-screen bg-gray-50 pb-20 flex flex-col">
    <div class="max-w-4xl mx-auto w-full px-4 pt-4 flex-1">
      <h1 class="text-2xl font-bold mb-4">Roue de décision</h1>

      <div class="md:flex md:gap-6">
        <!-- Candidates -->
        <div class="md:w-64 mb-4 md:mb-0">
          <div class="bg-white rounded-xl shadow p-3 space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-semibold text-sm">Candidats ({{ candidates.length }})</span>
              <div class="flex gap-2">
                <button class="text-xs text-indigo-600 hover:text-indigo-800" @click="loadFiltered">Depuis filtres</button>
                <button class="text-xs text-red-400 hover:text-red-600" @click="wheelStore.clear()">Vider</button>
              </div>
            </div>
            <label class="flex items-center gap-2 text-xs">
              <input v-model="includeExtensions" type="checkbox" class="rounded" />
              Inclure extensions
            </label>
            <ul class="space-y-1 max-h-64 overflow-y-auto">
              <li v-for="game in candidates" :key="game.id" class="flex items-center justify-between text-sm">
                <span class="truncate flex-1 mr-2">{{ game.nom }}</span>
                <button class="text-gray-400 hover:text-red-500 shrink-0" @click="wheelStore.remove(game.id)">×</button>
              </li>
            </ul>
            <button
              class="w-full text-xs bg-indigo-50 text-indigo-700 py-1.5 rounded-lg hover:bg-indigo-100"
              @click="loadAll"
            >
              Charger tous les jeux
            </button>
          </div>
        </div>

        <!-- Wheel -->
        <div class="flex-1 flex flex-col items-center gap-4">
          <DecisionWheel :candidates="candidates" :is-spinning="isSpinning" :result="result" />
          <button
            class="px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold text-lg disabled:opacity-50"
            :disabled="candidates.length === 0 || isSpinning"
            @click="spin()"
          >
            {{ isSpinning ? 'En cours…' : 'Tourner !' }}
          </button>
          <div v-if="result" class="text-center bg-white rounded-xl shadow p-4 w-full max-w-xs">
            <p class="text-xs text-gray-500 mb-1">Résultat :</p>
            <p class="font-bold text-lg text-indigo-700">{{ result.nom }}</p>
          </div>
        </div>
      </div>
    </div>
    <AppNav />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useWheelStore } from '@/stores/wheelStore'
import { useGameFilters } from '@/composables/useGameFilters'
import { useWheel } from '@/composables/useWheel'
import DecisionWheel from '@/components/wheel/DecisionWheel.vue'
import AppNav from '@/components/layout/AppNav.vue'

const wheelStore = useWheelStore()
const { filteredGames } = useGameFilters()
const { candidates, result, isSpinning, spin, buildCandidatesFromFiltered, buildCandidatesFromAll } = useWheel()

const includeExtensions = ref(false)

function loadFiltered() {
  buildCandidatesFromFiltered(filteredGames.value)
}

function loadAll() {
  buildCandidatesFromAll(includeExtensions.value)
}
</script>
