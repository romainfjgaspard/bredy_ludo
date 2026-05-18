<template>
  <div class="bg-white rounded-xl shadow overflow-hidden">
    <!-- Toggle header -->
    <button
      class="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
      @click="open = !open"
    >
      <span class="flex items-center gap-2">
        <svg class="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
        </svg>
        Filtres
        <span v-if="activeCount > 0" class="bg-indigo-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{{ activeCount }}</span>
      </span>
      <svg class="w-4 h-4 text-gray-400 transition-transform" :class="open ? 'rotate-180' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <!-- Filter body -->
    <Transition name="slide">
      <div v-if="open" class="px-4 pb-4 space-y-4 border-t border-gray-100">
        <!-- Nb joueurs -->
        <div class="pt-3">
          <label class="text-xs text-gray-500 mb-1 block font-medium">Nombre de joueurs</label>
          <div class="flex items-center gap-2">
            <button
              v-for="n in [2,3,4,5,6,7,8]"
              :key="n"
              class="w-8 h-8 rounded-lg text-xs font-semibold transition-colors"
              :class="filters.players === n
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
              @click="filters.players = filters.players === n ? null : n"
            >{{ n }}</button>
            <span class="text-xs text-gray-400">+</span>
            <button
              class="px-2 h-8 rounded-lg text-xs font-semibold transition-colors"
              :class="filters.players === 9
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
              @click="filters.players = filters.players === 9 ? null : 9"
            >9+</button>
          </div>
        </div>

        <!-- Durée -->
        <div>
          <label class="text-xs text-gray-500 mb-1 block font-medium">Durée (min)</label>
          <div class="flex gap-2 items-center">
            <input v-model.number="filters.durationMin" type="number" min="0" max="999" placeholder="Min"
              class="w-20 border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            <span class="text-gray-400">–</span>
            <input v-model.number="filters.durationMax" type="number" min="0" max="999" placeholder="Max"
              class="w-20 border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
        </div>

        <!-- Âge -->
        <div>
          <label class="text-xs text-gray-500 mb-1 block font-medium">Âge requis (ans)</label>
          <div class="flex gap-2 items-center">
            <input v-model.number="filters.ageMin" type="number" min="0" max="99" placeholder="Min"
              class="w-20 border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            <span class="text-gray-400">–</span>
            <input v-model.number="filters.ageMax" type="number" min="0" max="99" placeholder="Max"
              class="w-20 border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
        </div>

        <!-- Note minimale -->
        <div>
          <label class="text-xs text-gray-500 mb-1 block font-medium">Note famille minimale</label>
          <div class="flex gap-1">
            <button
              v-for="star in [1,2,3,4,5]"
              :key="star"
              class="text-lg transition-colors"
              :class="filters.minRating !== null && filters.minRating >= star ? 'text-amber-400' : 'text-gray-300 hover:text-amber-300'"
              @click="filters.minRating = filters.minRating === star ? null : star"
            >★</button>
            <span v-if="filters.minRating" class="text-xs text-gray-400 self-center ml-1">min {{ filters.minRating }}★</span>
          </div>
        </div>

        <!-- Catégorie -->
        <div v-if="categories.length > 0">
          <label class="text-xs text-gray-500 mb-1 block font-medium">Catégorie</label>
          <select v-model="filters.category"
            class="w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
            <option :value="null">Toutes</option>
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>

        <!-- Dernière partie -->
        <div>
          <label class="text-xs text-gray-500 mb-1 block font-medium">Dernière partie</label>
          <div class="flex flex-wrap gap-1">
            <button
              v-for="opt in lastPlayedOptions"
              :key="opt.value ?? 'null'"
              class="text-xs px-2.5 py-1 rounded-full border transition-colors"
              :class="filters.lastPlayedFilter === opt.value
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'"
              @click="filters.lastPlayedFilter = opt.value"
            >{{ opt.label }}</button>
          </div>
        </div>

        <!-- Extensions -->
        <label class="flex items-center gap-2 text-sm">
          <input v-model="filters.includeExtensions" type="checkbox" class="rounded accent-indigo-500" />
          <span class="text-gray-600">Inclure les extensions</span>
        </label>

        <!-- Reset -->
        <button class="text-xs text-red-500 hover:text-red-700 font-medium" @click="filtersStore.reset()">
          ✕ Réinitialiser les filtres
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useFiltersStore } from '@/stores/filtersStore'
import { useGamesStore } from '@/stores/gamesStore'
import type { LastPlayedFilter } from '@/domain/Filters'

const filtersStore = useFiltersStore()
const gamesStore = useGamesStore()
const { filters } = storeToRefs(filtersStore)

const open = ref(false)

// Catégories disponibles, extraites des données
const categories = computed(() => {
  const cats = new Set<string>()
  for (const game of gamesStore.activeGames) {
    game.metadata?.categories?.forEach(c => cats.add(c))
  }
  return [...cats].sort()
})

const lastPlayedOptions: { label: string; value: LastPlayedFilter }[] = [
  { label: 'Peu importe', value: null },
  { label: '> 1 mois', value: '1month' },
  { label: '> 6 mois', value: '6months' },
  { label: '> 1 an', value: '1year' },
]

// Badge : nombre de filtres actifs
const activeCount = computed(() => {
  const f = filters.value
  let n = 0
  if (f.players !== null) n++
  if (f.durationMin !== null || f.durationMax !== null) n++
  if (f.ageMin !== null || f.ageMax !== null) n++
  if (f.minRating !== null) n++
  if (f.category !== null) n++
  if (f.lastPlayedFilter !== null) n++
  if (f.includeExtensions) n++
  return n
})
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: max-height 0.25s ease, opacity 0.2s ease;
  max-height: 600px;
  overflow: hidden;
}
.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>

