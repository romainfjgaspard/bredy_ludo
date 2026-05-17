<template>
  <div>
    <component :is="chartComponent" :data="data" :options="defaultOptions" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Bar, Doughnut, Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, LineElement, PointElement, Tooltip, Legend)

const props = defineProps<{ type: 'bar' | 'doughnut' | 'line'; data: any }>()

const chartComponent = computed(() => ({ bar: Bar, doughnut: Doughnut, line: Line }[props.type]))

const defaultOptions = { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } } }
</script>
