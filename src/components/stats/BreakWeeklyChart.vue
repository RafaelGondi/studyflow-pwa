<template>
  <AkCard padding="md">
    <h3 class="section-title" style="margin-bottom: var(--space-4)">Pausas na semana</h3>

    <div v-if="hasData" style="max-height: 12rem">
      <Bar :data="chartData" :options="chartOptions" />
    </div>

    <AkEmptyState
      v-else
      title="Sem pausas"
      description="Nenhuma pausa registrada nos últimos 7 dias."
    />
  </AkCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import { AkCard, AkEmptyState } from '@rafael_dias/akoma'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, type TooltipItem,
} from 'chart.js'
import type { StudySession } from '@/types'
import { localDateStr, isBreakSession } from '@/types'
import { chartTheme, cssVar } from '@/utils/chartTheme'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const props = defineProps<{ sessions: StudySession[] }>()

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
  const labels: string[] = []
  const data: number[] = []

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key = localDateStr(d)
    labels.push(i === 0 ? 'Hoje' : dayNames[d.getDay()])
    const secs = breakSessions.value
      .filter(s => s.date === key)
      .reduce((acc, s) => acc + s.duration, 0)
    data.push(+(secs / 3600).toFixed(2))
  }

  const warning = cssVar('--warning')
  const warningSoft = cssVar('--warning-soft')

  return {
    labels,
    datasets: [{
      label: 'Pausa',
      data,
      backgroundColor: data.map((_, i) => i === 6 ? warning : warningSoft),
      borderRadius: 8,
      borderSkipped: false,
    }],
  }
})

const chartOptions = computed(() => {
  const { text: tickColor, grid: gridColor } = chartTheme()

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
