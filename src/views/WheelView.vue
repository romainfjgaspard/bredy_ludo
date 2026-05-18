<template>
  <div class="min-h-screen bg-gray-100 pb-20 flex flex-col">
    <div class="max-w-4xl mx-auto w-full px-4 pt-4 flex-1">

      <div class="md:flex md:gap-6 items-start">
        <!-- Candidate list -->
        <div class="md:w-72 mb-4 md:mb-0 shrink-0">
          <CandidateList />
        </div>

        <!-- Wheel + button -->
        <div class="flex-1 flex flex-col items-center gap-4">
          <DecisionWheel
            :candidates="candidates"
            :spin-trigger="spinTrigger"
            @spin-complete="handleSpinComplete"
            @tap-to-spin="spin()"
          />

          <button
            class="px-10 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-2xl font-bold text-lg shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            :disabled="candidates.length === 0 || isSpinning"
            @click="spin()"
          >
            {{ isSpinning ? '🎲 En cours…' : '🎰 Tourner !' }}
          </button>

          <p v-if="candidates.length === 0" class="text-sm text-gray-400 text-center">
            Sélectionnez un preset ou ajoutez des jeux →
          </p>
          <p v-else class="text-sm text-gray-500">
            {{ candidates.length }} jeu{{ candidates.length > 1 ? 'x' : '' }} dans la roue
          </p>
        </div>
      </div>
    </div>

    <!-- Result overlay -->
    <Transition name="result-pop">
      <div
        v-if="result && !isSpinning"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="result = null"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="result = null" />

        <!-- Card -->
        <div class="relative z-10 bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
          <!-- Confetti strip -->
          <div class="absolute inset-x-0 top-0 h-2 rounded-t-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

          <p class="text-xs font-semibold uppercase tracking-widest text-gray-400">Résultat</p>

          <div
            class="w-20 h-20 mx-auto rounded-2xl overflow-hidden bg-gray-100 shadow"
          >
            <img
              :src="resultImageUrl"
              :alt="result.nom"
              class="w-full h-full object-cover"
              @error="onImgError"
            />
          </div>

          <div>
            <h2 class="text-2xl font-extrabold text-gray-900">{{ result.nom }}</h2>
            <p v-if="result.type === 'extension'" class="text-xs text-purple-600 font-medium mt-0.5">Extension</p>
            <p v-if="result.metadata" class="text-sm text-gray-500 mt-1">
              {{ result.metadata.nb_joueurs_min }}–{{ result.metadata.nb_joueurs_max }} joueurs
              · {{ result.metadata.duree_min }}–{{ result.metadata.duree_max }} min
            </p>
          </div>

          <div class="flex gap-3">
            <router-link
              :to="`/game/${result.id}`"
              class="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors"
            >
              Voir la fiche →
            </router-link>
            <button
              class="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
              @click="spin()"
            >
              🔄 Relancer
            </button>
          </div>

          <button
            class="text-xs text-gray-400 hover:text-gray-600"
            @click="result = null"
          >
            Fermer
          </button>
        </div>
      </div>
    </Transition>

    <AppNav />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWheel } from '@/composables/useWheel'
import { imageUrl } from '@/utils/imageUrl'
import DecisionWheel from '@/components/wheel/DecisionWheel.vue'
import CandidateList from '@/components/wheel/CandidateList.vue'
import AppNav from '@/components/layout/AppNav.vue'

const { candidates, result, isSpinning, spinTrigger, spin, handleSpinComplete } = useWheel()

const resultImageUrl = ref('')
const fallback = `${import.meta.env.BASE_URL}images/placeholder.jpg`

function onImgError(e: Event) {
  ;(e.target as HTMLImageElement).src = fallback
}

// Met à jour l'image quand le résultat change
const _resultImg = computed(() => {
  if (!result.value) return fallback
  return imageUrl(result.value.image_url)
})
// sync into a ref to handle @error fallback
import { watch } from 'vue'
watch(_resultImg, (url) => { resultImageUrl.value = url }, { immediate: true })
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

