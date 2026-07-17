<template>
  <AkCard padding="md" class="stack">
    <h3 class="section-title">Por matéria</h3>

    <AkEmptyState
      v-if="subjectItems.length === 0"
      title="Sem dados"
      description="Nenhum registro de estudo neste período."
    />

    <div v-else class="stack">
      <div class="flex-row" style="gap: var(--space-6); flex-wrap: wrap; justify-content: center">
        <div style="position: relative; width: 160px; height: 160px; flex-shrink: 0">
          <Doughnut :data="chartData" :options="chartOptions" />
          <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none">
            <span class="text-lg font-bold text-primary numeric">{{ formatDuration(total) }}</span>
            <span class="text-xs text-muted">total</span>
          </div>
        </div>

        <div class="flex-1 min-w-0" style="min-width: 180px">
          <div class="chip-group" style="margin-bottom: var(--space-3)">
            <AkChip
              v-for="t in tabs"
              :key="t.key"
              :active="activeTab === t.key"
              @click="activeTab = t.key"
            >
              {{ t.label }}
            </AkChip>
          </div>

          <div v-if="activeTab === 'subjects'" class="stack-xs">
            <div v-for="item in subjectItems" :key="item.id" class="flex-row" style="gap: var(--space-2)">
              <div class="status-dot" :style="{ background: item.color }" />
              <span class="text-sm text-secondary flex-1 truncate">{{ item.name }}</span>
              <span class="text-sm font-semibold text-primary numeric">{{ formatDuration(item.seconds) }}</span>
              <span class="text-xs text-muted numeric" style="width: 2rem; text-align: right">{{ item.pct }}%</span>
            </div>
          </div>

          <div v-else class="stack-xs">
            <div v-for="item in categoryItems" :key="item.id" class="flex-row" style="gap: var(--space-2)">
              <div class="status-dot" :style="{ background: item.color }" />
              <span class="text-sm text-secondary flex-1 truncate">{{ item.name }}</span>
              <span class="text-sm font-semibold text-primary numeric">{{ formatDuration(item.seconds) }}</span>
              <span class="text-xs text-muted numeric" style="width: 2rem; text-align: right">{{ item.pct }}%</span>
            </div>
          </div>
        </div>
      </div>

      <div class="flex-row" style="gap: var(--space-4); padding-top: var(--space-2); border-top: 1px solid var(--border)">
        <div class="flex-row" style="gap: var(--space-2)">
          <div style="width: 20px; height: 8px; border-radius: var(--radius-full); border: 2px solid var(--border)" />
          <span class="text-xs text-muted">anel externo = matérias</span>
        </div>
        <div class="flex-row" style="gap: var(--space-2)">
          <div style="width: 12px; height: 8px; border-radius: var(--radius-full); border: 2px solid var(--border)" />
          <span class="text-xs text-muted">anel interno = categorias</span>
        </div>
      </div>
    </div>
  </AkCard>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { AkCard, AkChip, AkEmptyState } from '@rafael_dias/akoma'
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js'
import type { StudySession } from '@/types'
import { useSubjectsStore } from '@/stores/subjects'
import { formatDuration, isStudySession } from '@/types'
import { chartTheme } from '@/utils/chartTheme'

ChartJS.register(ArcElement, Tooltip)

const props = defineProps<{ sessions: StudySession[] }>()
const subjectsStore = useSubjectsStore()

const studySessions = computed(() => props.sessions.filter(isStudySession))

const activeTab = ref<'subjects' | 'categories'>('subjects')
const tabs = [
  { key: 'subjects'   as const, label: 'Matérias' },
  { key: 'categories' as const, label: 'Categorias' },
]

const secondsBySubject = computed(() => {
  const map = new Map<string, number>()
  for (const s of studySessions.value) {
    if (!s.subjectId) continue
    map.set(s.subjectId, (map.get(s.subjectId) ?? 0) + s.duration)
  }
  return map
})

const secondsByCategory = computed(() => {
  const map = new Map<string | null, number>()
  for (const [subjectId, secs] of secondsBySubject.value) {
    const catId = subjectsStore.getSubject(subjectId)?.categoryId ?? null
    map.set(catId, (map.get(catId) ?? 0) + secs)
  }
  return map
})

const total = computed(() => {
  let t = 0
  secondsBySubject.value.forEach(v => (t += v))
  return t
})

const categoryItems = computed(() => {
  const t = total.value || 1
  return [...secondsByCategory.value.entries()]
    .map(([catId, seconds]) => {
      const cat = catId ? subjectsStore.getCategory(catId) : null
      return {
        id: catId ?? '__none__',
        name: cat?.name ?? 'Sem categoria',
        color: cat?.color ?? 'var(--text-tertiary)',
        seconds,
        pct: Math.round((seconds / t) * 100),
      }
    })
    .sort((a, b) => b.seconds - a.seconds)
})

const subjectItems = computed(() => {
  const t = total.value || 1
  const rows = [...secondsBySubject.value.entries()].map(([subjectId, seconds]) => {
    const subj = subjectsStore.getSubject(subjectId)
    const catId = subj?.categoryId ?? null
    return {
      id: subjectId,
      name: subj?.name ?? 'Desconhecida',
      color: subj?.color ?? 'var(--accent)',
      catId,
      seconds,
      pct: Math.round((seconds / t) * 100),
    }
  })
  const catOrder = new Map(categoryItems.value.map((c, i) => [c.id, i]))
  rows.sort((a, b) => {
    const oa = catOrder.get(a.catId ?? '__none__') ?? 99
    const ob = catOrder.get(b.catId ?? '__none__') ?? 99
    if (oa !== ob) return oa - ob
    return b.seconds - a.seconds
  })
  return rows
})

const chartData = computed(() => {
  const border = chartTheme().bg
  return {
    labels: subjectItems.value.map(i => i.name),
    datasets: [
      {
        data: subjectItems.value.map(i => i.seconds),
        backgroundColor: subjectItems.value.map(i => i.color),
        borderWidth: 2,
        borderColor: border,
        hoverBorderColor: border,
      },
      {
        data: categoryItems.value.map(i => i.seconds),
        backgroundColor: categoryItems.value.map(i => i.color),
        borderWidth: 2,
        borderColor: border,
        hoverBorderColor: border,
      },
    ],
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '52%',
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: { dataset: { data: number[] }; dataIndex: number; parsed: number }) => {
          const label = ctx.dataset.data === chartData.value.datasets[1].data
            ? categoryItems.value[ctx.dataIndex]?.name
            : subjectItems.value[ctx.dataIndex]?.name
          return ` ${label}: ${formatDuration(ctx.parsed)}`
        },
      },
    },
  },
}))
</script>
