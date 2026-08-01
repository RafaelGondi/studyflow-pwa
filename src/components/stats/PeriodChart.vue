<template>
  <section class="section-block">
    <AkSectionHeader :title="title" />

    <div v-if="hasData" class="period-chart">
      <Bar :data="chartData" :options="chartOptions" />
    </div>

    <div v-if="hasData" class="period-chart__summary">
      <span>Melhor {{ bucketNoun }}: <strong>{{ bestBucket?.label }}</strong></span>
      <span class="numeric">{{ formatDuration(bestBucket?.seconds ?? 0) }}</span>
    </div>

    <AkEmptyState
      v-else
      title="Sem estudo no período"
      description="Registre uma sessão para acompanhar sua evolução."
    />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import { AkEmptyState, AkSectionHeader } from '@rafael_dias/akoma'
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  Tooltip,
  type TooltipItem,
} from 'chart.js'
import { formatDuration } from '@/types'
import { chartTheme } from '@/utils/chartTheme'
import type { PeriodBucket, StudyPeriod } from '@/utils/studyProgress'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

const props = defineProps<{
  title: string
  period: StudyPeriod
  buckets: PeriodBucket[]
}>()

const hasData = computed(() => props.buckets.some(bucket => bucket.seconds > 0))
const bestBucket = computed(() =>
  props.buckets.reduce<PeriodBucket | null>(
    (best, bucket) => (!best || bucket.seconds > best.seconds ? bucket : best),
    null,
  ),
)

const bucketNoun = computed(() => {
  if (props.period === 'week') return 'dia'
  if (props.period === 'month') return 'semana'
  return 'mês'
})

const chartData = computed(() => ({
  labels: props.buckets.map(bucket => bucket.label),
  datasets: [{
    data: props.buckets.map(bucket => bucket.seconds / 3600),
    backgroundColor: props.buckets.map(bucket =>
      bucket.isCurrent ? 'rgba(76, 110, 245, 0.92)' : 'rgba(76, 110, 245, 0.58)',
    ),
    hoverBackgroundColor: 'rgba(76, 110, 245, 1)',
    borderRadius: 7,
    borderSkipped: false,
    maxBarThickness: 42,
  }],
}))

const chartOptions = computed(() => {
  const { text, grid } = chartTheme()
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        displayColors: false,
        callbacks: {
          label: (ctx: TooltipItem<'bar'>) =>
            ` ${formatDuration(Math.round((ctx.parsed.y ?? 0) * 3600))}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: text, font: { size: 10 } },
        border: { display: false },
      },
      y: {
        beginAtZero: true,
        grid: { color: grid },
        border: { display: false },
        ticks: {
          color: text,
          font: { size: 10 },
          maxTicksLimit: 5,
          callback: (value: number | string) => {
            const hours = Number(value)
            if (hours === 0) return '0'
            if (hours < 1) return `${Math.round(hours * 60)}m`
            return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`
          },
        },
      },
    },
  }
})
</script>

<style scoped>
.period-chart {
  height: 190px;
  min-height: 190px;
  padding-top: var(--space-2);
}

.period-chart__summary {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  padding-top: var(--space-2);
  font-size: 12px;
  color: var(--text-secondary);
}

.period-chart__summary strong {
  color: var(--text);
  font-weight: 650;
}
</style>
