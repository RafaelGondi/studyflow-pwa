<template>
  <div class="min-h-screen flex flex-col akoma-page" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd">

    <header class="flex items-center justify-between mb-5 reveal">
      <div>
        <span class="page-label">{{ greeting }}</span>
        <h1 class="page-title">StudyFlow</h1>
      </div>
      <span class="text-xs font-semibold text-muted">{{ dateLabel }}</span>
    </header>

    <!-- Summary cards -->
    <div class="grid grid-cols-2 gap-3 mb-4 reveal reveal-d1">
      <div class="card p-3 flex flex-col gap-0.5">
        <span class="text-[10px] font-bold text-accent uppercase tracking-wider">Estudo</span>
        <span class="font-display text-2xl font-bold text-primary tabular-nums">{{ studyTotalFormatted }}</span>
        <span class="text-[10px] text-muted">{{ isToday ? 'hoje' : dateNavLabel.toLowerCase() }}</span>
      </div>
      <div class="card p-3 flex flex-col gap-0.5">
        <span class="text-[10px] font-bold uppercase tracking-wider" style="color: var(--cat-3)">Pausa</span>
        <span class="font-display text-2xl font-bold text-primary tabular-nums">{{ breakTotalFormatted }}</span>
        <span class="text-[10px] text-muted">{{ isToday ? 'hoje' : dateNavLabel.toLowerCase() }}</span>
      </div>
    </div>

    <main class="flex-1 overflow-y-auto pb-4 space-y-4 reveal reveal-d2">

      <!-- Subject list (Study Checker style) -->
      <SubjectStudyList
        v-if="isToday"
        :active-id="timerStore.activeSubjectId"
        :extra-seconds="timerStore.mode === 'study' || timerStore.mode === 'paused' ? timerStore.studyElapsedSeconds : 0"
        :extra-subject-id="timerStore.activeSubjectId"
        @select="handleSubjectSelect"
      />

      <!-- Compact timer bar -->
      <ActiveTimerBar
        v-if="isToday && timerStore.mode !== 'idle'"
        :last-subject-id="lastSubjectId"
        @stop="handleStop"
        @break="handleBreak"
        @continue="handleContinue"
      />

      <!-- Timeline -->
      <div class="pt-1">
        <div class="flex items-center justify-between px-1 mb-3">
          <button
            @click="goPrev"
            class="w-7 h-7 btn-icon tap-scale"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>

          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-muted">{{ dateNavLabel }}</span>
            <button
              v-if="isToday"
              @click="showAddModal = true"
              class="w-6 h-6 btn-icon tap-scale"
              title="Adicionar registro"
            >
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>

          <button
            @click="goNext"
            :disabled="isToday"
            class="w-7 h-7 rounded-md bg-app-elevated flex items-center justify-center transition-all"
            :class="isToday ? 'text-faint opacity-30 cursor-default' : 'tap-scale'"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>

        <div v-if="loadingHistory" class="py-6 flex justify-center">
          <div class="w-5 h-5 rounded-full border-2 border-app-elevated border-t-accent animate-spin" />
        </div>

        <div v-else-if="timeline.length === 0" class="py-8 text-center text-faint text-sm">
          Nenhum registro neste dia
        </div>

        <template v-else>
          <div
            v-for="(item, index) in timeline"
            :key="item.type === 'gap' ? `gap-${index}` : item.session.id"
            class="group"
          >
            <!-- Legacy inferred gap -->
            <div v-if="item.type === 'gap'" class="pl-4 py-1.5">
              <span class="text-xs text-muted">☕ ~{{ item.label }} de intervalo</span>
            </div>

            <!-- Break record -->
            <div v-else-if="item.type === 'break'" class="flex items-start gap-3 py-2.5">
              <div class="w-1 self-stretch rounded-full mt-1 flex-shrink-0 bg-amber-400/70" />
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2">
                  <p class="text-sm font-semibold text-amber-500">☕ Pausa</p>
                  <div class="flex items-center gap-1.5 flex-shrink-0">
                    <span class="text-sm font-semibold text-amber-500">{{ formatDuration(item.session.duration) }}</span>
                    <button @click="editingSession = item.session" class="w-6 h-6 btn-icon opacity-0 group-hover:opacity-100">
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button @click="deleteSession(item.session.id)" class="w-6 h-6 btn-icon opacity-0 group-hover:opacity-100 hover:text-red-400">
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <p class="text-[11px] text-muted mt-0.5">{{ fmt(item.session.startTime) }} – {{ fmt(item.session.endTime) }}</p>
              </div>
            </div>

            <!-- Study record -->
            <div v-else class="flex items-start gap-3 py-2.5">
              <div
                class="w-1 self-stretch rounded-full mt-1 flex-shrink-0"
                :style="{ background: getSubject(item.session.subjectId)?.color ?? 'var(--accent-color)' }"
              />
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2">
                  <p class="text-sm font-semibold text-primary truncate">{{ getSubject(item.session.subjectId)?.name ?? 'Matéria' }}</p>
                  <div class="flex items-center gap-1.5 flex-shrink-0">
                    <span class="text-sm font-semibold" :style="{ color: getSubject(item.session.subjectId)?.color ?? 'var(--accent-color)' }">
                      {{ formatDuration(item.session.duration) }}
                    </span>
                    <button @click="editingSession = item.session" class="w-6 h-6 btn-icon opacity-0 group-hover:opacity-100">
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button @click="deleteSession(item.session.id)" class="w-6 h-6 btn-icon opacity-0 group-hover:opacity-100 hover:text-red-400">
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <div class="text-[11px] text-muted mt-0.5 flex flex-wrap gap-x-1.5 gap-y-0.5">
                  <template v-if="item.session.segments && item.session.segments.length > 1">
                    <template v-for="(seg, i) in item.session.segments" :key="i">
                      <span>{{ fmt(seg.start) }} – {{ fmt(seg.end) }}</span>
                      <span v-if="i < item.session.segments.length - 1" class="text-amber-400">
                        ⏸ {{ formatDuration(Math.round((item.session.segments[i + 1].start - seg.end) / 1000)) }}
                      </span>
                    </template>
                  </template>
                  <span v-else>{{ fmt(item.session.startTime) }} – {{ fmt(item.session.endTime) }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </main>

    <FocusMode
      :active="focusMode"
      :subject="activeSubject"
      @close="focusMode = false"
    />

    <SessionEditModal
      :show="!!editingSession"
      :session="editingSession"
      @close="editingSession = null"
      @saved="onSessionSaved"
    />

    <SessionAddModal
      :show="showAddModal"
      :date="viewDate"
      @close="showAddModal = false"
      @saved="onSessionSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useTimerStore } from '@/stores/timer'
import { useSessionsStore } from '@/stores/sessions'
import { useSubjectsStore } from '@/stores/subjects'
import SubjectStudyList from '@/components/home/SubjectStudyList.vue'
import ActiveTimerBar from '@/components/home/ActiveTimerBar.vue'
import FocusMode from '@/components/home/FocusMode.vue'
import SessionEditModal from '@/components/sessions/SessionEditModal.vue'
import SessionAddModal from '@/components/sessions/SessionAddModal.vue'
import { useFaceDownFocus } from '@/composables/useFaceDownFocus'
import { formatDuration, formatTimer, localDateStr, todayDateString, isStudySession, isBreakSession } from '@/types'
import { buildTimeline } from '@/utils/timeline'
import type { StudySession } from '@/types'

const timerStore = useTimerStore()
const sessionsStore = useSessionsStore()
const subjectsStore = useSubjectsStore()

const lastSubjectId = ref<string | null>(null)
const focusMode = ref(false)
const editingSession = ref<StudySession | null>(null)
const showAddModal = ref(false)

const { isFaceDown } = useFaceDownFocus()
watch(isFaceDown, (faceDown) => {
  if (faceDown && timerStore.mode !== 'idle') focusMode.value = true
})

const viewDate = ref(todayDateString())
const viewSessions = ref<StudySession[]>([])
const loadingHistory = ref(false)

const isToday = computed(() => viewDate.value === todayDateString())

const displaySessions = computed<StudySession[]>(() =>
  isToday.value ? sessionsStore.todaySessions : viewSessions.value
)

const timeline = computed(() => buildTimeline(displaySessions.value))

const dateNavLabel = computed(() => {
  if (isToday.value) return 'Hoje'
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (viewDate.value === localDateStr(yesterday)) return 'Ontem'
  const d = new Date(viewDate.value + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
})

const activeSubject = computed(() => {
  const id = timerStore.activeSubjectId
  return id ? subjectsStore.getSubject(id) : null
})

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
})

