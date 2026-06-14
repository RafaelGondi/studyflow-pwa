<template>
  <div class="min-h-screen flex flex-col akoma-page">
    <header class="mb-4 reveal">
      <span class="page-label">Progresso</span>
      <h1 class="page-title">Estatísticas</h1>
    </header>

    <!-- Period tabs -->
    <div class="pb-4 reveal reveal-d1">
      <div class="flex card p-1 gap-1">
        <button
          v-for="p in periods"
          :key="p.value"
          @click="period = p.value"
          class="flex-1 py-2 rounded-akoma text-sm font-semibold transition-all duration-200 tap-scale"
          :class="period === p.value
            ? 'bg-accent text-white shadow-akoma'
            : 'text-muted'"
        >
          {{ p.label }}
        </button>
      </div>
    </div>

    <main class="flex-1 overflow-y-auto pb-4 space-y-4 reveal reveal-d2">

      <!-- ── DIA ─────────────────────────────────────────────── -->
      <template v-if="period === 'day'">
        <StudyCalendar
          :year="calYear"
          :month="calMonth"
          :selected-date="selectedDate"
          :daily-totals="dailyTotals"
          @select="selectDate"
          @update:month="setCalendarMonth"
        />

        <DaySummary :sessions="daySessions" :date="selectedDate" />

        <DayActivityGrid :sessions="daySessions" />

        <DayActivityChart :sessions="daySessions" />

        <SubjectDonut :sessions="daySessions" />

        <StatsTimeline
          :sessions="daySessions"
          @edit="editingSession = $event"
          @delete="deleteSession"
        />
      </template>

      <!-- ── SEMANA ──────────────────────────────────────────── -->
      <template v-else-if="period === 'week'">
        <div class="grid grid-cols-2 gap-3">
          <div class="card p-4">
            <p class="text-xs text-muted font-medium uppercase tracking-wider">Total</p>
            <p class="text-2xl font-bold text-primary mt-1">{{ formatDuration(weekTotal) }}</p>
            <p class="text-xs text-faint mt-1">nesta semana</p>
          </div>
          <div class="card p-4">
            <p class="text-xs text-muted font-medium uppercase tracking-wider">Sessões</p>
            <p class="text-2xl font-bold text-primary mt-1">{{ weekSessions.length }}</p>
            <p class="text-xs text-faint mt-1">~{{ formatDuration(weekAvg) }} / dia</p>
          </div>
        </div>

        <WeeklyChart :sessions="weekSessions" />
        <SubjectDonut :sessions="weekSessions" />

        <div class="space-y-4">
          <div v-for="group in weekGrouped" :key="group.date" class="space-y-2">
            <div class="flex items-center justify-between px-1">
              <span class="text-xs font-semibold text-muted">{{ formatGroupDate(group.date) }}</span>
              <span class="text-xs text-faint">{{ formatDuration(group.total) }}</span>
            </div>
            <StatsTimeline
              :sessions="group.sessions"
              :show-title="false"
              @edit="editingSession = $event"
              @delete="deleteSession"
            />
          </div>
          <div v-if="weekGrouped.length === 0" class="py-8 text-center text-faint text-sm card">
            Nenhuma sessão nesta semana
          </div>
        </div>
      </template>

      <!-- ── MÊS ─────────────────────────────────────────────── -->
      <template v-else>
        <StudyCalendar
          :year="calYear"
          :month="calMonth"
          :selected-date="selectedDate"
          :daily-totals="dailyTotals"
          @select="selectDate"
          @update:month="setCalendarMonth"
        />

        <div class="grid grid-cols-2 gap-3">
          <div class="card p-4">
            <p class="text-xs text-muted font-medium uppercase tracking-wider">Total do mês</p>
            <p class="text-2xl font-bold text-primary mt-1">{{ formatShortDayTotal(monthTotal) }}</p>
            <p class="text-xs text-faint mt-1 capitalize">{{ monthLabel(calYear, calMonth) }}</p>
          </div>
          <div class="card p-4">
            <p class="text-xs text-muted font-medium uppercase tracking-wider">Dias ativos</p>
            <p class="text-2xl font-bold text-primary mt-1">{{ activeDays }}</p>
            <p class="text-xs text-faint mt-1">com estudo</p>
          </div>
        </div>

        <SubjectDonut :sessions="monthSessions" />
      </template>

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
import { useSessionsStore } from '@/stores/sessions'
import StudyCalendar from '@/components/stats/StudyCalendar.vue'
import DaySummary from '@/components/stats/DaySummary.vue'
import DayActivityGrid from '@/components/stats/DayActivityGrid.vue'
import DayActivityChart from '@/components/stats/DayActivityChart.vue'
import StatsTimeline from '@/components/stats/StatsTimeline.vue'
import WeeklyChart from '@/components/stats/WeeklyChart.vue'
import SubjectDonut from '@/components/stats/SubjectDonut.vue'
import SessionEditModal from '@/components/sessions/SessionEditModal.vue'
import { formatDuration, localDateStr, todayDateString } from '@/types'
import { aggregateByDate, formatShortDayTotal, monthLabel } from '@/utils/stats'
import type { StudySession } from '@/types'

