<template>
  <div class="relative flex flex-col items-center w-full select-none">
    <canvas
      ref="canvasEl"
      class="cursor-pointer"
      style="width: 100%; max-width: 400px; display: block;"
      @click="$emit('tapToSpin')"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import type { Game } from '@/domain/Game'

// ─── Palette inspirée des roues de référence ───────────────────────────────
const PALETTE = [
  '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71',
  '#3498db', '#9b59b6', '#1abc9c', '#e91e63',
  '#ff5722', '#8bc34a', '#0288d1', '#7b1fa2',
]

// ─── Dimensions canvas (logiques, CSS scale via max-width) ─────────────────
const W = 600          // logical canvas size
const CX = W / 2
const CY = W / 2
const R  = W * 0.44    // rayon de la roue (laisse de la place pour le pointeur)

// ─── Props / Emits ─────────────────────────────────────────────────────────
const props = defineProps<{
  candidates: Game[]
  spinTrigger: { index: number; id: number } | null
}>()

const emit = defineEmits<{
  spinComplete: [index: number]
  tapToSpin: []
}>()

// ─── État interne ──────────────────────────────────────────────────────────
const canvasEl = ref<HTMLCanvasElement | null>(null)
let currentRotation = 0   // radian cumulé (augmente indéfiniment)
let animFrameId: number | null = null
let highlightedIdx: number | null = null

const SPIN_DURATION = 4800   // ms

// ─── Dessin ────────────────────────────────────────────────────────────────
function drawWheel(rotation: number) {
  const canvas = canvasEl.value
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx) return

  ctx.clearRect(0, 0, W, W)

  const n = props.candidates.length

  /* ── Cas vide ── */
  if (n === 0) {
    ctx.beginPath()
    ctx.arc(CX, CY, R, 0, 2 * Math.PI)
    ctx.fillStyle = '#f3f4f6'
    ctx.fill()
    ctx.strokeStyle = '#d1d5db'
    ctx.lineWidth = 3
    ctx.stroke()
    ctx.fillStyle = '#9ca3af'
    ctx.font = 'bold 22px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Ajoutez des jeux', CX, CY - 14)
    ctx.font = '16px system-ui, sans-serif'
    ctx.fillText('← Choisissez un preset', CX, CY + 18)
    drawPointer(ctx)
    return
  }

  const segAngle = (2 * Math.PI) / n

  /* ── Ombre portée de la roue ── */
  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
  ctx.shadowBlur = 24
  ctx.shadowOffsetY = 6
  ctx.beginPath()
  ctx.arc(CX, CY, R, 0, 2 * Math.PI)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.restore()

  /* ── Segments ── */
  for (let i = 0; i < n; i++) {
    const startAngle = rotation + i * segAngle - Math.PI / 2
    const endAngle   = rotation + (i + 1) * segAngle - Math.PI / 2
    const midAngle   = rotation + (i + 0.5) * segAngle - Math.PI / 2

    const isWinner = i === highlightedIdx
    const color = PALETTE[i % PALETTE.length]

    // Segment
    ctx.beginPath()
    ctx.moveTo(CX, CY)
    ctx.arc(CX, CY, isWinner ? R + 6 : R, startAngle, endAngle)
    ctx.closePath()
    ctx.fillStyle = isWinner ? lighten(color, 15) : color
    ctx.fill()
    if (isWinner) {
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 4
      ctx.stroke()
    }

    // Séparateurs
    ctx.beginPath()
    ctx.moveTo(CX, CY)
    ctx.lineTo(CX + R * Math.cos(startAngle), CY + R * Math.sin(startAngle))
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'
    ctx.lineWidth = 1.5
    ctx.stroke()

    /* ── Texte radial ── */
    const label = props.candidates[i].nom
    const arcWidth = segAngle * R * 0.6   // largeur arc à 60% du rayon
    const maxChars = Math.max(4, Math.floor(arcWidth / 9))
    const truncated = label.length > maxChars + 2
      ? label.substring(0, maxChars) + '…'
      : label

    const fontSize = Math.max(9, Math.min(17, arcWidth * 0.36))
    ctx.save()
    ctx.translate(CX, CY)
    ctx.rotate(midAngle)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#ffffff'
    ctx.font = `bold ${fontSize}px system-ui, sans-serif`
    ctx.shadowColor = 'rgba(0,0,0,0.45)'
    ctx.shadowBlur = 4
    ctx.fillText(truncated, R * 0.62, 0)
    ctx.restore()
  }

  /* ── Anneau extérieur ── */
  ctx.beginPath()
  ctx.arc(CX, CY, R, 0, 2 * Math.PI)
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 5
  ctx.stroke()

  /* ── Hub central ── */
  const hub = W * 0.055
  ctx.beginPath()
  ctx.arc(CX, CY, hub, 0, 2 * Math.PI)
  ctx.fillStyle = '#1e293b'
  ctx.fill()
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 3
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(CX, CY, hub * 0.35, 0, 2 * Math.PI)
  ctx.fillStyle = '#ffffff'
  ctx.fill()

  /* ── Pointeur (fixe, par-dessus) ── */
  drawPointer(ctx)
}

