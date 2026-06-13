<template>
  <div class="min-h-screen flex flex-col akoma-page">
    <header class="mb-5 reveal">
      <span class="page-label">Progresso</span>
      <h1 class="page-title">Estatísticas</h1>
      <p class="text-sm text-muted mt-2">Acompanhe seu ritmo de estudo</p>
    </header>

    <div class="pb-4 reveal reveal-d1">
      <div class="flex card p-1 gap-1">
        <button
          v-for="p in periods"
          :key="p.value"
          @click="period = p.value"
          class="flex-1 py-2 rounded-pill text-sm font-semibold transition-all duration-200 tap-scale"
          :class="period === p.value
            ? 'bg-accent text-white shadow-akoma'
            : 'text-muted'"
        >
          {{ p.label }}
        </button>
      </div>
    </div>

    <main class="flex-1 overflow-y-auto pb-4 space-y-4 reveal reveal-d2">
      <div class="grid grid-cols-2 gap-3">
        <div class="card p-4">
          <p class="text-xs text-muted font-medium uppercase tracking-wider">Total</p>
          <p class="text-2xl font-bold text-primary mt-1">{{ formatDuration(totalSeconds) }}</p>
          <p class="text-xs text-faint mt-1">{{ periodLabel }}</p>
        </div>
        <div class="card p-4">
          <p class="text-xs text-muted font-medium uppercase tracking-wider">Sessões</p>
          <p class="text-2xl font-bold text-primary mt-1">{{ sessions.length }}</p>
          <p class="text-xs text-faint mt-1">{{ avgLabel }}</p>
        </div>
      </div>

      <!-- Weekly chart -->
      <WeeklyChart :sessions="weekSessions" />

      <!-- Subject donut -->
      <SubjectDonut :sessions="sessions" />

      <!-- Session history -->
      <div class="space-y-3">
        <h2 class="text-sm font-semibold text-muted uppercase tracking-wider px-1">Histórico</h2>

        <div v-if="groupedSessions.length === 0" class="py-8 text-center text-faint text-sm">
          Nenhuma sessão neste período
        </div>

        <div v-for="group in groupedSessions" :key="group.date" class="space-y-2">
          <div class="flex items-center justify-between px-1">
            <span class="text-xs font-semibold text-muted">{{ formatGroupDate(group.date) }}</span>
            <span class="text-xs text-faint">{{ formatDuration(group.total) }}</span>
          </div>
          <div
            v-for="s in group.sessions"
            :key="s.id"
            class="list-row"
          >
            <div
              class="w-9 h-9 rounded-akoma flex items-center justify-center text-lg flex-shrink-0"
              :style="{ background: `${getSubject(s.subjectId)?.color ?? 'var(--accent-color)'}20` }"
            >
              {{ getSubject(s.subjectId)?.icon ?? '📚' }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-primary truncate">{{ getSubject(s.subjectId)?.name ?? 'Matéria' }}</p>
              <p class="text-xs text-faint">{{ formatTime(s.startTime) }} → {{ formatTime(s.endTime) }}</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold text-secondary">{{ formatDuration(s.duration) }}</span>
              <button
                @click="editingSession = s"
                class="w-7 h-7 btn-icon tap-scale"
              >
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button
                @click="deleteSession(s.id)"
                class="w-7 h-7 btn-icon tap-scale hover:text-red-400"
              >
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
      @saved="loadRange(); editingSession = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, type Ref } from 'vue'
import { useSessionsStore } from '@/stores/sessions'
import { useSubjectsStore } from '@/stores/subjects'
import WeeklyChart from '@/components/stats/WeeklyChart.vue'
import SubjectDonut from '@/components/stats/SubjectDonut.vue'
import SessionEditModal from '@/components/sessions/SessionEditModal.vue'
import { formatDuration, localDateStr } from '@/types'

const sessionsStore = useSessionsStore()
const subjectsStore = useSubjectsStore()
const editingSession = ref<import('@/types').StudySession | null>(null)

type Period = 'today' | 'week' | 'month'
const period = ref<Period>('today')

const periods = [
  { value: 'today' as Period, label: 'Hoje' },
  { value: 'week'  as Period, label: 'Semana' },
  { value: 'month' as Period, label: 'Mês' },
]

const sessions = computed(() => sessionsStore.rangeSessions)

const totalSeconds = computed(() => sessions.value.reduce((a, s) => a + s.duration, 0))

const avgLabel = computed(() => {
  const days = period.value === 'today' ? 1 : period.value === 'week' ? 7 : 30
  const avg = totalSeconds.value / days
  return `~${formatDuration(Math.round(avg))} / dia`
})

const periodLabel = computed(() => {
  const map: Record<Period, string> = { today: 'hoje', week: 'nesta semana', month: 'neste mês' }
  return map[period.value]
})

const weekSessions = computed(() => {
  const from = new Date()
  from.setDate(from.getDate() - 6)
  from.setHours(0, 0, 0, 0)
  return sessions.value.filter(s => s.startTime >= from.getTime())
})

const groupedSessions = computed(() => {
  const map = new Map<string, typeof sessions.value>()
  for (const s of sessions.value) {
    if (!map.has(s.date)) map.set(s.date, [])
    map.get(s.date)!.push(s)
  }
  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, sessions]) => ({
      date,
      sessions,
      total: sessions.reduce((a, s) => a + s.duration, 0),
    }))
})

function getSubject(id: string) { return subjectsStore.getSubject(id) }
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
  if (confirm('Excluir esta sessão?')) {
    await sessionsStore.remove(id)
    await loadRange()
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

watch(period, loadRange)
onMounted(loadRange)
</script>
