<template>
  <div class="min-h-screen flex flex-col akoma-page">
    <header class="mb-5 reveal">
      <button @click="router.back()" class="flex items-center gap-1 text-sm text-muted mb-3 tap-scale">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        Matérias
      </button>

      <div v-if="subject" class="flex items-center gap-4">
        <div
          class="w-14 h-14 rounded-akoma flex items-center justify-center text-3xl flex-shrink-0"
          :style="{ background: `${subject.color}20` }"
        >
          {{ subject.icon }}
        </div>
        <div class="min-w-0">
          <h1 class="page-title truncate">{{ subject.name }}</h1>
          <p class="text-sm text-muted mt-0.5">{{ categoryName }}</p>
        </div>
      </div>
    </header>

    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="w-6 h-6 rounded-full border-2 border-app-elevated border-t-accent animate-spin" />
    </div>

    <main v-else class="flex-1 overflow-y-auto pb-4 space-y-4 reveal reveal-d1">
      <div class="grid grid-cols-2 gap-3">
        <div class="card p-4">
          <p class="text-xs text-muted font-medium uppercase tracking-wider">Total</p>
          <p class="text-2xl font-bold text-primary mt-1">{{ formatDuration(stats.totalSeconds) }}</p>
          <p class="text-xs text-faint mt-1">tempo de estudo</p>
        </div>
        <div class="card p-4">
          <p class="text-xs text-muted font-medium uppercase tracking-wider">Sessões</p>
          <p class="text-2xl font-bold text-primary mt-1">{{ stats.sessionCount }}</p>
          <p class="text-xs text-faint mt-1">{{ stats.daysStudied }} dias ativos</p>
        </div>
        <div class="card p-4">
          <p class="text-xs text-muted font-medium uppercase tracking-wider">Média / sessão</p>
          <p class="text-2xl font-bold text-primary mt-1">{{ formatDuration(stats.avgSessionSeconds) }}</p>
          <p class="text-xs text-faint mt-1">foco máx. {{ formatDuration(stats.maxSessionSeconds) }}</p>
        </div>
        <div class="card p-4">
          <p class="text-xs text-muted font-medium uppercase tracking-wider">Média / dia</p>
          <p class="text-2xl font-bold text-primary mt-1">{{ formatDuration(stats.avgDaySeconds) }}</p>
          <p class="text-xs text-faint mt-1">nos dias estudados</p>
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

      <div class="card p-4 space-y-3">
        <h2 class="text-xs font-bold text-muted uppercase tracking-wider">Histórico</h2>
        <div class="flex justify-between items-start gap-3 py-2 border-b border-app-border">
          <span class="text-sm text-muted">Primeiro estudo</span>
          <span class="text-sm font-semibold text-primary text-right">
            {{ stats.firstStudyDate ? formatLongDate(stats.firstStudyDate) : '—' }}
          </span>
        </div>
        <div class="flex justify-between items-start gap-3 py-2">
          <span class="text-sm text-muted">Último estudo</span>
          <span class="text-sm font-semibold text-primary text-right">
            {{ stats.lastStudyDate ? formatLongDate(stats.lastStudyDate) : '—' }}
          </span>
        </div>
      </div>

      <WeeklyChart v-if="recentSessions.length > 0" :sessions="recentSessions" />

      <StatsTimeline
        v-if="daySessions.length > 0"
        :sessions="daySessions"
        @edit="editingSession = $event"
        @delete="deleteSession"
      />

      <div v-else-if="sessions.length > 0" class="py-8 text-center text-faint text-sm card">
        Nenhuma sessão neste dia
      </div>

      <div v-else class="py-12 text-center text-faint text-sm card">
        Nenhuma sessão registrada para esta matéria
      </div>
    </main>

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
import { useSubjectsStore } from '@/stores/subjects'
import { useSessionsStore } from '@/stores/sessions'
import StudyCalendar from '@/components/stats/StudyCalendar.vue'
import DaySummary from '@/components/stats/DaySummary.vue'
import WeeklyChart from '@/components/stats/WeeklyChart.vue'
import StatsTimeline from '@/components/stats/StatsTimeline.vue'
import SessionEditModal from '@/components/sessions/SessionEditModal.vue'
import { formatDuration, localDateStr, todayDateString } from '@/types'
import { getSubjectStats, formatLongDate, aggregateByDate } from '@/utils/stats'
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
