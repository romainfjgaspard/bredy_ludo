<template>
  <div class="w-full max-w-xs mx-auto aspect-square relative">
    <svg viewBox="0 0 200 200" class="w-full h-full" aria-label="Roue de décision">
      <g v-if="candidates.length > 0">
        <path
          v-for="(seg, i) in segments"
          :key="i"
          :d="seg.path"
          :fill="seg.color"
          stroke="white"
          stroke-width="1"
        />
        <text
          v-for="(seg, i) in segments"
          :key="'t' + i"
          :transform="`rotate(${seg.labelAngle}, 100, 100) translate(100, 100)`"
          text-anchor="middle"
          font-size="6"
          fill="white"
          dominant-baseline="middle"
          :x="seg.labelX - 100"
          :y="seg.labelY - 100"
        >
          {{ seg.label }}
        </text>
      </g>
      <circle v-else cx="100" cy="100" r="90" fill="#e5e7eb" />
      <!-- Needle -->
      <polygon points="100,10 95,30 105,30" fill="#1e293b" />
      <!-- Center -->
      <circle cx="100" cy="100" r="8" fill="white" stroke="#6366f1" stroke-width="2" />
    </svg>

    <!-- Spinning overlay -->
    <div
      v-if="isSpinning"
      class="absolute inset-0 flex items-center justify-center"
    >
      <div class="animate-spin rounded-full h-16 w-16 border-4 border-indigo-500 border-t-transparent"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Game } from '@/domain/Game'

const COLORS = ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ef4444','#14b8a6']

const props = defineProps<{
  candidates: Game[]
  isSpinning: boolean
  result: Game | null
}>()

const segments = computed(() => {
  const n = props.candidates.length
  if (n === 0) return []
  const angle = 360 / n
  return props.candidates.map((game, i) => {
    const startRad = ((i * angle - 90) * Math.PI) / 180
    const endRad = (((i + 1) * angle - 90) * Math.PI) / 180
    const x1 = 100 + 90 * Math.cos(startRad)
    const y1 = 100 + 90 * Math.sin(startRad)
    const x2 = 100 + 90 * Math.cos(endRad)
    const y2 = 100 + 90 * Math.sin(endRad)
    const midRad = ((i + 0.5) * angle - 90) * Math.PI / 180
    const labelR = 60
    const labelX = 100 + labelR * Math.cos(midRad)
    const labelY = 100 + labelR * Math.sin(midRad)
    return {
      path: `M100,100 L${x1},${y1} A90,90 0 0,1 ${x2},${y2} Z`,
      color: COLORS[i % COLORS.length],
      label: game.nom.length > 12 ? game.nom.substring(0, 10) + '…' : game.nom,
      labelAngle: (i + 0.5) * angle,
      labelX,
      labelY,
    }
  })
})
</script>
