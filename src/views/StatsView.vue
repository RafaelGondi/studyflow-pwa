<template>
  <div class="page akoma-page">
    <PageHeader
      label="Sua evolução"
      title="Progresso"
      meta="Tempo de estudo no período"
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
      <section
        v-if="periodDates.length"
        class="history-overview reveal reveal-d1"
        aria-labelledby="consistency-title"
      >
        <div class="history-overview__heading">
          <div>
            <span id="consistency-title" class="history-overview__eyebrow">Consistência</span>
            <div class="history-overview__score">{{ consistency }}%</div>
          </div>
          <AkBadge
            :variant="trend.delta > 0 ? 'accent' : 'neutral'"
            :label="trend.label"
          />
        </div>

        <AkProgress
          :value="activeDayCount"
          :max="periodDates.length || 1"
          size="md"
        />

        <p class="history-overview__message">{{ trend.message }}</p>

        <div class="history-metrics">
          <div class="history-metric">
            <strong>{{ activeDayCount }}</strong>
            <span>dias ativos</span>
          </div>
          <div class="history-metric">
            <strong>{{ sessions.length }}</strong>
            <span>sessões</span>
          </div>
          <div class="history-metric">
            <strong>{{ formatDuration(studyTotalSeconds) }}</strong>
            <span>tempo total</span>
          </div>
        </div>
      </section>

      <WeeklyChart :sessions="weekChartSessions" />

      <SubjectDonut :sessions="sessions" />

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
              </span>
            </template>
          </AkSectionHeader>

          <AkList>
            <template v-for="(item, i) in group.items" :key="item.type === 'gap' ? `gap-${group.date}-${i}` : item.session.id">
              <li v-if="item.type === 'gap'" class="text-xs text-muted gap-row">
                ↕ ~{{ item.label }} entre sessões
              </li>

              <li v-else-if="item.type === 'break'" class="text-xs text-muted gap-row">
                ↕ ~{{ formatDuration(item.session.duration) }} de intervalo
                <span class="gap-row__times">
                  {{ formatTime(item.session.startTime) }} – {{ formatTime(item.session.endTime) }}
                </span>
              </li>

              <AkListRow
                v-else
                :divider="i < group.items.length - 1"
              >
                <template #leading>
                  <div class="subject-leading subject-leading--sm">
                    {{ getSubject(item.session.subjectId)?.icon ?? '📚' }}
                  </div>
                </template>

                <span class="truncate">
                  {{ getSubject(item.session.subjectId)?.name ?? 'Matéria' }}
                </span>

                <template #subtitle>
                  <span class="text-xs text-muted session-times">
                    {{ formatSessionTimeRange(item.session, formatTime) }}
                  </span>
                </template>

                <template #trailing>
                  <span class="numeric text-sm shrink-0 text-secondary">
                    {{ formatDuration(item.session.duration) }}
                  </span>
                  <AkIconButton label="Editar" size="sm" icon="edit-outline" @click="editingSession = item.session" />
                  <AkIconButton label="Excluir" size="sm" icon="trash-outline" @click="deleteSession(item.session.id)" />
                </template>
              </AkListRow>
            </template>
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
  AkBadge, AkChip, AkEmptyState, AkIconButton, AkList, AkListRow,
  AkProgress, AkSectionHeader,
} from '@rafael_dias/akoma'
import { useSessionsStore } from '@/stores/sessions'
import { useSubjectsStore } from '@/stores/subjects'
import WeeklyChart from '@/components/stats/WeeklyChart.vue'
import SubjectDonut from '@/components/stats/SubjectDonut.vue'
import SessionEditModal from '@/components/sessions/SessionEditModal.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import { useAppToast } from '@/composables/useAppToast'
import { useConfirmSheet } from '@/composables/useConfirmSheet'
import { formatDuration, localDateStr, isStudySession } from '@/types'
import { buildTimeline, formatSessionTimeRange } from '@/utils/timeline'
import {
  activeDayRate,
  computeStudyTrend,
  enumerateDates,
  getActiveStudyDays,
  getPeriodRange,
} from '@/utils/studyProgress'
import type { StudySession } from '@/types'

const sessionsStore = useSessionsStore()
const subjectsStore = useSubjectsStore()
const toast = useAppToast()
const confirmSheet = useConfirmSheet()
const editingSession = ref<StudySession | null>(null)

type Period = 'today' | 'week' | 'month'
const period = ref<Period>('today')

const periods = [
  { value: 'today' as Period, label: 'Hoje' },
  { value: 'week'  as Period, label: 'Semana' },
  { value: 'month' as Period, label: 'Mês' },
]

const sessions = computed(() => sessionsStore.rangeSessions.filter(isStudySession))
const studyTotalSeconds = computed(() => sessions.value.reduce((a, s) => a + s.duration, 0))
const weekChartSessions = ref<StudySession[]>([])

const periodRange = computed(() => getPeriodRange(period.value))
const periodDates = computed(() => enumerateDates(periodRange.value.from, periodRange.value.to))
const activeDayCount = computed(() => {
  const active = getActiveStudyDays(sessionsStore.rangeSessions)
  return periodDates.value.filter(date => active.has(date)).length
})
const consistency = computed(() => activeDayRate(sessionsStore.rangeSessions, periodDates.value))
const trend = computed(() => computeStudyTrend(sessionsStore.rangeSessions, periodDates.value))

const groupedTimeline = computed(() => {
  const map = new Map<string, StudySession[]>()
  for (const s of sessionsStore.rangeSessions) {
    if (!map.has(s.date)) map.set(s.date, [])
    map.get(s.date)!.push(s)
  }
  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, daySessions]) => ({
      date,
      items: buildTimeline(daySessions),
      studyTotal: daySessions.filter(isStudySession).reduce((a, s) => a + s.duration, 0),
    }))
    .filter(group => group.items.some(i => i.type === 'study'))
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
  const ok = await confirmSheet.ask({
    title: 'Excluir registro',
    message: 'Este registro será removido permanentemente.',
  })
  if (!ok) return
  await sessionsStore.remove(id)
  toast.success('Registro excluído')
  await reloadAll()
}

async function loadRange() {
  const { from, to } = periodRange.value
  await sessionsStore.loadRange(from, to)
}

async function loadWeekChart() {
  const now = new Date()
  const to = localDateStr(now)
  const d = new Date(now); d.setDate(now.getDate() - 6)
  const all = await sessionsStore.fetchRange(localDateStr(d), to)
  weekChartSessions.value = all.filter(isStudySession)
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

.gap-row {
  padding: var(--space-2) var(--space-4);
  line-height: 1.4;
}

.gap-row__times {
  display: block;
  margin-top: 2px;
  opacity: 0.85;
}

.session-times {
  display: block;
  line-height: 1.45;
  white-space: normal;
}
</style>
