<template>
  <RouterLink
    :to="{ name: 'game-detail', params: { id: game.id } }"
    class="block bg-base-100 rounded-xl shadow hover:shadow-md transition-shadow overflow-hidden"
  >
    <div class="relative">
      <img
        :src="gameImageUrl"
        :alt="game.nom"
        class="w-full h-32 object-cover bg-base-200"
        loading="lazy"
        @error="onImgError"
      />
      <span
        v-if="game.type === 'extension'"
        class="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full"
      >Extension</span>
    </div>
    <div class="p-3">
      <h3 class="font-semibold text-sm leading-tight line-clamp-2">{{ game.nom }}</h3>
      <div class="mt-1 flex items-center justify-between text-xs text-base-content/50">
        <span v-if="game.metadata">
          {{ game.metadata.nb_joueurs_min }}–{{ game.metadata.nb_joueurs_max }} j.
          · {{ game.metadata.duree_min }}–{{ game.metadata.duree_max }} min
        </span>
        <StarRating :model-value="displayRating" :readonly="true" />
      </div>
    </div>
  </RouterLink>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Game } from '@/domain/Game'
import type { Profile } from '@/domain/Profile'
import StarRating from './StarRating.vue'
import { imageUrl } from '@/utils/imageUrl'
import { computeDisplayRating } from '@/utils/ratingCalc'

const props = defineProps<{
  game: Game
  activeProfile: Profile | null
}>()

const gameImageUrl = ref(imageUrl(props.game.image_url))
const displayRating = computed(() => computeDisplayRating(props.game, props.activeProfile))

function onImgError(e: Event) {
  (e.target as HTMLImageElement).src = `${import.meta.env.BASE_URL}images/placeholder.jpg`
}
</script>
