<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      @click.self="emit('update:modelValue', false)"
    >
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col" role="dialog" :aria-label="title">
        <div class="flex items-center justify-between p-4 border-b">
          <h2 class="font-semibold text-lg">{{ title }}</h2>
          <button class="text-gray-400 hover:text-gray-600 text-2xl leading-none" @click="emit('update:modelValue', false)" aria-label="Fermer">×</button>
        </div>
        <div class="overflow-y-auto p-4">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{ modelValue: boolean; title: string }>()
const emit = defineEmits<{ 'update:modelValue': [v: boolean] }>()
</script>
