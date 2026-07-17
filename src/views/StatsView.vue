<template>
  <div class="page akoma-page">
    <header class="page-header reveal">
      <span class="page-label">Progresso</span>
      <h1 class="page-title">Estatísticas</h1>
      <p class="page-subtitle">Estudo e pausas no período</p>
    </header>

    <div class="period-bar reveal reveal-d1" style="margin-bottom: var(--space-4)">
      <AkChip
        v-for="p in periods"
        :key="p.value"
        :active="period === p.value"
        @click="period = p.value"
      >
        {{ p.label }}
      </AkChip>
    </div>

    <main class="scroll-main stack reveal reveal-d2">
      <div class="grid-2">
        <AkCard padding="md">
          <p class="stat-label">Estudo</p>
          <p class="stat-value numeric">{{ formatDuration(studyTotalSeconds) }}</p>
          <p class="stat-hint">{{ studySessions.length }} sessões · {{ periodLabel }}</p>
        </AkCard>
        <AkCard padding="md">
          <p class="stat-label" style="color: var(--cat-3)">Pausa</p>
          <p class="stat-value numeric">{{ formatDuration(breakTotalSeconds) }}</p>
          <p class="stat-hint">{{ breakSessions.length }} pausas · {{ periodLabel }}</p>
        </AkCard>
      </div>

      <div class="chip-group">
        <AkChip
          v-for="t in chartTabs"
          :key="t.key"
          :active="chartTab === t.key"
          @click="chartTab = t.key"
        >
          {{ t.label }}
        </AkChip>
      </div>

      <WeeklyChart v-if="chartTab === 'study'" :sessions="weekChartSessions" />
      <BreakWeeklyChart v-else :sessions="weekChartSessions" />

      <SubjectDonut v-if="chartTab === 'study'" :sessions="sessions" />

      <div class="stack-sm">
        <h2 class="section-title">Histórico</h2>

        <AkEmptyState
          v-if="groupedTimeline.length === 0"
          title="Nenhum registro neste período"
          description="Comece a estudar para ver seu histórico aqui."
        />

        <div v-for="group in groupedTimeline" :key="group.date" class="stack-xs">
          <div class="flex-between" style="padding: 0 var(--space-1)">
            <span class="text-xs font-semibold text-muted">{{ formatGroupDate(group.date) }}</span>
            <span class="text-xs text-muted numeric">
              {{ formatDuration(group.studyTotal) }}
              <span v-if="group.breakTotal > 0" class="text-warning"> · ☕ {{ formatDuration(group.breakTotal) }}</span>
            </span>
          </div>

          <AkCard
            v-for="item in group.items"
            :key="item.session.id"
            padding="sm"
          >
            <div class="flex-row" style="gap: var(--space-3)">
              <div
                v-if="item.type === 'break'"
                class="subject-avatar"
                :style="{ background: 'var(--warning-soft)' }"
              >
                ☕
              </div>
              <div
                v-else
                class="subject-avatar"
                :style="{ background: colorMix(getSubject(item.session.subjectId)?.color ?? 'var(--accent)', 12) }"
              >
                {{ getSubject(item.session.subjectId)?.icon ?? '📚' }}
              </div>

              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-primary truncate">
                  {{ item.type === 'break' ? 'Pausa' : (getSubject(item.session.subjectId)?.name ?? 'Matéria') }}
                </p>
                <p class="text-xs text-muted">{{ formatTime(item.session.startTime) }} → {{ formatTime(item.session.endTime) }}</p>
              </div>

              <span
                class="text-sm font-semibold numeric"
                :class="item.type === 'break' ? 'text-warning' : 'text-secondary'"
              >
                {{ formatDuration(item.session.duration) }}
              </span>
              <AkButton size="sm" variant="ghost" @click="editingSession = item.session">
                <template #icon>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </template>
              </AkButton>
              <AkButton size="sm" variant="ghost" @click="deleteSession(item.session.id)">
                <template #icon>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                </template>
              </AkButton>
            </div>
          </AkCard>
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
import { AkButton, AkCard, AkChip, AkEmptyState } from '@rafael_dias/akoma'
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

function colorMix(color: string, pct: number) {
  return `color-mix(in srgb, ${color} ${pct}%, var(--bg-elevated))`
}

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
