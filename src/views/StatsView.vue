<template>
  <div class="page akoma-page">
    <PageHeader
      label="Sua evolução"
      title="Progresso"
      meta="Estudo e pausas no período"
    />

    <div class="chip-scroll reveal reveal-d1">
      <AkChip
        v-for="p in periods"
        :key="p.value"
        :active="period === p.value"
        @click="period = p.value"
      >
        {{ p.label }}
      </AkChip>
    </div>

    <div class="page-body reveal reveal-d2">
      <div class="today-summary reveal reveal-d1">
        <div class="today-summary__item">
          <span class="today-summary__label">Estudo</span>
          <span class="today-summary__value numeric">{{ formatDuration(studyTotalSeconds) }}</span>
        </div>
        <div class="today-summary__item today-summary__item--break">
          <span class="today-summary__label">Pausa</span>
          <span class="today-summary__value numeric">{{ formatDuration(breakTotalSeconds) }}</span>
        </div>
      </div>

      <div class="chip-row">
        <AkChip v-for="t in chartTabs" :key="t.key" :active="chartTab === t.key" @click="chartTab = t.key">
          {{ t.label }}
        </AkChip>
      </div>

      <WeeklyChart v-if="chartTab === 'study'" :sessions="weekChartSessions" />
      <BreakWeeklyChart v-else :sessions="weekChartSessions" />

      <SubjectDonut v-if="chartTab === 'study'" :sessions="sessions" />

      <section class="section-block">
        <AkSectionHeader title="Histórico" />

        <AkEmptyState
          v-if="groupedTimeline.length === 0"
          title="Nenhum registro"
          description="Nada neste período ainda."
        />

        <template v-for="group in groupedTimeline" :key="group.date">
          <AkSectionHeader :title="formatGroupDate(group.date)">
            <template #action>
              <span class="text-xs text-muted numeric">
                {{ formatDuration(group.studyTotal) }}
                <span v-if="group.breakTotal > 0" class="text-warning"> · ☕ {{ formatDuration(group.breakTotal) }}</span>
              </span>
            </template>
          </AkSectionHeader>

          <AkList>
            <AkListRow
              v-for="(item, i) in group.items"
              :key="item.session.id"
              :divider="i < group.items.length - 1"
            >
              <template #leading>
                <div v-if="item.type === 'break'" class="subject-leading subject-leading--sm">☕</div>
                <div v-else class="subject-leading subject-leading--sm">
                  {{ getSubject(item.session.subjectId)?.icon ?? '📚' }}
                </div>
              </template>

              <span class="truncate">
                {{ item.type === 'break' ? 'Pausa' : (getSubject(item.session.subjectId)?.name ?? 'Matéria') }}
              </span>

              <template #subtitle>
                <span class="text-xs text-muted">
                  {{ formatTime(item.session.startTime) }} → {{ formatTime(item.session.endTime) }}
                </span>
              </template>

              <template #trailing>
                <span class="numeric text-sm shrink-0" :class="item.type === 'break' ? 'text-warning' : 'text-secondary'">
                  {{ formatDuration(item.session.duration) }}
                </span>
                <AkIconButton label="Editar" size="sm" icon="edit-outline" @click="editingSession = item.session" />
                <AkIconButton label="Excluir" size="sm" icon="trash-outline" @click="deleteSession(item.session.id)" />
              </template>
            </AkListRow>
          </AkList>
        </template>
      </section>
    </div>

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
import {
  AkChip, AkEmptyState, AkIconButton, AkList, AkListRow, AkSectionHeader,
} from '@rafael_dias/akoma'
import { useSessionsStore } from '@/stores/sessions'
import { useSubjectsStore } from '@/stores/subjects'
import WeeklyChart from '@/components/stats/WeeklyChart.vue'
import BreakWeeklyChart from '@/components/stats/BreakWeeklyChart.vue'
import SubjectDonut from '@/components/stats/SubjectDonut.vue'
import SessionEditModal from '@/components/sessions/SessionEditModal.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
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
const weekChartSessions = ref<StudySession[]>([])

const groupedTimeline = computed(() => {
  const map = new Map<string, StudySession[]>()
  for (const s of sessions.value) {
    if (!map.has(s.date)) map.set(s.date, [])
    map.get(s.date)!.push(s)
  }
  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, daySessions]) => ({
      date,
      items: buildTimeline(daySessions).filter(i => i.type !== 'gap'),
      studyTotal: daySessions.filter(isStudySession).reduce((a, s) => a + s.duration, 0),
      breakTotal: daySessions.filter(isBreakSession).reduce((a, s) => a + s.duration, 0),
    }))
})

function getSubject(id?: string) { return id ? subjectsStore.getSubject(id) : undefined }
function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
function formatGroupDate(date: string) {
  const d = new Date(date + 'T12:00:00')
  if (date === localDateStr()) return 'Hoje'
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
  if (period.value === 'today') from = to
  else if (period.value === 'week') {
    const d = new Date(now); d.setDate(now.getDate() - 6); from = localDateStr(d)
  } else {
    const d = new Date(now); d.setDate(now.getDate() - 29); from = localDateStr(d)
  }
  await sessionsStore.loadRange(from, to)
}

async function loadWeekChart() {
  const now = new Date()
  const to = localDateStr(now)
  const d = new Date(now); d.setDate(now.getDate() - 6)
  weekChartSessions.value = await sessionsStore.fetchRange(localDateStr(d), to)
}

async function reloadAll() {
  await Promise.all([loadRange(), loadWeekChart()])
}

watch(period, reloadAll)
onMounted(reloadAll)
</script>

<style scoped>
:deep(.ak-list-row__trailing) {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  flex-shrink: 0;
}
</style>
