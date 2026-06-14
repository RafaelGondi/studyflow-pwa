<template>
  <div class="card p-4">
    <div v-if="points.length === 0" class="py-10 text-center text-faint text-sm">
      Sem atividade neste dia
    </div>
    <div v-else class="h-36">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Tooltip, Filler, type TooltipItem,
} from 'chart.js'
import type { StudySession } from '@/types'
import { useThemeStore } from '@/stores/theme'
import { getCumulativeChartPoints } from '@/utils/stats'
import { formatDuration } from '@/types'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

const props = defineProps<{ sessions: StudySession[] }>()
const theme = useThemeStore()

function cssVar(name: string, fallback: string) {
  if (typeof document === 'undefined') return fallback
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

const points = computed(() => getCumulativeChartPoints(props.sessions))

const chartData = computed(() => {
  const accent = cssVar('--accent', '#14b8a6')
  return {
    labels: points.value.map(p => p.label),
    datasets: [{
      data: points.value.map(p => p.value / 60),
      borderColor: accent,
      backgroundColor: theme.isDark ? 'rgba(45, 212, 191, 0.12)' : 'rgba(20, 184, 166, 0.12)',
      fill: true,
      stepped: true,
      pointRadius: 3,
      pointBackgroundColor: accent,
      tension: 0,
    }],
  }
})

const chartOptions = computed(() => {
  const tickColor = cssVar('--text-tertiary', '#a3a29c')
  const gridColor = theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(44,44,42,0.06)'
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'line'>) => ` ${formatDuration(Math.round((ctx.parsed.y ?? 0) * 60))}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: tickColor, font: { size: 10 }, maxTicksLimit: 6 },
        border: { display: false },
      },
      y: {
        grid: { color: gridColor },
        ticks: {
          color: tickColor,
          font: { size: 10 },
          callback: (v: number | string) => `${v}m`,
          maxTicksLimit: 4,
        },
        border: { display: false },
        beginAtZero: true,
      },
    },
  }
})
</script>
