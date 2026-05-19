<template>
  <div class="min-h-screen bg-base-200 pb-20">
    <div class="max-w-4xl mx-auto px-3 pt-4 space-y-3">

      <!-- Barre de recherche + filtre -->
      <div class="flex gap-2">
        <div class="relative flex-1">
          <input
            v-model="filtersStore.filters.search"
            type="search"
            placeholder="Rechercher un jeu…"
            class="w-full border rounded-xl px-3 py-2 pl-8 text-sm bg-base-100 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <svg class="absolute left-2.5 top-2.5 w-4 h-4 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <RefreshButton :loading="gamesStore.loading" @refresh="gamesStore.refresh()" />
      </div>

      <FilterPanel />

      <!-- Sélecteur de mode de note -->
      <div class="flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <button
          v-for="opt in noteModeOptions"
          :key="opt.value"
          class="shrink-0 text-xs px-2.5 py-1 rounded-full border transition-colors"
          :class="filtersStore.noteMode === opt.value
            ? 'bg-indigo-600 text-white border-indigo-600'
            : 'bg-base-100 text-base-content/60 border-base-300 hover:bg-base-200'"
          @click="filtersStore.noteMode = opt.value"
        >{{ opt.label }}</button>
      </div>

      <!-- Compteur + Loading -->
      <div class="flex items-center justify-between text-sm text-base-content/50">
        <span>{{ sortedGames.length }} jeu{{ sortedGames.length > 1 ? 'x' : '' }}</span>
      </div>

      <LoadingSpinner v-if="gamesStore.loading" />

      <template v-else>
        <p v-if="sortedGames.length === 0" class="text-center text-base-content/40 py-12">
          Aucun jeu ne correspond aux filtres.
        </p>

        <!-- Tableau -->
        <div v-else class="bg-base-100 rounded-xl shadow overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-max w-full text-sm">
              <thead>
                <tr class="border-b border-base-200 text-xs text-base-content/50 uppercase tracking-wide">
                  <th
                    v-for="col in columns"
                    :key="col.key"
                    class="px-3 py-3 text-left cursor-pointer select-none hover:bg-base-200 whitespace-nowrap"
                    @click="toggleSort(col.key)"
                  >
                    {{ col.label }}
                    <span v-if="sortKey === col.key" class="ml-0.5 text-indigo-500">{{ sortDir === 'asc' ? '▲' : '▼' }}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="game in sortedGames"
                  :key="game.id"
                  class="border-b border-base-200 hover:bg-base-200 cursor-pointer"
                  @click="goToGame(game.id)"
                >
                  <!-- Nom -->
                  <td class="px-3 py-2.5 font-medium text-base-content">
                    <div class="flex items-center gap-1.5">
                      <span>{{ game.nom }}</span>
                      <span v-if="game.type === 'extension'" class="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">ext.</span>
                    </div>
                  </td>
                  <!-- Catégorie -->
                  <td class="px-3 py-2.5 text-base-content/50 text-xs whitespace-nowrap">
                    {{ game.metadata?.categories?.[0] ?? '—' }}
                  </td>
                  <!-- Joueurs -->
                  <td class="px-3 py-2.5 text-base-content/60 whitespace-nowrap">
                    {{ game.metadata ? `${game.metadata.nb_joueurs_min}–${game.metadata.nb_joueurs_max}` : '—' }}
                  </td>
                  <!-- Durée -->
                  <td class="px-3 py-2.5 text-base-content/60 whitespace-nowrap">
                    {{ game.metadata ? `${game.metadata.duree_min}–${game.metadata.duree_max}` : '—' }}
                  </td>
                  <!-- Âge -->
                  <td class="px-3 py-2.5 text-base-content/60 whitespace-nowrap">
                    {{ game.metadata ? `${game.metadata.age_min}+` : '—' }}
                  </td>
                  <!-- Note -->
                  <td class="px-3 py-2.5" @click.stop>
                    <NoteCell :game="game" :note-mode="filtersStore.noteMode" @saved="onNoteSaved" />
                  </td>
                  <!-- Dernière partie -->
                  <td class="px-3 py-2.5 text-base-content/40 text-xs whitespace-nowrap">
                    {{ formatLastPlay(lastPlayMap.get(game.id)) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </div>

    <AppNav />
    <BaseToast :message="toastMsg" :type="toastType" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import FilterPanel from '@/components/library/FilterPanel.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import RefreshButton from '@/components/common/RefreshButton.vue'
import BaseToast from '@/components/common/BaseToast.vue'
import AppNav from '@/components/layout/AppNav.vue'
import NoteCell from '@/components/library/NoteCell.vue'
import { useGamesStore } from '@/stores/gamesStore'
import { useFiltersStore, type NoteMode } from '@/stores/filtersStore'
import { usePlaysStore } from '@/stores/playsStore'
import { useGameFilters } from '@/composables/useGameFilters'
import { computeFamilyRating } from '@/utils/ratingCalc'
import { PROFILES } from '@/domain/Profile'
import type { Game } from '@/domain/Game'

const router = useRouter()
const gamesStore = useGamesStore()
const filtersStore = useFiltersStore()
const playsStore = usePlaysStore()
const { filteredGames } = useGameFilters()
const toastMsg = ref('')
const toastType = ref<'success' | 'error'>('success')

onMounted(async () => {
  if (gamesStore.games.length === 0) {
    const ok = await gamesStore.refresh()
    if (!ok) { toastMsg.value = 'Impossible de charger les jeux.'; toastType.value = 'error' }
  }
  if (playsStore.plays.length === 0) playsStore.refresh()
})

// ─── Sélecteur de mode de note ─────────────────────────────────────────────
const noteModeOptions: { label: string; value: NoteMode }[] = [
  { label: '★ Famille', value: 'famille' },
  ...PROFILES.map(p => ({ label: p, value: p as NoteMode })),
  { label: 'BGG', value: 'bgg' },
]

// ─── Tri ───────────────────────────────────────────────────────────────────
type SortKey = 'nom' | 'players' | 'category' | 'duree' | 'age' | 'note' | 'lastPlayed'
const sortKey = ref<SortKey>('nom')
const sortDir = ref<'asc' | 'desc'>('asc')

const columns: { key: SortKey; label: string }[] = [
  { key: 'nom',        label: 'Jeu' },
  { key: 'category',   label: 'Catégorie' },
  { key: 'players',    label: '👥' },
  { key: 'duree',      label: '⏱ min' },
  { key: 'age',        label: '🎂 ans' },
  { key: 'note',       label: '★ Note' },
  { key: 'lastPlayed', label: 'Dernière partie' },
]

function getNote(game: Game): number | null {
  const mode = filtersStore.noteMode
  if (mode === 'famille') return computeFamilyRating(game)
  if (mode === 'bgg') return game.metadata?.bgg_rating ?? null
  return game.ratings?.[mode as (typeof PROFILES)[number]]?.value ?? null
}

const lastPlayMap = computed(() => playsStore.getLastPlayByGame())

const sortedGames = computed(() => {
  const arr = [...filteredGames.value]
  arr.sort((a, b) => {
    let va: string | number, vb: string | number
    switch (sortKey.value) {
      case 'nom':        va = a.nom; vb = b.nom; break
      case 'category':   va = a.metadata?.categories?.[0] ?? ''; vb = b.metadata?.categories?.[0] ?? ''; break
      case 'players':    va = a.metadata?.nb_joueurs_min ?? 0; vb = b.metadata?.nb_joueurs_min ?? 0; break
      case 'duree':      va = a.metadata?.duree_min ?? 0; vb = b.metadata?.duree_min ?? 0; break
      case 'age':        va = a.metadata?.age_min ?? 0; vb = b.metadata?.age_min ?? 0; break
      case 'note':       va = getNote(a) ?? -1; vb = getNote(b) ?? -1; break
      case 'lastPlayed': va = lastPlayMap.value.get(a.id)?.getTime() ?? 0; vb = lastPlayMap.value.get(b.id)?.getTime() ?? 0; break
      default:           va = a.nom; vb = b.nom
    }
    if (va < vb) return sortDir.value === 'asc' ? -1 : 1
    if (va > vb) return sortDir.value === 'asc' ?  1 : -1
    return 0
  })
  return arr
})

function toggleSort(key: SortKey) {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = key; sortDir.value = 'asc' }
}

function goToGame(id: string) {
  router.push(`/game/${id}`)
}

function formatLastPlay(d: Date | undefined): string {
  if (!d) return 'Jamais'
  const diff = Date.now() - d.getTime()
  const day = 86_400_000
  if (diff < 7 * day) return `Il y a ${Math.ceil(diff / day)}j`
  if (diff < 60 * day) return `Il y a ${Math.ceil(diff / (7 * day))}sem.`
  if (diff < 365 * day) return `Il y a ${Math.ceil(diff / (30 * day))}mois`
  return `Il y a ${Math.ceil(diff / (365 * day))}an`
}

function onNoteSaved() {
  toastMsg.value = 'Note sauvegardée'
  toastType.value = 'success'
}
</script>

