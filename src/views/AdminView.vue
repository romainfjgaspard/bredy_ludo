<template>
  <div class="min-h-screen bg-gray-50 pb-20">
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

      <div class="space-y-2">
        <div
          v-for="game in gamesStore.games"
          :key="game.id"
          class="bg-white rounded-xl shadow p-3 flex items-center justify-between"
        >
          <div class="flex-1 min-w-0">
            <p class="font-medium text-sm truncate">{{ game.nom }}</p>
            <p class="text-xs text-gray-500">{{ game.emplacement }} · {{ game.type }}</p>
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
import { ref, onMounted } from 'vue'
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
