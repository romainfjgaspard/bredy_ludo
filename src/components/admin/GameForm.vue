<template>
  <form class="space-y-3" @submit.prevent="submit">
    <div>
      <label class="text-sm text-gray-600 mb-1 block">Nom *</label>
      <input v-model="form.nom" required class="input" />
    </div>
    <div>
      <label class="text-sm text-gray-600 mb-1 block">Type</label>
      <select v-model="form.type" class="input">
        <option value="base">Jeu de base</option>
        <option value="extension">Extension</option>
      </select>
    </div>
    <div>
      <label class="text-sm text-gray-600 mb-1 block">Emplacement *</label>
      <LocationPicker v-model="form.emplacement" />
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="text-sm text-gray-600 mb-1 block">Joueurs min</label>
        <input v-model.number="form.nb_joueurs_min" type="number" min="1" class="input" />
      </div>
      <div>
        <label class="text-sm text-gray-600 mb-1 block">Joueurs max</label>
        <input v-model.number="form.nb_joueurs_max" type="number" min="1" class="input" />
      </div>
      <div>
        <label class="text-sm text-gray-600 mb-1 block">Durée min (min)</label>
        <input v-model.number="form.duree_min" type="number" min="0" class="input" />
      </div>
      <div>
        <label class="text-sm text-gray-600 mb-1 block">Durée max (min)</label>
        <input v-model.number="form.duree_max" type="number" min="0" class="input" />
      </div>
    </div>
    <div>
      <label class="text-sm text-gray-600 mb-1 block">Âge minimum</label>
      <input v-model.number="form.age_min" type="number" min="0" class="input" />
    </div>
    <div>
      <label class="text-sm text-gray-600 mb-1 block">ID BGG</label>
      <input v-model.number="form.bgg_id" type="number" class="input" />
    </div>

    <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>

    <div class="flex gap-3 pt-2">
      <button type="button" class="flex-1 py-2 border rounded-xl text-sm" @click="emit('cancel')">Annuler</button>
      <button type="submit" class="flex-1 py-2 bg-indigo-600 text-white rounded-xl font-semibold text-sm disabled:opacity-50" :disabled="saving">
        {{ saving ? 'Sauvegarde…' : 'Sauvegarder' }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { addGame, updateGame } from '@/services/gamesService'
import type { Game, GameType } from '@/domain/Game'
import type { Location } from '@/domain/Location'
import LocationPicker from './LocationPicker.vue'

const props = defineProps<{ game?: Game }>()
const emit = defineEmits<{ saved: []; cancel: [] }>()

const form = reactive({
  nom: props.game?.nom ?? '',
  type: (props.game?.type ?? 'base') as GameType,
  emplacement: (props.game?.emplacement ?? null) as Location | null,
  bgg_id: props.game?.bgg_id ?? null as number | null,
  nb_joueurs_min: props.game?.metadata?.nb_joueurs_min ?? 2,
  nb_joueurs_max: props.game?.metadata?.nb_joueurs_max ?? 4,
  duree_min: props.game?.metadata?.duree_min ?? 30,
  duree_max: props.game?.metadata?.duree_max ?? 60,
  age_min: props.game?.metadata?.age_min ?? 8,
})

const saving = ref(false)
const error = ref('')

async function submit() {
  if (!form.emplacement) { error.value = 'Emplacement requis'; return }
  saving.value = true
  error.value = ''
  try {
    const payload = {
      nom: form.nom,
      type: form.type,
      emplacement: form.emplacement,
      archived: props.game?.archived ?? false,
      bgg_id: form.bgg_id ?? undefined,
      metadata: {
        nb_joueurs_min: form.nb_joueurs_min,
        nb_joueurs_max: form.nb_joueurs_max,
        duree_min: form.duree_min,
        duree_max: form.duree_max,
        age_min: form.age_min,
      },
    }
    if (props.game) {
      await updateGame(props.game.id, payload)
    } else {
      await addGame(payload as any)
    }
    emit('saved')
  } catch (e: unknown) {
    error.value = 'Erreur lors de la sauvegarde'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
@reference "../../assets/main.css";
.input {
  @apply w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300;
}
</style>
