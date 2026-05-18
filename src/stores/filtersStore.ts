import { defineStore } from 'pinia'
import { ref } from 'vue'
import { defaultFilters, type GameFilters } from '@/domain/Filters'
import type { Profile } from '@/domain/Profile'

export type NoteMode = 'famille' | Profile | 'bgg'

export const useFiltersStore = defineStore('filters', () => {
  const filters = ref<GameFilters>(defaultFilters())
  const noteMode = ref<NoteMode>('famille')

  function reset() {
    filters.value = defaultFilters()
  }

  return { filters, noteMode, reset }
})
