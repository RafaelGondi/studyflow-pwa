<template>
  <AkCard padding="md">
    <AkEmptyState
      v-if="points.length === 0"
      title="Sem atividade"
      description="Nenhuma atividade neste dia."
    />
    <div v-else class="chart-wrap">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </AkCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Tooltip, Filler, type TooltipItem,
} from 'chart.js'
import { AkCard, AkEmptyState } from '@rafael_dias/akoma'
import type { StudySession } from '@/types'
import { getCumulativeChartPoints } from '@/utils/stats'
import { formatDuration } from '@/types'
import { chartTheme } from '@/utils/chartTheme'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

const props = defineProps<{ sessions: StudySession[] }>()

const points = computed(() => getCumulativeChartPoints(props.sessions))

const chartData = computed(() => {
  const theme = chartTheme()
  return {
    labels: points.value.map(p => p.label),
    datasets: [{
      data: points.value.map(p => p.value / 60),
      borderColor: theme.accent,
      backgroundColor: theme.accentSoft,
      fill: true,
      stepped: true,
      pointRadius: 3,
      pointBackgroundColor: theme.accent,
      tension: 0,
    }],
  }
})

const chartOptions = computed(() => {
  const theme = chartTheme()
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
        ticks: { color: theme.text, font: { size: 10, family: 'DM Sans' }, maxTicksLimit: 6 },
        border: { display: false },
      },
      y: {
        grid: { color: theme.grid },
        ticks: {
          color: theme.text,
          font: { size: 10, family: 'DM Sans' },
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

<style scoped>
.chart-wrap {
  height: 144px;
}
</style>
