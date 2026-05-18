<template>
  <div class="relative">
    <input
      :value="modelValue"
      type="search"
      placeholder="Rechercher un jeu…"
      class="w-full pl-10 pr-10 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
      @input="onInput"
    />
    <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
    </svg>
    <button
      v-if="modelValue"
      class="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content/60"
      @click="emit('update:modelValue', '')"
      aria-label="Effacer la recherche"
    >×</button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [v: string] }>()

let timer: ReturnType<typeof setTimeout>
function onInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  clearTimeout(timer)
  timer = setTimeout(() => emit('update:modelValue', val), 300)
}
</script>
