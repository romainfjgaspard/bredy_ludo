import { defineStore } from 'pinia'
import { ref } from 'vue'
import { defaultFilters, type GameFilters } from '@/domain/Filters'

export const useFiltersStore = defineStore('filters', () => {
  const filters = ref<GameFilters>(defaultFilters())

  function reset() {
    filters.value = defaultFilters()
  }

  return { filters, reset }
})
