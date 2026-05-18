<template>
  <div class="min-h-screen bg-base-200 pb-20">
    <div class="max-w-2xl mx-auto px-4 pt-4 space-y-4">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">Administration</h1>
        <button class="text-sm text-red-500 hover:text-red-700" @click="authStore.logoutUser()">
          Se déconnecter
        </button>
      </div>

      <button
        class="w-full py-2 bg-indigo-600 text-white rounded-xl font-semibold"
        @click="openCreate"
      >
        + Ajouter un jeu
      </button>

      <!-- Recherche -->
      <div class="relative">
        <input
          v-model="search"
          type="search"
          placeholder="Rechercher un jeu…"
          class="w-full border rounded-xl px-3 py-2 pl-8 text-sm bg-base-100 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <svg class="absolute left-2.5 top-2.5 w-4 h-4 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <div class="space-y-2">
        <div
          v-for="game in filteredGames"
          :key="game.id"
          class="bg-base-100 rounded-xl shadow p-3 flex items-center justify-between"
        >
          <div class="flex-1 min-w-0">
            <p class="font-medium text-sm truncate">{{ game.nom }}</p>
            <p class="text-xs text-base-content/50">{{ game.emplacement }} · {{ game.type }}</p>
          </div>
          <div class="flex gap-2 ml-2">
            <button class="text-xs text-indigo-600 hover:text-indigo-800" @click="openEdit(game)">Éditer</button>
            <button class="text-xs text-amber-600 hover:text-amber-800" @click="archive(game.id)" v-if="!game.archived">Archiver</button>
          </div>
        </div>
      </div>
    </div>

    <BaseModal v-model="showForm" :title="editGame ? 'Modifier le jeu' : 'Ajouter un jeu'">
      <GameForm :game="editGame ?? undefined" @saved="onSaved" @cancel="showForm = false" />
    </BaseModal>

    <AppNav />
    <BaseToast :message="toastMsg" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useGamesStore } from '@/stores/gamesStore'
import { archiveGame } from '@/services/gamesService'
import type { Game } from '@/domain/Game'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseToast from '@/components/common/BaseToast.vue'
import GameForm from '@/components/admin/GameForm.vue'
import AppNav from '@/components/layout/AppNav.vue'

const authStore = useAuthStore()
const gamesStore = useGamesStore()
const showForm = ref(false)
const editGame = ref<Game | null>(null)
const toastMsg = ref('')
const search = ref('')

const filteredGames = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return gamesStore.games
  return gamesStore.games.filter(g => g.nom.toLowerCase().includes(q))
})

onMounted(() => { if (gamesStore.games.length === 0) gamesStore.refresh() })

function openCreate() { editGame.value = null; showForm.value = true }
function openEdit(game: Game) { editGame.value = game; showForm.value = true }

async function archive(id: string) {
  await archiveGame(id)
  await gamesStore.refresh()
  toastMsg.value = 'Jeu archivé'
}

async function onSaved() {
  showForm.value = false
  await gamesStore.refresh()
  toastMsg.value = 'Sauvegardé !'
}
</script>
