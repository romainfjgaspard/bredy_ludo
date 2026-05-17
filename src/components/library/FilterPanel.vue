<template>
  <div class="bg-white rounded-xl p-4 shadow space-y-4">
    <div class="flex gap-4">
      <div class="flex-1">
        <label class="text-xs text-gray-500 mb-1 block">Joueurs min</label>
        <input v-model.number="filters.playersMin" type="number" min="1" max="10" placeholder="—"
          class="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
      </div>
      <div class="flex-1">
        <label class="text-xs text-gray-500 mb-1 block">Joueurs max</label>
        <input v-model.number="filters.playersMax" type="number" min="1" max="10" placeholder="—"
          class="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
      </div>
    </div>

    <details>
      <summary class="cursor-pointer text-sm text-indigo-600 font-medium">Filtres avancés</summary>
      <div class="mt-3 space-y-3">
        <div class="flex gap-4">
          <div class="flex-1">
            <label class="text-xs text-gray-500 mb-1 block">Durée min (min)</label>
            <input v-model.number="filters.durationMin" type="number" min="0" placeholder="—"
              class="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div class="flex-1">
            <label class="text-xs text-gray-500 mb-1 block">Durée max (min)</label>
            <input v-model.number="filters.durationMax" type="number" min="0" placeholder="—"
              class="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
        </div>
        <div>
          <label class="text-xs text-gray-500 mb-1 block">Âge max des joueurs</label>
          <input v-model.number="filters.ageMax" type="number" min="3" placeholder="—"
            class="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>
        <label class="flex items-center gap-2 text-sm">
          <input v-model="filters.includeExtensions" type="checkbox" class="rounded" />
          Inclure les extensions
        </label>
      </div>
    </details>

    <button class="text-xs text-red-500 hover:text-red-700" @click="filtersStore.reset()">
      Réinitialiser les filtres
    </button>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useFiltersStore } from '@/stores/filtersStore'

const filtersStore = useFiltersStore()
const { filters } = storeToRefs(filtersStore)
</script>
