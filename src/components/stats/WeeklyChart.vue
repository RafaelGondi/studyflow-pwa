<template>
  <div class="card p-4">
    <h3 class="text-xs font-bold text-muted uppercase tracking-wider mb-4">Esta semana</h3>
    <Bar :data="chartData" :options="chartOptions" class="max-h-48" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, type TooltipItem,
} from 'chart.js'
import type { StudySession } from '@/types'
import { localDateStr } from '@/types'
import { useThemeStore } from '@/stores/theme'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const theme = useThemeStore()

const props = defineProps<{ sessions: StudySession[] }>()

const chartData = computed(() => {
  const days: Record<string, number> = {}
  const today = new Date()
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    days[localDateStr(d)] = 0
  }

  for (const s of props.sessions) {
    if (days[s.date] !== undefined) days[s.date] += s.duration
  }

  const labels = Object.keys(days).map(d => {
    const date = new Date(d + 'T12:00:00')
    return dayNames[date.getDay()]
  })
  const data = Object.values(days).map(s => +(s / 3600).toFixed(2))

  return {
    labels,
    datasets: [{
      data,
      backgroundColor: data.map((_, i) => i === 6 ? 'var(--accent-color)' : 'color-mix(in oklch, var(--accent-color) 30%, transparent)'),
      borderRadius: 8,
      borderSkipped: false,
    }],
  }
})

const chartOptions = computed(() => {
  const tickColor = getComputedStyle(document.documentElement).getPropertyValue('--text-tertiary').trim() || '#a3a29c'
  const gridColor = theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(44,44,42,0.06)'
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'bar'>) => {
            const v = ctx.parsed.y ?? 0
            const h = Math.floor(v)
            const m = Math.round((v - h) * 60)
            return h > 0 ? `${h}h ${m}m` : `${m}m`
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: tickColor, font: { size: 11 } },
        border: { display: false },
      },
      y: {
        grid: { color: gridColor },
        ticks: {
          color: tickColor,
          font: { size: 10 },
          callback: (v: number | string) => {
            const n = Number(v)
            if (n === 0) return '0'
            if (n < 1) return `${Math.round(n * 60)}m`
            return `${n}h`
          },
          maxTicksLimit: 5,
        },
        border: { display: false },
        beginAtZero: true,
      },
    },
  }
})
</script>
