<template>
  <div class="min-h-screen bg-gray-50 pb-20">
    <div class="max-w-2xl mx-auto px-4 pt-4">
      <button class="flex items-center gap-1 text-indigo-600 mb-4 text-sm" @click="$router.back()">
        ← Retour
      </button>

      <LoadingSpinner v-if="!game" />

      <template v-else>
        <div class="bg-white rounded-2xl shadow overflow-hidden">
          <img
            :src="imgUrl"
            :alt="game.nom"
            class="w-full h-48 object-cover bg-gray-100"
            @error="imgUrl = `${$router.options.history.base}images/placeholder.jpg`"
          />
          <div class="p-4 space-y-4">
            <div class="flex items-start justify-between gap-2">
              <h1 class="text-xl font-bold">{{ game.nom }}</h1>
              <span v-if="game.type === 'extension'" class="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full shrink-0">Extension</span>
            </div>

            <div v-if="game.metadata" class="grid grid-cols-3 gap-2 text-center text-sm">
              <div class="bg-gray-50 rounded-lg p-2">
                <div class="font-semibold">{{ game.metadata.nb_joueurs_min }}–{{ game.metadata.nb_joueurs_max }}</div>
                <div class="text-xs text-gray-500">Joueurs</div>
                <div v-if="game.metadata.community_best_players" class="text-xs text-indigo-500 mt-0.5">
                  ★ {{ game.metadata.community_best_players }} selon BGG
                </div>
              </div>
              <div class="bg-gray-50 rounded-lg p-2">
                <div class="font-semibold">{{ game.metadata.duree_min }}–{{ game.metadata.duree_max }}</div>
                <div class="text-xs text-gray-500">Minutes</div>
              </div>
              <div class="bg-gray-50 rounded-lg p-2">
                <div class="font-semibold">{{ game.metadata.age_min }}+</div>
                <div class="text-xs text-gray-500">Ans</div>
                <div v-if="game.metadata.community_min_age && game.metadata.community_min_age !== game.metadata.age_min" class="text-xs text-indigo-500 mt-0.5">
                  ★ {{ game.metadata.community_min_age }}+ selon BGG
                </div>
              </div>
            </div>

            <!-- Infos BGG -->
            <div v-if="game.metadata?.bgg_rating || game.metadata?.bgg_weight || game.metadata?.bgg_link" class="flex items-center gap-3 text-sm flex-wrap">
              <span v-if="game.metadata?.bgg_rating" class="text-gray-500">
                Note BGG : <span class="font-semibold text-gray-700">{{ game.metadata.bgg_rating?.toFixed(1) }}/10</span>
              </span>
              <span v-if="game.metadata?.bgg_weight" class="text-gray-500">
                Complexité : <span class="font-semibold text-gray-700">{{ game.metadata.bgg_weight?.toFixed(1) }}/5</span>
              </span>
              <a
                v-if="game.metadata?.bgg_link"
                :href="game.metadata.bgg_link"
                target="_blank"
                rel="noopener noreferrer"
                class="ml-auto text-indigo-600 hover:underline text-xs flex items-center gap-1"
              >
                Voir sur BGG ↗
              </a>
            </div>

            <!-- Notes par profil -->
            <div>
              <h2 class="font-semibold mb-2">Notes</h2>
              <div class="space-y-2">
                <div v-for="profile in PROFILES" :key="profile" class="flex items-center justify-between">
                  <span class="text-sm text-gray-600 w-24">{{ profile }}</span>
                  <StarRating
                    :model-value="game.ratings?.[profile]?.value ?? null"
                    @update:model-value="saveRating(profile, $event)"
                  />
                </div>
              </div>
            </div>

            <!-- Enregistrer une partie -->
            <div v-if="authStore.isAdmin || true">
              <button
                class="w-full py-2 bg-indigo-600 text-white rounded-xl font-semibold"
                @click="showPlayModal = true"
              >
                + Enregistrer une partie
              </button>
            </div>

            <!-- Historique parties -->
            <div>
              <h2 class="font-semibold mb-2">Historique des parties</h2>
              <LoadingSpinner v-if="loadingPlays" />
              <p v-else-if="gamePlays.length === 0" class="text-sm text-gray-400">Aucune partie enregistrée.</p>
              <ul v-else class="space-y-1">
                <li v-for="play in gamePlays" :key="play.id" class="flex items-center justify-between text-sm">
                  <span class="text-gray-500">{{ formatDate(play.playedAt?.toDate?.()) }}</span>
                  <span class="text-gray-700">{{ play.players.join(', ') }}</span>
                  <button v-if="authStore.isAdmin" class="text-red-400 hover:text-red-600 text-xs" @click="removePlay(play.id)">Suppr.</button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Modal partie -->
    <BaseModal v-model="showPlayModal" title="Enregistrer une partie">
      <div class="space-y-3">
        <p class="text-sm font-medium">Participants</p>
        <div class="flex flex-wrap gap-2">
          <label v-for="profile in PROFILES" :key="profile" class="flex items-center gap-1 text-sm">
            <input v-model="selectedPlayers" type="checkbox" :value="profile" class="rounded" />
            {{ profile }}
          </label>
        </div>
        <button
          class="w-full py-2 bg-indigo-600 text-white rounded-xl font-semibold mt-2 disabled:opacity-50"
          :disabled="selectedPlayers.length === 0 || savingPlay"
          @click="submitPlay"
        >
          Enregistrer
        </button>
      </div>
    </BaseModal>

    <AppNav />
    <BaseToast :message="toastMsg" :type="toastType" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Timestamp } from 'firebase/firestore'
