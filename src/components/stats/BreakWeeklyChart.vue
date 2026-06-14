<template>
  <div class="card p-4">
    <h3 class="text-xs font-bold text-muted uppercase tracking-wider mb-4">Pausas na semana</h3>

    <div v-if="hasData" class="max-h-48">
      <Bar :data="chartData" :options="chartOptions" />
    </div>

    <div v-else class="py-8 text-center text-faint text-sm">
      Nenhuma pausa nesta semana
    </div>
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
import { localDateStr, isBreakSession } from '@/types'
import { useThemeStore } from '@/stores/theme'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const theme = useThemeStore()

const props = defineProps<{ sessions: StudySession[] }>()

function cssVar(name: string, fallback: string) {
  if (typeof document === 'undefined') return fallback
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

function formatHours(hours: number) {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

const breakSessions = computed(() => props.sessions.filter(isBreakSession))
const hasData = computed(() => breakSessions.value.length > 0)

const chartData = computed(() => {
  const today = new Date()
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const dayKeys: string[] = []
  const labels: string[] = []
  const data: number[] = []

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key = localDateStr(d)
    dayKeys.push(key)
    labels.push(i === 0 ? 'Hoje' : dayNames[d.getDay()])
    const secs = breakSessions.value
      .filter(s => s.date === key)
      .reduce((acc, s) => acc + s.duration, 0)
    data.push(+(secs / 3600).toFixed(2))
  }

  const accent = cssVar('--cat-3', '#f59e0b')
  const accentSoft = theme.isDark ? 'rgba(245, 158, 11, 0.35)' : 'rgba(245, 158, 11, 0.45)'

  return {
    labels,
    datasets: [{
      label: 'Pausa',
      data,
      backgroundColor: data.map((_, i) => i === 6 ? accent : accentSoft),
      borderRadius: 8,
      borderSkipped: false,
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
        filter: (item: TooltipItem<'bar'>) => (item.parsed.y ?? 0) > 0,
        callbacks: {
          label: (ctx: TooltipItem<'bar'>) => ` ${formatHours(ctx.parsed.y ?? 0)}`,
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
