<template>
  <div class="page akoma-page">
    <PageHeader
      label="Matéria"
      :title="subject?.name ?? '…'"
      :meta="categoryName"
    >
      <template #nav>
        <AkButton size="sm" variant="ghost" @click="router.back()">
          <template #icon>
            <AkIcon name="arrow-left-outline" :size="16" />
          </template>
          Voltar
        </AkButton>
      </template>
    </PageHeader>

    <div v-if="loading" class="loading-center">
      <AkShimmer width="32px" height="32px" radius="full" />
    </div>

    <div v-else class="page-body reveal reveal-d1">
      <div v-if="subject" class="subject-hero">
        <div
          class="subject-avatar subject-avatar--lg"
          :style="{ background: subjectBgMix(subject.color, 16) }"
        >
          {{ subject.icon }}
        </div>
      </div>

      <div class="stat-grid">
        <div class="stat-card">
          <p class="stat-label">Total</p>
          <p class="stat-value numeric">{{ formatDuration(stats.totalSeconds) }}</p>
          <p class="stat-hint">tempo de estudo</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">Sessões</p>
          <p class="stat-value numeric">{{ stats.sessionCount }}</p>
          <p class="stat-hint">{{ stats.daysStudied }} dias ativos</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">Média / sessão</p>
          <p class="stat-value numeric">{{ formatDuration(stats.avgSessionSeconds) }}</p>
          <p class="stat-hint">foco máx. {{ formatDuration(stats.maxSessionSeconds) }}</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">Média / dia</p>
          <p class="stat-value numeric">{{ formatDuration(stats.avgDaySeconds) }}</p>
          <p class="stat-hint">nos dias estudados</p>
        </div>
      </div>

      <StudyCalendar
        v-if="sessions.length > 0"
        :year="calYear"
        :month="calMonth"
        :selected-date="selectedDate"
        :daily-totals="dailyTotals"
        :accent-color="subject?.color"
        @select="selectDate"
        @update:month="setCalendarMonth"
      />

      <DaySummary
        v-if="daySessions.length > 0"
        :sessions="daySessions"
        :date="selectedDate"
      />

      <AkCard v-if="sessions.length > 0" padding="md" class="stack-xs">
        <h2 class="section-title">Histórico</h2>
        <div class="flex-between" style="padding: var(--space-2) 0; border-bottom: 1px solid var(--border)">
          <span class="text-sm text-muted">Primeiro estudo</span>
          <span class="text-sm font-semibold text-primary text-right">
            {{ stats.firstStudyDate ? formatLongDate(stats.firstStudyDate) : '—' }}
          </span>
        </div>
        <div class="flex-between" style="padding: var(--space-2) 0">
          <span class="text-sm text-muted">Último estudo</span>
          <span class="text-sm font-semibold text-primary text-right">
            {{ stats.lastStudyDate ? formatLongDate(stats.lastStudyDate) : '—' }}
          </span>
        </div>
      </AkCard>

      <WeeklyChart v-if="recentSessions.length > 0" :sessions="recentSessions" />

      <StatsTimeline
        v-if="daySessions.length > 0"
        :sessions="daySessions"
        @edit="editingSession = $event"
        @delete="deleteSession"
      />

      <AkEmptyState
        v-else-if="sessions.length > 0"
        title="Nenhuma sessão neste dia"
        description="Selecione outro dia no calendário."
      />

      <AkEmptyState
        v-else
        title="Nenhuma sessão registrada"
        description="Comece a estudar esta matéria para ver estatísticas."
      />
    </div>

    <SessionEditModal
      :show="!!editingSession"
      :session="editingSession"
      @close="editingSession = null"
      @saved="reload(); editingSession = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AkButton, AkCard, AkEmptyState, AkIcon, AkShimmer } from '@rafael_dias/akoma'
import { useSubjectsStore } from '@/stores/subjects'
import { useSessionsStore } from '@/stores/sessions'
import StudyCalendar from '@/components/stats/StudyCalendar.vue'
import DaySummary from '@/components/stats/DaySummary.vue'
import WeeklyChart from '@/components/stats/WeeklyChart.vue'
import StatsTimeline from '@/components/stats/StatsTimeline.vue'
import SessionEditModal from '@/components/sessions/SessionEditModal.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import { formatDuration, localDateStr, todayDateString } from '@/types'
import { getSubjectStats, formatLongDate, aggregateByDate } from '@/utils/stats'
import { subjectBgMix } from '@/utils/colors'
import type { StudySession } from '@/types'

const route = useRoute()
const router = useRouter()
const subjectsStore = useSubjectsStore()
const sessionsStore = useSessionsStore()

const loading = ref(true)
const sessions = ref<StudySession[]>([])
const editingSession = ref<StudySession | null>(null)

const now = new Date()
const selectedDate = ref(todayDateString())
const calYear = ref(now.getFullYear())
const calMonth = ref(now.getMonth())

const subjectId = computed(() => route.params.id as string)
const subject = computed(() => subjectsStore.getSubject(subjectId.value))

const categoryName = computed(() => {
  const catId = subject.value?.categoryId
  if (!catId) return 'Sem categoria'
  return subjectsStore.getCategory(catId)?.name ?? 'Sem categoria'
})

const stats = computed(() => getSubjectStats(sessions.value))
const dailyTotals = computed(() => aggregateByDate(sessions.value))

const daySessions = computed(() =>
  sessions.value
    .filter(s => s.date === selectedDate.value)
    .sort((a, b) => a.startTime - b.startTime)
)

const recentSessions = computed(() => {
  const from = new Date()
  from.setDate(from.getDate() - 6)
  const fromStr = localDateStr(from)
  return sessions.value.filter(s => s.date >= fromStr)
})

function setCalendarMonth(year: number, month: number) {
  calYear.value = year
  calMonth.value = month
}

function selectDate(date: string) {
  selectedDate.value = date
  const d = new Date(date + 'T12:00:00')
  calYear.value = d.getFullYear()
  calMonth.value = d.getMonth()
}

async function reload() {
  loading.value = true
  sessions.value = await sessionsStore.fetchBySubject(subjectId.value)
  loading.value = false
}

async function deleteSession(id: string) {
  if (!confirm('Excluir esta sessão?')) return
  await sessionsStore.remove(id)
  await reload()
}

watch(subjectId, reload)
onMounted(reload)
</script>

<style scoped>
.subject-hero {
  display: flex;
  justify-content: center;
  margin-top: calc(-1 * var(--space-2));
}
</style>