const dateLabel = computed(() =>
  new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
)

const studyTotalFormatted = computed(() => {
  if (isToday.value) {
    const live = (timerStore.mode === 'study' || timerStore.mode === 'paused')
      ? timerStore.studyElapsedSeconds : 0
    return formatTimer(sessionsStore.todayStudyTotalSeconds + live)
  }
  const total = displaySessions.value
    .filter(isStudySession)
    .reduce((acc, s) => acc + s.duration, 0)
  return formatTimer(total)
})

const breakTotalFormatted = computed(() => {
  if (isToday.value) {
    const live = timerStore.mode === 'break' ? timerStore.breakElapsedSeconds : 0
    return formatTimer(sessionsStore.todayBreakTotalSeconds + live)
  }
  const total = displaySessions.value
    .filter(isBreakSession)
    .reduce((acc, s) => acc + s.duration, 0)
  return formatTimer(total)
})

async function fetchViewDate() {
  if (isToday.value) return
  loadingHistory.value = true
  viewSessions.value = await sessionsStore.loadDate(viewDate.value)
  loadingHistory.value = false
}

function goPrev() {
  const d = new Date(viewDate.value + 'T12:00:00')
  d.setDate(d.getDate() - 1)
  viewDate.value = localDateStr(d)
}

function goNext() {
  if (isToday.value) return
  const d = new Date(viewDate.value + 'T12:00:00')
  d.setDate(d.getDate() + 1)
  const today = todayDateString()
  viewDate.value = localDateStr(d) > today ? today : localDateStr(d)
}

