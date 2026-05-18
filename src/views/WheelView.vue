<template>
  <div class="min-h-screen bg-base-200 pb-20 flex flex-col">
    <!-- Barre de filtre (partagée avec bibliothèque) -->
    <div class="max-w-4xl mx-auto w-full px-3 pt-4 space-y-2">
      <div class="relative">
        <input
          v-model="filtersStore.filters.search"
          type="search"
          placeholder="Rechercher pour filtrer…"
          class="w-full border rounded-xl px-3 py-2 pl-8 text-sm bg-base-100 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <svg class="absolute left-2.5 top-2.5 w-4 h-4 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <FilterPanel />
    </div>

    <!-- Corps principal -->
    <div class="max-w-4xl mx-auto w-full px-3 mt-3 flex-1">
      <div class="flex flex-col md:flex-row gap-4 items-start">

        <!-- Checklist des candidats (izquierda/haut mobile) -->
        <div class="w-full md:w-72 shrink-0">
          <CandidateList />
        </div>

        <!-- Roue + bouton (droite/bas mobile) -->
        <div class="flex-1 flex flex-col items-center gap-3">
          <DecisionWheel
            :candidates="wheelCandidates"
            :spin-trigger="spinTrigger"
            @spin-complete="handleSpinComplete"
            @tap-to-spin="spin()"
          />

          <button
            class="px-10 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-2xl font-bold text-lg shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            :disabled="wheelCandidates.length === 0 || isSpinning"
            @click="spin()"
          >
            {{ isSpinning ? '🎲 En cours…' : '🎰 Tourner !' }}
          </button>

          <p v-if="wheelCandidates.length === 0" class="text-sm text-base-content/40 text-center">
            Cochez des jeux dans la liste ←
          </p>
          <p v-else class="text-sm text-base-content/50">
            {{ wheelCandidates.length }} jeu{{ wheelCandidates.length > 1 ? 'x' : '' }} dans la roue
          </p>
        </div>
      </div>
    </div>

    <!-- Résultat overlay -->
    <Transition name="result-pop">
      <div
        v-if="result && !isSpinning"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="result = null" />

        <!-- Card -->
        <div class="relative z-10 bg-base-100 rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
          <div class="absolute inset-x-0 top-0 h-2 rounded-t-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

          <p class="text-xs font-semibold uppercase tracking-widest text-base-content/40">C'est parti !</p>

          <div class="w-20 h-20 mx-auto rounded-2xl overflow-hidden bg-base-200 shadow">
            <img
              :src="resultImgUrl"
              :alt="result.nom"
              class="w-full h-full object-cover"
              @error="($event.target as HTMLImageElement).src = fallback"
            />
          </div>

          <div>
            <h2 class="text-2xl font-extrabold text-base-content">{{ result.nom }}</h2>
            <p v-if="result.type === 'extension'" class="text-xs text-purple-600 mt-0.5">Extension</p>
            <p v-if="result.metadata" class="text-sm text-base-content/50 mt-1">
              {{ result.metadata.nb_joueurs_min }}–{{ result.metadata.nb_joueurs_max }} joueurs
              · {{ result.metadata.duree_min }}–{{ result.metadata.duree_max }} min
            </p>
            <!-- Compartiment -->
            <div class="mt-2 inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-1.5">
              <svg class="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <span class="text-sm font-semibold text-indigo-700">Compartiment {{ result.emplacement }}</span>
            </div>
          </div>

          <div class="flex gap-3">
            <router-link
              :to="`/game/${result.id}`"
              class="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors"
            >
              Voir la fiche →
            </router-link>
            <button
              class="flex-1 py-2.5 bg-base-200 text-base-content/80 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
              @click="spin()"
            >
              🔄 Relancer
            </button>
          </div>

          <button class="text-xs text-base-content/40 hover:text-base-content/60" @click="result = null">
            Fermer
          </button>
        </div>
      </div>
    </Transition>

    <AppNav />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useWheel } from '@/composables/useWheel'
import { useFiltersStore } from '@/stores/filtersStore'
import { useGamesStore } from '@/stores/gamesStore'
import { usePlaysStore } from '@/stores/playsStore'
import { imageUrl } from '@/utils/imageUrl'
import FilterPanel from '@/components/library/FilterPanel.vue'
import DecisionWheel from '@/components/wheel/DecisionWheel.vue'
import CandidateList from '@/components/wheel/CandidateList.vue'
import AppNav from '@/components/layout/AppNav.vue'

const { result, isSpinning, spinTrigger, spin, handleSpinComplete } = useWheel()
const filtersStore = useFiltersStore()
const gamesStore = useGamesStore()
const playsStore = usePlaysStore()

const fallback = `${import.meta.env.BASE_URL}images/placeholder.jpg`

// Les candidats = les jeux sélectionnés dans le wheelStore (via CandidateList)
import { useWheelStore } from '@/stores/wheelStore'
const wheelStore = useWheelStore()
const wheelCandidates = computed(() => wheelStore.uniqueCandidates)

const resultImgUrl = computed(() =>
  result.value ? imageUrl(result.value.image_url) : fallback
)

onMounted(() => {
  if (gamesStore.games.length === 0) gamesStore.refresh()
  if (playsStore.plays.length === 0) playsStore.refresh()
})
</script>

<style scoped>
.result-pop-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.result-pop-leave-active {
  transition: all 0.2s ease-in;
}
.result-pop-enter-from,
.result-pop-leave-to {
  opacity: 0;
  transform: scale(0.85);
}
</style>


