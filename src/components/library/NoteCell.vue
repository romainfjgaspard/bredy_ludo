<template>
  <div class="relative inline-flex items-center gap-1 min-w-[64px]">
    <!-- Mode famille ou BGG : readonly -->
    <template v-if="noteMode === 'famille' || noteMode === 'bgg'">
      <span v-if="note !== null" class="text-amber-400 font-semibold">
        {{ noteMode === 'bgg' ? note.toFixed(1) : '★'.repeat(note) }}
      </span>
      <span v-else class="text-gray-300 text-xs">—</span>
    </template>

    <!-- Mode membre : étoiles toujours cliquables (redirect login si pas admin) -->
    <template v-else>
      <button
        v-for="star in 5"
        :key="star"
        type="button"
        class="text-base leading-none transition-colors"
        :class="[
          pending && pendingStar === star ? 'opacity-50 cursor-wait' : 'cursor-pointer',
          hovered >= star || (hovered === 0 && (note ?? 0) >= star)
            ? 'text-amber-400'
            : 'text-gray-200 hover:text-amber-300',
        ]"
        :disabled="pending"
        @mouseenter="hovered = star"
        @mouseleave="hovered = 0"
        @click="handleClick(star)"
      >★</button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { updateRating } from '@/services/gamesService'
import { useGamesStore } from '@/stores/gamesStore'
import { computeFamilyRating } from '@/utils/ratingCalc'
import type { Game } from '@/domain/Game'
import type { NoteMode } from '@/stores/filtersStore'
import { PROFILES } from '@/domain/Profile'

const props = defineProps<{
  game: Game
  noteMode: NoteMode
}>()

const emit = defineEmits<{ saved: []; loginRequired: [] }>()

const router = useRouter()
const authStore = useAuthStore()
const gamesStore = useGamesStore()

const hovered = ref(0)
const pending = ref(false)
const pendingStar = ref(0)

const note = computed<number | null>(() => {
  if (props.noteMode === 'famille') return computeFamilyRating(props.game)
  if (props.noteMode === 'bgg') return props.game.metadata?.bgg_rating ?? null
  const profile = props.noteMode as typeof PROFILES[number]
  return props.game.ratings?.[profile]?.value ?? null
})

async function handleClick(star: number) {
  if (!authStore.isAdmin) {
    emit('loginRequired')
    router.push('/login')
    return
  }
  const profile = props.noteMode as typeof PROFILES[number]
  if (!PROFILES.includes(profile)) return
  pending.value = true
  pendingStar.value = star
  const newVal = note.value === star ? null : star  // click même étoile = effacer
  try {
    await updateRating(props.game.id, profile, newVal)
    await gamesStore.refresh()
    emit('saved')
  } catch {
    // silently ignore
  } finally {
    pending.value = false
    pendingStar.value = 0
    hovered.value = 0
  }
}
</script>
