<template>
  <div class="flex gap-1" :aria-label="`Note : ${modelValue ?? 0} sur 5`">
    <button
      v-for="star in 5"
      :key="star"
      type="button"
      :disabled="readonly"
      :class="[
        'text-2xl transition-colors',
        star <= (modelValue ?? 0) ? 'text-yellow-400' : 'text-gray-300',
        !readonly ? 'hover:text-yellow-300 cursor-pointer' : 'cursor-default',
      ]"
      @click="!readonly && emit('update:modelValue', star === modelValue ? null : star)"
    >
      ★
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: number | null
  readonly?: boolean
}>()
const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()
</script>
