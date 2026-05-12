<template>
  <div class="bg-app-card border border-app-border rounded-sm p-4">
    <h3 class="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Por matéria</h3>
    <div v-if="items.length === 0" class="py-8 text-center text-faint text-sm">
      Nenhum dado disponível
    </div>
    <div v-else class="flex flex-col sm:flex-row items-center gap-6">
      <div class="relative w-40 h-40 flex-shrink-0">
        <Doughnut :data="chartData" :options="chartOptions" />
        <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span class="text-xl font-bold text-primary">{{ formatDuration(total) }}</span>
          <span class="text-xs text-muted">total</span>
        </div>
      </div>
      <div class="flex-1 w-full space-y-2">
        <div v-for="item in items" :key="item.id" class="flex items-center gap-3">
          <div class="w-2.5 h-2.5 rounded-full flex-shrink-0" :style="{ background: item.color }" />
          <span class="text-sm text-secondary flex-1 truncate">{{ item.name }}</span>
          <span class="text-sm font-semibold text-primary">{{ formatDuration(item.seconds) }}</span>
          <span class="text-xs text-muted w-8 text-right">{{ item.pct }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import type { StudySession } from '@/types'
import { useSubjectsStore } from '@/stores/subjects'
import { formatDuration } from '@/types'
import { useThemeStore } from '@/stores/theme'

const theme = useThemeStore()

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps<{ sessions: StudySession[] }>()
const subjectsStore = useSubjectsStore()

const items = computed(() => {
  const map = new Map<string, number>()
  for (const s of props.sessions) {
    map.set(s.subjectId, (map.get(s.subjectId) ?? 0) + s.duration)
  }
  const total = [...map.values()].reduce((a, b) => a + b, 0) || 1
  return [...map.entries()]
    .map(([id, seconds]) => {
      const s = subjectsStore.getSubject(id)
      return { id, name: s?.name ?? 'Desconhecida', color: s?.color ?? '#8b5cf6', seconds, pct: Math.round(seconds / total * 100) }
    })
    .sort((a, b) => b.seconds - a.seconds)
})

const total = computed(() => items.value.reduce((a, b) => a + b.seconds, 0))

const chartData = computed(() => {
  const border = theme.isDark ? '#16161a' : '#ffffff'
  return {
    labels: items.value.map(i => i.name),
    datasets: [{
      data: items.value.map(i => i.seconds),
      backgroundColor: items.value.map(i => i.color),
      borderWidth: 3,
      borderColor: border,
      hoverBorderColor: border,
    }],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '72%',
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: { label: string; parsed: number }) => {
          return ` ${ctx.label}: ${formatDuration(ctx.parsed)}`
        },
      },
    },
  },
}
</script>
