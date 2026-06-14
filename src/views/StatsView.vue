<template>
  <div class="min-h-screen flex flex-col akoma-page">
    <header class="mb-5 reveal">
      <span class="page-label">Progresso</span>
      <h1 class="page-title">Estatísticas</h1>
      <p class="text-sm text-muted mt-2">Estudo e pausas no período</p>
    </header>

    <div class="pb-4 reveal reveal-d1">
      <div class="flex card p-1 gap-1">
        <button
          v-for="p in periods"
          :key="p.value"
          @click="period = p.value"
          class="flex-1 py-2 rounded-akoma text-sm font-semibold transition-all duration-200 tap-scale"
          :class="period === p.value ? 'bg-accent text-white shadow-akoma' : 'text-muted'"
        >
          {{ p.label }}
        </button>
      </div>
    </div>

    <main class="flex-1 overflow-y-auto pb-4 space-y-4 reveal reveal-d2">
      <div class="grid grid-cols-2 gap-3">
        <div class="card p-4">
          <p class="text-xs text-muted font-medium uppercase tracking-wider">Estudo</p>
          <p class="text-2xl font-bold text-primary mt-1">{{ formatDuration(studyTotalSeconds) }}</p>
          <p class="text-xs text-faint mt-1">{{ studySessions.length }} sessões · {{ periodLabel }}</p>
        </div>
        <div class="card p-4">
          <p class="text-xs font-medium uppercase tracking-wider" style="color: var(--cat-3)">Pausa</p>
          <p class="text-2xl font-bold text-primary mt-1">{{ formatDuration(breakTotalSeconds) }}</p>
          <p class="text-xs text-faint mt-1">{{ breakSessions.length }} pausas · {{ periodLabel }}</p>
        </div>
      </div>

      <div class="seg-control">
        <button
          v-for="t in chartTabs"
          :key="t.key"
          @click="chartTab = t.key"
          class="seg-tab"
          :class="chartTab === t.key ? 'seg-tab-active' : ''"
        >
          {{ t.label }}
        </button>
      </div>

      <WeeklyChart v-if="chartTab === 'study'" :sessions="weekChartSessions" />
      <BreakWeeklyChart v-else :sessions="weekChartSessions" />

      <SubjectDonut v-if="chartTab === 'study'" :sessions="sessions" />

      <div class="space-y-3">
        <h2 class="text-sm font-semibold text-muted uppercase tracking-wider px-1">Histórico</h2>

        <div v-if="groupedTimeline.length === 0" class="py-8 text-center text-faint text-sm">
          Nenhum registro neste período
        </div>

        <div v-for="group in groupedTimeline" :key="group.date" class="space-y-2">
          <div class="flex items-center justify-between px-1">
            <span class="text-xs font-semibold text-muted">{{ formatGroupDate(group.date) }}</span>
            <span class="text-xs text-faint">
              {{ formatDuration(group.studyTotal) }}
              <span v-if="group.breakTotal > 0" class="text-amber-500"> · ☕ {{ formatDuration(group.breakTotal) }}</span>
            </span>
          </div>

          <div
            v-for="item in group.items"
            :key="item.session.id"
            class="list-row"
          >
            <div
              v-if="item.type === 'break'"
              class="w-9 h-9 rounded-akoma flex items-center justify-center text-lg flex-shrink-0 bg-amber-500/15"
            >
              ☕
            </div>
            <div
              v-else
              class="w-9 h-9 rounded-akoma flex items-center justify-center text-lg flex-shrink-0"
              :style="{ background: `${getSubject(item.session.subjectId)?.color ?? 'var(--accent-color)'}20` }"
            >
              {{ getSubject(item.session.subjectId)?.icon ?? '📚' }}
            </div>

            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-primary truncate">
                {{ item.type === 'break' ? 'Pausa' : (getSubject(item.session.subjectId)?.name ?? 'Matéria') }}
              </p>
              <p class="text-xs text-faint">{{ formatTime(item.session.startTime) }} → {{ formatTime(item.session.endTime) }}</p>
            </div>

            <div class="flex items-center gap-2">
              <span
                class="text-sm font-semibold"
                :class="item.type === 'break' ? 'text-amber-500' : 'text-secondary'"
              >
                {{ formatDuration(item.session.duration) }}
              </span>
              <button @click="editingSession = item.session" class="w-7 h-7 btn-icon tap-scale">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button @click="deleteSession(item.session.id)" class="w-7 h-7 btn-icon tap-scale hover:text-red-400">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <SessionEditModal
      :show="!!editingSession"
      :session="editingSession"
      @close="editingSession = null"
      @saved="reloadAll(); editingSession = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useSessionsStore } from '@/stores/sessions'
