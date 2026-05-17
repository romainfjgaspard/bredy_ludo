<template>
  <div class="min-h-screen bg-gray-50 pb-20">
    <div class="max-w-2xl mx-auto px-4 pt-4 space-y-3">
      <ProfileSelector />
      <EveningModePanel />
      <SearchBar v-model="filtersStore.filters.search" />
      <FilterPanel />

      <div class="flex items-center justify-between">
        <p class="text-sm text-gray-500">{{ filteredGames.length }} jeu{{ filteredGames.length > 1 ? 'x' : '' }}</p>
        <RefreshButton :loading="gamesStore.loading" @refresh="gamesStore.refresh()" />
      </div>

      <LoadingSpinner v-if="gamesStore.loading" />

      <template v-else>
        <p v-if="filteredGames.length === 0" class="text-center text-gray-400 py-12">
          Aucun jeu ne correspond aux filtres.
        </p>
        <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <GameCard
            v-for="game in filteredGames"
            :key="game.id"
            :game="game"
            :active-profile="profileStore.activeProfile"
          />
        </div>
      </template>
    </div>
    <AppNav />
    <BaseToast :message="toastMsg" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ProfileSelector from '@/components/library/ProfileSelector.vue'
import EveningModePanel from '@/components/library/EveningModePanel.vue'
import SearchBar from '@/components/library/SearchBar.vue'
import FilterPanel from '@/components/library/FilterPanel.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import GameCard from '@/components/common/GameCard.vue'
import RefreshButton from '@/components/common/RefreshButton.vue'
import BaseToast from '@/components/common/BaseToast.vue'
import AppNav from '@/components/layout/AppNav.vue'
import { useGamesStore } from '@/stores/gamesStore'
import { useFiltersStore } from '@/stores/filtersStore'
import { useProfileStore } from '@/stores/profileStore'
import { useGameFilters } from '@/composables/useGameFilters'

const gamesStore = useGamesStore()
const filtersStore = useFiltersStore()
const profileStore = useProfileStore()
const { filteredGames } = useGameFilters()
const toastMsg = ref('')

onMounted(async () => {
  if (gamesStore.games.length === 0) {
    try {
      await gamesStore.refresh()
    } catch {
      toastMsg.value = 'Impossible de charger les jeux'
    }
  }
})
</script>
