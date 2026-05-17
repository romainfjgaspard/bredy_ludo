<template>
  <Teleport to="body">
    <Transition name="toast">
      <div
        v-if="visible"
        :class="[
          'fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-white text-sm shadow-lg',
          type === 'error' ? 'bg-red-500' : 'bg-green-600',
        ]"
        role="status"
      >
        {{ message }}
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{ message: string; type?: 'success' | 'error'; duration?: number }>()
const visible = ref(false)

watch(() => props.message, (msg) => {
  if (!msg) return
  visible.value = true
  setTimeout(() => { visible.value = false }, props.duration ?? 3000)
})
</script>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: opacity 0.3s, transform 0.3s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(8px); }
</style>
