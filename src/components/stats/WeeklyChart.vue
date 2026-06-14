<template>
  <div class="card p-4">
    <h3 class="text-xs font-bold text-muted uppercase tracking-wider mb-4">Esta semana</h3>

    <div v-if="hasData" class="max-h-56">
      <Bar :data="chartData" :options="chartOptions" />
    </div>

    <div v-else class="py-8 text-center text-faint text-sm">
      Nenhuma sessão nesta semana
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
import { localDateStr, isStudySession } from '@/types'
import { useThemeStore } from '@/stores/theme'
import { useSubjectsStore } from '@/stores/subjects'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const theme = useThemeStore()
const subjectsStore = useSubjectsStore()

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

const studySessions = computed(() => props.sessions.filter(isStudySession))
const hasData = computed(() => studySessions.value.length > 0)

const chartData = computed(() => {
  const today = new Date()
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const dayKeys: string[] = []
  const labels: string[] = []

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    dayKeys.push(localDateStr(d))
    labels.push(i === 0 ? 'Hoje' : dayNames[d.getDay()])
  }

  const byDaySubject = new Map<string, Map<string, number>>()
  for (const key of dayKeys) byDaySubject.set(key, new Map())

  for (const s of studySessions.value) {
    const day = byDaySubject.get(s.date)
    if (!day || !s.subjectId) continue
    day.set(s.subjectId, (day.get(s.subjectId) ?? 0) + s.duration)
  }

  const subjectTotals = new Map<string, number>()
  for (const s of studySessions.value) {
    if (!s.subjectId) continue
    subjectTotals.set(s.subjectId, (subjectTotals.get(s.subjectId) ?? 0) + s.duration)
  }

  const sortedSubjects = [...subjectTotals.entries()].sort((a, b) => a[1] - b[1])

  const datasets = sortedSubjects.map(([subjectId], idx, arr) => {
    const subj = subjectsStore.getSubject(subjectId)
    const isTop = idx === arr.length - 1
    return {
      label: subj?.name ?? 'Desconhecida',
      data: dayKeys.map(key => {
        const secs = byDaySubject.get(key)?.get(subjectId) ?? 0
        return +(secs / 3600).toFixed(2)
      }),
      backgroundColor: subj?.color ?? '#8b5cf6',
      borderRadius: isTop ? { topLeft: 8, topRight: 8, bottomLeft: 0, bottomRight: 0 } : 0,
      borderSkipped: false,
      stack: 'study',
    }
  })

  return { labels, datasets }
})

const chartOptions = computed(() => {
  const tickColor = cssVar('--text-tertiary', '#a3a29c')
  const gridColor = theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(44,44,42,0.06)'

  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: {
        display: chartData.value.datasets.length > 0,
        position: 'bottom' as const,
        labels: {
          color: tickColor,
          boxWidth: 8,
          boxHeight: 8,
          padding: 14,
          font: { size: 11 },
          usePointStyle: true,
          pointStyle: 'circle' as const,
        },
      },
      tooltip: {
        filter: (item: TooltipItem<'bar'>) => (item.parsed.y ?? 0) > 0,
        callbacks: {
          label: (ctx: TooltipItem<'bar'>) => {
            const v = ctx.parsed.y ?? 0
            return ` ${ctx.dataset.label}: ${formatHours(v)}`
          },
          footer: (items: TooltipItem<'bar'>[]) => {
            const total = items.reduce((sum, i) => sum + (i.parsed.y ?? 0), 0)
            return total > 0 ? `Total: ${formatHours(total)}` : ''
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { color: tickColor, font: { size: 11 } },
        border: { display: false },
      },
      y: {
        stacked: true,
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
