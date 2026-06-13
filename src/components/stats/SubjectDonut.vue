<template>
  <div class="card p-4 space-y-4">
    <h3 class="text-xs font-bold text-muted uppercase tracking-wider">Por matéria</h3>

    <div v-if="subjectItems.length === 0" class="py-8 text-center text-faint text-sm">
      Nenhum dado disponível
    </div>

    <div v-else>
      <!-- Double donut -->
      <div class="flex flex-col sm:flex-row items-center gap-6">
        <div class="relative flex-shrink-0" style="width:160px;height:160px">
          <Doughnut :data="chartData" :options="chartOptions" />
          <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span class="text-lg font-bold text-primary leading-tight">{{ formatDuration(total) }}</span>
            <span class="text-[10px] text-muted">total</span>
          </div>
        </div>

        <!-- List with tab toggle -->
        <div class="flex-1 w-full min-w-0">
          <!-- Tabs -->
          <div class="seg-control mb-3">
            <button
              v-for="t in tabs"
              :key="t.key"
              @click="activeTab = t.key"
              class="seg-tab"
              :class="activeTab === t.key ? 'seg-tab-active' : ''"
            >
              {{ t.label }}
            </button>
          </div>

          <!-- Matérias list -->
          <div v-if="activeTab === 'subjects'" class="space-y-2">
            <div v-for="item in subjectItems" :key="item.id" class="flex items-center gap-2.5">
              <div class="w-2 h-2 rounded-full flex-shrink-0" :style="{ background: item.color }" />
              <span class="text-sm text-secondary flex-1 truncate">{{ item.name }}</span>
              <span class="text-sm font-semibold text-primary tabular-nums">{{ formatDuration(item.seconds) }}</span>
              <span class="text-xs text-muted w-8 text-right tabular-nums">{{ item.pct }}%</span>
            </div>
          </div>

          <!-- Categorias list -->
          <div v-else class="space-y-2">
            <div v-for="item in categoryItems" :key="item.id" class="flex items-center gap-2.5">
              <div class="w-2 h-2 rounded-full flex-shrink-0" :style="{ background: item.color }" />
              <span class="text-sm text-secondary flex-1 truncate">{{ item.name }}</span>
              <span class="text-sm font-semibold text-primary tabular-nums">{{ formatDuration(item.seconds) }}</span>
              <span class="text-xs text-muted w-8 text-right tabular-nums">{{ item.pct }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Legenda dos anéis -->
      <div class="flex items-center gap-4 pt-1 border-t border-app-border">
        <div class="flex items-center gap-1.5">
          <div class="w-5 h-2 rounded-full btn-icon border-2 border-muted/30" />
          <span class="text-[10px] text-muted">anel externo = matérias</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-2 rounded-full btn-icon border-2 border-muted/30" />
          <span class="text-[10px] text-muted">anel interno = categorias</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js'
import type { StudySession } from '@/types'
import { useSubjectsStore } from '@/stores/subjects'
import { formatDuration } from '@/types'
import { useThemeStore } from '@/stores/theme'

ChartJS.register(ArcElement, Tooltip)

const props = defineProps<{ sessions: StudySession[] }>()
const subjectsStore = useSubjectsStore()
const theme = useThemeStore()

const activeTab = ref<'subjects' | 'categories'>('subjects')
const tabs = [
  { key: 'subjects'   as const, label: 'Matérias' },
  { key: 'categories' as const, label: 'Categorias' },
]

// ── Aggregation ────────────────────────────────────────────────────────────

/** Seconds per subject */
const secondsBySubject = computed(() => {
  const map = new Map<string, number>()
  for (const s of props.sessions) {
    map.set(s.subjectId, (map.get(s.subjectId) ?? 0) + s.duration)
  }
  return map
})

/** Seconds per category (null = sem categoria) */
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

// ── Category items (sorted desc) ──────────────────────────────────────────

const categoryItems = computed(() => {
  const t = total.value || 1
  return [...secondsByCategory.value.entries()]
    .map(([catId, seconds]) => {
      const cat = catId ? subjectsStore.getCategory(catId) : null
      return {
        id: catId ?? '__none__',
        name: cat?.name ?? 'Sem categoria',
        color: cat?.color ?? '#64748b',
        seconds,
        pct: Math.round((seconds / t) * 100),
      }
    })
    .sort((a, b) => b.seconds - a.seconds)
})

// ── Subject items — grouped by category order ─────────────────────────────
// Subjects are sorted so that subjects of the same category appear together,
// matching the order of the inner (category) ring.

const subjectItems = computed(() => {
  const t = total.value || 1
  // Build subject rows
  const rows = [...secondsBySubject.value.entries()].map(([subjectId, seconds]) => {
    const subj = subjectsStore.getSubject(subjectId)
    const catId = subj?.categoryId ?? null
    return {
      id: subjectId,
      name: subj?.name ?? 'Desconhecida',
      color: subj?.color ?? '#8b5cf6',
      catId,
      seconds,
      pct: Math.round((seconds / t) * 100),
    }
  })
  // Sort: first by category order (matching categoryItems), then by seconds desc within category
  const catOrder = new Map(categoryItems.value.map((c, i) => [c.id, i]))
  rows.sort((a, b) => {
    const oa = catOrder.get(a.catId ?? '__none__') ?? 99
    const ob = catOrder.get(b.catId ?? '__none__') ?? 99
    if (oa !== ob) return oa - ob
    return b.seconds - a.seconds
  })
  return rows
})

// ── Chart data ────────────────────────────────────────────────────────────
// datasets[0] = outer ring (subjects)
// datasets[1] = inner ring (categories)

const chartData = computed(() => {
  const border = theme.isDark
    ? getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#1a1917'
    : getComputedStyle(document.documentElement).getPropertyValue('--bg-elevated').trim() || '#ffffff'
  return {
    labels: subjectItems.value.map(i => i.name),
    datasets: [
      // Outer: subjects
      {
        data: subjectItems.value.map(i => i.seconds),
        backgroundColor: subjectItems.value.map(i => i.color),
        borderWidth: 2,
        borderColor: border,
        hoverBorderColor: border,
      },
      // Inner: categories (same order as categoryItems)
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
        label: (ctx: any) => {
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