import { useGamesStore } from '@/stores/gamesStore'
import { useAuthStore } from '@/stores/authStore'
import { usePlaysStore } from '@/stores/playsStore'
import { updateRating } from '@/services/gamesService'
import { getPlaysByGame } from '@/services/playsService'
import { PROFILES, type Profile } from '@/domain/Profile'
import type { Play } from '@/domain/Play'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import StarRating from '@/components/common/StarRating.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseToast from '@/components/common/BaseToast.vue'
import AppNav from '@/components/layout/AppNav.vue'
import { imageUrl } from '@/utils/imageUrl'

const route = useRoute()
const gamesStore = useGamesStore()
const authStore = useAuthStore()
const playsStore = usePlaysStore()

const game = computed(() => gamesStore.getById(route.params.id as string))
const imgUrl = ref('')
const gamePlays = ref<Play[]>([])
const loadingPlays = ref(false)
const showPlayModal = ref(false)
const selectedPlayers = ref<Profile[]>([])
const savingPlay = ref(false)
const toastMsg = ref('')
const toastType = ref<'success' | 'error'>('success')

onMounted(async () => {
  if (!game.value) await gamesStore.refresh()
  if (game.value) imgUrl.value = imageUrl(game.value.image_url)
  loadingPlays.value = true
  try {
    gamePlays.value = await getPlaysByGame(route.params.id as string)
  } finally {
    loadingPlays.value = false
  }
})

async function saveRating(profile: Profile, value: number | null) {
  if (!game.value) return
  try {
    await updateRating(game.value.id, profile, value)
    await gamesStore.refresh()
    toastMsg.value = 'Note sauvegardée'
    toastType.value = 'success'
  } catch {
    toastMsg.value = 'Erreur lors de la sauvegarde'
    toastType.value = 'error'
  }
}

async function submitPlay() {
  if (!game.value || selectedPlayers.value.length === 0) return
  savingPlay.value = true
  try {
    await playsStore.addLocalPlay({
      gameId: game.value.id,
      gameName: game.value.nom,
      players: selectedPlayers.value,
      playedAt: Timestamp.now(),
    })
    gamePlays.value = await getPlaysByGame(game.value.id)
    showPlayModal.value = false
    selectedPlayers.value = []
    toastMsg.value = 'Partie enregistrée !'
    toastType.value = 'success'
  } catch {
    toastMsg.value = 'Erreur lors de l\'enregistrement'
    toastType.value = 'error'
  } finally {
    savingPlay.value = false
  }
}

async function removePlay(id: string) {
  await playsStore.removeLocalPlay(id)
  gamePlays.value = gamePlays.value.filter(p => p.id !== id)
}

function formatDate(date: Date | undefined): string {
  if (!date) return '—'
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
</script>
