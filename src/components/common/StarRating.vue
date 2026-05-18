<template>
  <div class="flex gap-1" :aria-label="`Note : ${modelValue ?? 0} sur 5`">
    <button
      v-for="star in 5"
      :key="star"
      type="button"
      :class="[
        'text-2xl transition-colors cursor-pointer',
        star <= (hovered || modelValue || 0) ? 'text-yellow-400' : 'text-base-content/30',
        !readonly ? 'hover:text-yellow-300' : '',
      ]"
      @mouseenter="!readonly && (hovered = star)"
      @mouseleave="hovered = 0"
      @click="emit('click', star)"
    >
      ★
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
defineProps<{
  modelValue: number | null
  readonly?: boolean
}>()
const emit = defineEmits<{
  'update:modelValue': [value: number | null]
  'click': [star: number]
}>()
const hovered = ref(0)
</script>