import { useSubjectsStore } from '@/stores/subjects'
import WeeklyChart from '@/components/stats/WeeklyChart.vue'
import BreakWeeklyChart from '@/components/stats/BreakWeeklyChart.vue'
import SubjectDonut from '@/components/stats/SubjectDonut.vue'
import SessionEditModal from '@/components/sessions/SessionEditModal.vue'
import { formatDuration, localDateStr, isStudySession, isBreakSession } from '@/types'
import { buildTimeline } from '@/utils/timeline'
import type { StudySession } from '@/types'

const sessionsStore = useSessionsStore()
const subjectsStore = useSubjectsStore()
const editingSession = ref<StudySession | null>(null)

type Period = 'today' | 'week' | 'month'
const period = ref<Period>('today')
const chartTab = ref<'study' | 'break'>('study')

const periods = [
  { value: 'today' as Period, label: 'Hoje' },
  { value: 'week'  as Period, label: 'Semana' },
  { value: 'month' as Period, label: 'Mês' },
]

const chartTabs = [
  { key: 'study' as const, label: 'Estudo' },
  { key: 'break' as const, label: 'Pausa' },
]

const sessions = computed(() => sessionsStore.rangeSessions)
const studySessions = computed(() => sessions.value.filter(isStudySession))
const breakSessions = computed(() => sessions.value.filter(isBreakSession))

const studyTotalSeconds = computed(() => studySessions.value.reduce((a, s) => a + s.duration, 0))
const breakTotalSeconds = computed(() => breakSessions.value.reduce((a, s) => a + s.duration, 0))

const periodLabel = computed(() => {
  const map: Record<Period, string> = { today: 'hoje', week: 'nesta semana', month: 'neste mês' }
  return map[period.value]
})

const weekChartSessions = ref<StudySession[]>([])

const groupedTimeline = computed(() => {
  const map = new Map<string, StudySession[]>()
  for (const s of sessions.value) {
    if (!map.has(s.date)) map.set(s.date, [])
    map.get(s.date)!.push(s)
  }
  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, daySessions]) => {
      const items = buildTimeline(daySessions).filter(i => i.type !== 'gap')
      return {
        date,
        items,
        studyTotal: daySessions.filter(isStudySession).reduce((a, s) => a + s.duration, 0),
        breakTotal: daySessions.filter(isBreakSession).reduce((a, s) => a + s.duration, 0),
      }
    })
})

function getSubject(id?: string) { return id ? subjectsStore.getSubject(id) : undefined }
function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
function formatGroupDate(date: string) {
  const d = new Date(date + 'T12:00:00')
  const today = localDateStr()
  if (date === today) return 'Hoje'
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })
}

async function deleteSession(id: string) {
  if (confirm('Excluir este registro?')) {
    await sessionsStore.remove(id)
    await reloadAll()
  }
}

async function loadRange() {
  const now = new Date()
  const to = localDateStr(now)
  let from: string
  if (period.value === 'today') {
    from = to
  } else if (period.value === 'week') {
    const d = new Date(now)
    d.setDate(now.getDate() - 6)
    from = localDateStr(d)
  } else {
    const d = new Date(now)
    d.setDate(now.getDate() - 29)
    from = localDateStr(d)
  }
  await sessionsStore.loadRange(from, to)
}

async function loadWeekChart() {
  const now = new Date()
  const to = localDateStr(now)
  const d = new Date(now)
  d.setDate(now.getDate() - 6)
  weekChartSessions.value = await sessionsStore.fetchRange(localDateStr(d), to)
}

async function reloadAll() {
  await Promise.all([loadRange(), loadWeekChart()])
}

watch(period, reloadAll)
onMounted(reloadAll)
</script>
