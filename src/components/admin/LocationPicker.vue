<template>
  <div class="grid grid-cols-5 gap-2">
    <button
      v-for="loc in LOCATIONS"
      :key="loc"
      :class="[
        'py-2 rounded-lg text-sm font-medium border transition-colors',
        modelValue === loc
          ? 'bg-indigo-600 text-white border-indigo-600'
          : 'bg-base-100 text-base-content/80 border-gray-300 hover:border-indigo-400',
      ]"
      @click="emit('update:modelValue', loc)"
    >
      {{ loc }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { LOCATIONS, type Location } from '@/domain/Location'

defineProps<{ modelValue: Location | null }>()
const emit = defineEmits<{ 'update:modelValue': [v: Location] }>()
</script>