watch(viewDate, fetchViewDate)

let _swipeX = 0
let _swipeY = 0
function onTouchStart(e: TouchEvent) {
  _swipeX = e.touches[0].clientX
  _swipeY = e.touches[0].clientY
}
function onTouchEnd(e: TouchEvent) {
  const dx = e.changedTouches[0].clientX - _swipeX
  const dy = e.changedTouches[0].clientY - _swipeY
  if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.5) return
  if (dx < 0) goNext()
  else goPrev()
}

async function handleSubjectSelect(id: string) {
  if (timerStore.mode === 'idle' || timerStore.mode === 'break') {
    await timerStore.startStudy(id)
    lastSubjectId.value = id
    await sessionsStore.loadToday()
    return
  }
  await switchSubject(id)
}

async function handleStop() {
  if (timerStore.mode === 'break') {
    lastSubjectId.value = timerStore.activeSubjectId ?? lastSubjectId.value
  } else {
    lastSubjectId.value = timerStore.activeSubjectId
  }
  await timerStore.stop()
  await sessionsStore.loadToday()
}

async function handleBreak() {
  lastSubjectId.value = timerStore.activeSubjectId
  await timerStore.startBreak()
  await sessionsStore.loadToday()
}

async function handleContinue() {
  if (!lastSubjectId.value) return
  await timerStore.startStudy(lastSubjectId.value)
  await sessionsStore.loadToday()
}

async function switchSubject(id: string) {
  if (id === timerStore.activeSubjectId) return
  lastSubjectId.value = id
  await timerStore.stop()
  await sessionsStore.loadToday()
  await timerStore.startStudy(id)
}

async function deleteSession(id: string) {
  if (!confirm('Excluir este registro?')) return
  await sessionsStore.remove(id)
  if (isToday.value) await sessionsStore.loadToday()
  else viewSessions.value = await sessionsStore.loadDate(viewDate.value)
}

async function onSessionSaved() {
  editingSession.value = null
  showAddModal.value = false
  if (isToday.value) await sessionsStore.loadToday()
  else viewSessions.value = await sessionsStore.loadDate(viewDate.value)
}

function getSubject(id?: string) {
  return id ? subjectsStore.getSubject(id) : undefined
}

function fmt(ts: number) {
  return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

onMounted(async () => {
  timerStore.load()
  if (timerStore.activeSubjectId) lastSubjectId.value = timerStore.activeSubjectId
  await sessionsStore.loadToday()
})
</script>