const sessionsStore = useSessionsStore()
const editingSession = ref<StudySession | null>(null)

type Period = 'day' | 'week' | 'month'
const period = ref<Period>('day')

const periods = [
  { value: 'day' as Period, label: 'Dia' },
  { value: 'week' as Period, label: 'Semana' },
  { value: 'month' as Period, label: 'Mês' },
]

const now = new Date()
const selectedDate = ref(todayDateString())
const calYear = ref(now.getFullYear())
const calMonth = ref(now.getMonth())

const monthSessions = ref<StudySession[]>([])
const weekSessions = ref<StudySession[]>([])
const daySessions = ref<StudySession[]>([])

const dailyTotals = computed(() => aggregateByDate(monthSessions.value))

const weekTotal = computed(() => weekSessions.value.reduce((a, s) => a + s.duration, 0))
const weekAvg = computed(() => Math.round(weekTotal.value / 7))

const monthTotal = computed(() => {
  let t = 0
  for (const [date, secs] of dailyTotals.value) {
    const d = new Date(date + 'T12:00:00')
    if (d.getFullYear() === calYear.value && d.getMonth() === calMonth.value) t += secs
  }
  return t
})

const activeDays = computed(() => {
  let n = 0
  for (const [date, secs] of dailyTotals.value) {
    const d = new Date(date + 'T12:00:00')
    if (d.getFullYear() === calYear.value && d.getMonth() === calMonth.value && secs > 0) n++
  }
  return n
})

const weekGrouped = computed(() => {
  const map = new Map<string, StudySession[]>()
  for (const s of weekSessions.value) {
    if (!map.has(s.date)) map.set(s.date, [])
    map.get(s.date)!.push(s)
  }
  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, sessions]) => ({
      date,
      sessions: sessions.sort((a, b) => a.startTime - b.startTime),
      total: sessions.reduce((a, s) => a + s.duration, 0),
    }))
})

function formatGroupDate(date: string) {
  const d = new Date(date + 'T12:00:00')
  if (date === todayDateString()) return 'Hoje'
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
}

async function deleteSession(id: string) {
  if (confirm('Excluir esta sessão?')) await reloadAfterDelete(id)
}

async function reloadAfterDelete(id: string) {
  await sessionsStore.remove(id)
  await reload()
}

function setCalendarMonth(year: number, month: number) {
  calYear.value = year
  calMonth.value = month
}

function selectDate(date: string) {
  selectedDate.value = date
  const d = new Date(date + 'T12:00:00')
  calYear.value = d.getFullYear()
  calMonth.value = d.getMonth()
  if (period.value === 'month') period.value = 'day'
}

function monthRange(year: number, month: number) {
  const first = localDateStr(new Date(year, month, 1))
  const last = localDateStr(new Date(year, month + 1, 0))
  return { from: first, to: last }
}

async function loadMonth() {
  const { from, to } = monthRange(calYear.value, calMonth.value)
  monthSessions.value = await sessionsStore.fetchRange(from, to)
  await loadDay()
}

async function loadDay() {
  daySessions.value = monthSessions.value
    .filter(s => s.date === selectedDate.value)
    .sort((a, b) => a.startTime - b.startTime)

  if (daySessions.value.length === 0) {
    daySessions.value = await sessionsStore.loadDate(selectedDate.value)
  }
}

async function loadWeek() {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 6)
  weekSessions.value = await sessionsStore.fetchRange(localDateStr(start), localDateStr(end))
}

async function reload() {
  await Promise.all([loadMonth(), loadWeek()])
}

watch([calYear, calMonth], loadMonth)
watch(selectedDate, loadDay)
watch(period, (p) => {
  if (p === 'week') loadWeek()
  if (p === 'month' || p === 'day') {
    const d = new Date(selectedDate.value + 'T12:00:00')
    calYear.value = d.getFullYear()
    calMonth.value = d.getMonth()
    loadMonth()
  }
})

onMounted(reload)
</script>