function drawPointer(ctx: CanvasRenderingContext2D) {
  const tipY    = CY - R + 8    // légèrement dans la roue
  const baseY   = 0             // sommet du canvas
  const halfW   = R * 0.075

  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.35)'
  ctx.shadowBlur  = 6
  ctx.shadowOffsetY = 2

  ctx.beginPath()
  ctx.moveTo(CX - halfW, baseY)
  ctx.lineTo(CX + halfW, baseY)
  ctx.lineTo(CX, tipY)
  ctx.closePath()
  ctx.fillStyle = '#1e293b'
  ctx.fill()
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.restore()
}

// ─── Helper : éclaircit une couleur hex d'un pourcentage ───────────────────
function lighten(hex: string, pct: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const l = (v: number) => Math.min(255, Math.round(v + (255 - v) * (pct / 100)))
  return `rgb(${l(r)},${l(g)},${l(b)})`
}

// ─── Easing ────────────────────────────────────────────────────────────────
function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 4)   // quartic ease-out
}

// ─── Animation ─────────────────────────────────────────────────────────────
function startSpin(winnerIdx: number) {
  if (animFrameId !== null) {
    cancelAnimationFrame(animFrameId)
    animFrameId = null
  }
  highlightedIdx = null

  const n = props.candidates.length
  if (n === 0) return

  const segAngle = (2 * Math.PI) / n

  /*
   * On veut que le milieu du segment gagnant arrive sous le pointeur (top = -π/2).
   * Après rotation totale R :
   *   angle_milieu_gagnant_canvas = R + (w + 0.5) * segAngle - π/2
   * On veut que ce soit ≡ -π/2 (mod 2π), donc :
   *   R ≡ -(w + 0.5) * segAngle (mod 2π)
   */
  const winnerMid  = (winnerIdx + 0.5) * segAngle
  const normalizedTarget = (((-winnerMid) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
  const currentNorm      = ((currentRotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)

  let forward = normalizedTarget - currentNorm
  if (forward < 0.05) forward += 2 * Math.PI   // toujours avancer

  const totalSpin = 2 * Math.PI * 7 + forward   // 7 tours complets + alignement
  const startRot  = currentRotation
  const startTime = performance.now()

  function animate(now: number) {
    const t      = Math.min((now - startTime) / SPIN_DURATION, 1)
    const eased  = easeOut(t)
    currentRotation = startRot + totalSpin * eased
    drawWheel(currentRotation)

    if (t < 1) {
      animFrameId = requestAnimationFrame(animate)
    } else {
      currentRotation = startRot + totalSpin
      animFrameId = null
      highlightedIdx = winnerIdx
      drawWheel(currentRotation)
      emit('spinComplete', winnerIdx)
    }
  }

  animFrameId = requestAnimationFrame(animate)
}

// ─── Lifecycle ─────────────────────────────────────────────────────────────
onMounted(() => {
  const canvas = canvasEl.value!
  canvas.width  = W
  canvas.height = W
  drawWheel(0)
})

onBeforeUnmount(() => {
  if (animFrameId !== null) cancelAnimationFrame(animFrameId)
})

watch(() => props.candidates, () => {
  highlightedIdx = null
  if (animFrameId === null) drawWheel(currentRotation)
}, { deep: true })

watch(() => props.spinTrigger, (trigger) => {
  if (trigger !== null) startSpin(trigger.index)
})
</script>

