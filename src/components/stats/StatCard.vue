<template>
  <div class="bg-white rounded-xl shadow p-3">
    <div class="flex items-center justify-between mb-2">
      <p class="font-semibold text-sm">{{ label }}</p>
      <span :class="['text-2xl font-bold', colorClass]">{{ value }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ label: string; value: number | string; color?: string }>()

const colorClass = computed(() => {
  const map: Record<string, string> = { indigo: 'text-indigo-600', green: 'text-green-600', amber: 'text-amber-600', red: 'text-red-600' }
  return map[props.color ?? 'indigo'] ?? 'text-indigo-600'
})
</script>
