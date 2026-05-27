<template>
  <div class="relative w-full overflow-hidden bg-base-200" :style="{ aspectRatio: '16/9' }">
    <!-- Placeholder coloré déterministe, visible pendant le chargement et en cas d'erreur -->
    <div
      class="absolute inset-0 flex flex-col items-center justify-center gap-2 select-none"
      :style="{ background: gradient }"
    >
      <span class="text-white/80 text-5xl font-black drop-shadow">{{ initial }}</span>
      <span class="text-white/50 text-xs font-medium tracking-widest uppercase">{{ shortName }}</span>
    </div>
    <!-- Image réelle : par-dessus le placeholder, affichée uniquement si chargée -->
    <img
      v-if="src"
      :src="src"
      :alt="alt"
      class="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
      :class="imageLoaded ? 'opacity-100' : 'opacity-0'"
      @load="imageLoaded = true"
      @error="imageLoaded = false; src = ''"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { imageUrl as buildImageUrl } from '@/utils/imageUrl'

const props = defineProps<{
  imageUrl?: string
  name: string
  alt?: string
}>()

const src = ref(buildImageUrl(props.imageUrl))
const imageLoaded = ref(false)

const initial = computed(() => props.name.trim().charAt(0).toUpperCase())
const shortName = computed(() => props.name.length > 18 ? props.name.slice(0, 18) + '…' : props.name)

/** Couleur déterministe basée sur le nom */
const gradient = computed(() => {
  let h = 0
  for (let i = 0; i < props.name.length; i++) h = (h * 31 + props.name.charCodeAt(i)) & 0xffff
  const hue = h % 360
  return `linear-gradient(135deg, hsl(${hue},55%,35%) 0%, hsl(${(hue + 40) % 360},60%,25%) 100%)`
})
</script>
