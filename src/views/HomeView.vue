<template>
  <div class="min-h-screen bg-app-bg flex flex-col" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd">

    <!-- Header -->
    <header class="flex items-center justify-between px-4 pt-5 pb-2">
      <div>
        <p class="text-[11px] text-muted font-medium uppercase tracking-widest">{{ greeting }}</p>
        <h1 class="text-lg font-bold text-primary">StudyFlow</h1>
      </div>
      <span class="text-xs text-muted">{{ dateLabel }}</span>
    </header>

    <!-- Dual stats bar -->
    <div class="grid grid-cols-2 gap-2 px-4 pb-3">
      <div class="rounded-md bg-app-card p-3 flex flex-col gap-0.5">
        <span class="text-[10px] font-semibold text-accent uppercase tracking-wider">Estudo</span>
        <span class="font-sans text-xl font-bold text-primary tabular-nums">{{ totalStudyFormatted }}</span>
        <span class="text-[10px] text-muted">{{ isToday ? 'hoje' : dateNavLabel.toLowerCase() }}</span>
      </div>
      <div class="rounded-md bg-app-card p-3 flex flex-col gap-0.5">
        <span class="text-[10px] font-semibold text-amber-500 uppercase tracking-wider">{{ isToday ? 'Pausa' : 'Sessões' }}</span>
        <span class="font-sans text-xl font-bold text-primary tabular-nums">{{ isToday ? timerStore.breakFormatted : displaySessions.length }}</span>
        <span class="text-[10px] text-muted">{{ isToday ? 'hoje' : dateNavLabel.toLowerCase() }}</span>
      </div>
    </div>

    <main class="flex-1 overflow-y-auto px-4 pb-28 space-y-3">

      <!-- ── Timer controls: only when viewing today ──────────── -->
      <Transition name="fade" mode="out-in">
        <div v-if="isToday" key="today">
        <Transition name="fade" mode="out-in">
        <div v-if="timerStore.mode === 'idle'" key="idle">
          <button
            @click="sheetOpen = true"
            class="w-full py-3 rounded-md bg-accent font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
            Iniciar Estudo
          </button>
        </div>

        <!-- ── BREAK mode ─────────────────────────────────────── -->
        <div v-else-if="timerStore.mode === 'break'" key="break">
          <div class="rounded-md bg-app-card p-5 text-center space-y-4">
            <div>
              <p class="text-[11px] font-semibold text-amber-500 uppercase tracking-wider mb-1">☕ Em pausa</p>
              <span class="font-sans text-5xl font-bold text-primary tabular-nums">{{ timerStore.breakFormatted }}</span>
            </div>
            <p class="text-xs text-muted">Descanse um pouco.</p>
            <div class="flex gap-2">
              <button
                v-if="lastSubjectId"
                @click="timerStore.startStudy(lastSubjectId!)"
                class="flex-1 py-3 rounded-md font-bold text-white text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
                style="background: #44403c"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
                Continuar
              </button>
              <button
                @click="sheetOpen = true"
                class="flex-1 py-3 rounded-md bg-app-elevated text-primary text-sm font-semibold active:scale-95 transition-all"
              >
                Trocar matéria
              </button>
              <button
                @click="timerStore.stop(); loadToday()"
                class="px-4 py-3 rounded-md bg-app-elevated text-muted text-sm font-semibold active:scale-95 transition-all"
              >
                Encerrar
              </button>
            </div>
          </div>
        </div>

        <!-- ── STUDY / PAUSED ─────────────────────────────────── -->
        <div v-else key="active">
          <div class="rounded-md bg-app-card p-4 space-y-4">

            <!-- Subject row -->
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-sm flex items-center justify-center text-xl flex-shrink-0"
                :style="{ background: `${activeSubject?.color ?? 'var(--accent-color)'}18` }"
              >
                {{ activeSubject?.icon ?? '📚' }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-primary truncate">{{ activeSubject?.name ?? 'Estudo' }}</p>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <div
                    class="w-1.5 h-1.5 rounded-full"
                    :class="timerStore.isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'"
                  />
                  <span class="text-xs" :class="timerStore.isRunning ? 'text-emerald-500' : 'text-amber-500'">
                    {{ timerStore.isRunning ? 'Estudando' : 'Pausado' }}
                  </span>
                </div>
              </div>
              <button
                @click="sheetOpen = true"
                class="text-xs text-muted px-2 py-1 rounded-sm bg-app-elevated transition-colors"
              >
                trocar
              </button>
            </div>

            <!-- Timer display -->
            <div class="text-center py-1">
              <div
                class="font-sans text-6xl font-bold tabular-nums leading-none"
                :style="{ color: activeSubject?.color ?? 'var(--accent-color)' }"
              >
                {{ timerStore.studyFormatted }}
              </div>
              <div class="flex items-center justify-center gap-2 mt-2">
                <p class="text-xs text-muted">sessão atual</p>
                <button
                  @click="focusMode = true"
                  class="w-6 h-6 rounded-sm bg-app-elevated flex items-center justify-center text-muted hover:text-primary transition-colors"
                  title="Modo foco"
                >
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Control buttons -->
            <div class="grid grid-cols-3 gap-2">
              <button
                @click="handleStop"
                class="py-3 rounded-md bg-app-elevated flex flex-col items-center gap-1 text-muted active:scale-95 transition-all"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>
                <span class="text-[10px] font-semibold">Parar</span>
              </button>

              <button
                @click="timerStore.isRunning ? timerStore.pause() : timerStore.resume()"
                class="py-3 rounded-md font-bold text-white flex flex-col items-center gap-1 transition-all active:scale-95"
                :style="{ background: timerStore.isRunning ? (activeSubject?.color ?? 'var(--accent-color)') : '#10b981' }"
              >
                <svg v-if="timerStore.isRunning" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>
                </svg>
                <svg v-else class="w-4 h-4 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5,3 19,12 5,21"/>
                </svg>
                <span class="text-[10px] font-semibold">{{ timerStore.isRunning ? 'Pausar' : 'Retomar' }}</span>
              </button>

              <button
                @click="handleBreak"
                class="py-3 rounded-md bg-app-elevated flex flex-col items-center gap-1 text-amber-500 transition-all active:scale-95"
              >
                <span class="text-base leading-none">☕</span>
                <span class="text-[10px] font-semibold">Break</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
        </div>
        <div v-else key="past" />
      </Transition>

      <!-- ── Session log ─────────────────────────────────────── -->
      <div class="pt-5">
        <!-- Date navigator -->
        <div class="flex items-center justify-between px-1 mb-3">
          <button
            @click="goPrev"
            class="w-7 h-7 rounded-md bg-app-elevated flex items-center justify-center text-muted active:scale-90 transition-all"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>

          <span class="text-xs font-semibold text-muted">{{ dateNavLabel }}</span>

          <button
            @click="goNext"
            :disabled="isToday"
            class="w-7 h-7 rounded-md bg-app-elevated flex items-center justify-center transition-all"
            :class="isToday ? 'text-faint opacity-30 cursor-default' : 'text-muted active:scale-90'"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>

        <!-- Loading spinner -->
        <div v-if="loadingHistory" class="py-6 flex justify-center">
          <div class="w-5 h-5 rounded-full border-2 border-app-elevated border-t-accent animate-spin" />
        </div>

        <!-- Empty state -->
        <div v-else-if="displaySessions.length === 0" class="py-8 text-center text-faint text-sm">
          Nenhuma sessão neste dia
        </div>

        <!-- Sessions -->
        <template v-else v-for="(item, index) in sessionLog" :key="item.id ?? item.type + index">

          <!-- Break gap -->
          <div v-if="item.type === 'gap'" class="pl-4 py-1.5">
            <span class="text-xs text-muted">☕ {{ item.label }} de intervalo</span>
          </div>

          <!-- Session row -->
          <div v-else class="flex items-start gap-3 py-2.5 group">
            <div
              class="w-1 self-stretch rounded-full mt-1 flex-shrink-0"
              :style="{ background: getSubject(item.subjectId)?.color ?? 'var(--accent-color)' }"
            />
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2">
                <p class="text-sm font-semibold text-primary truncate">{{ getSubject(item.subjectId)?.name ?? 'Matéria' }}</p>
                <div class="flex items-center gap-1.5 flex-shrink-0">
                  <span class="text-sm font-semibold" :style="{ color: getSubject(item.subjectId)?.color ?? 'var(--accent-color)' }">
                    {{ formatDuration(item.duration) }}
                  </span>
                  <button
                    @click="editingSession = item"
                    class="w-6 h-6 rounded-sm flex items-center justify-center text-faint hover:text-primary hover:bg-app-elevated transition-all opacity-0 group-hover:opacity-100"
                  >
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div class="text-[11px] text-muted mt-0.5 flex flex-wrap gap-x-1.5 gap-y-0.5">
                <template v-if="item.segments?.length > 1">
                  <template v-for="(seg, i) in item.segments" :key="i">
                    <span>{{ fmt(seg.start) }} – {{ fmt(seg.end) }}</span>
                    <span v-if="i < item.segments.length - 1" class="text-amber-400">
                      ⏸ {{ formatDuration(Math.round((item.segments[i+1].start - seg.end) / 1000)) }}
                    </span>
                  </template>
                </template>
                <span v-else>{{ fmt(item.startTime) }} – {{ fmt(item.endTime) }}</span>
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

    <SubjectBottomSheet
      v-model="sheetOpen"
      :active-id="timerStore.activeSubjectId"
      @select="handleSheetSelect"
    />

    <SessionEditModal
      :show="!!editingSession"
      :session="editingSession"
      @close="editingSession = null"
      @saved="editingSession = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useTimerStore } from '@/stores/timer'
import { useSessionsStore } from '@/stores/sessions'
import { useSubjectsStore } from '@/stores/subjects'
import SubjectBottomSheet from '@/components/home/SubjectBottomSheet.vue'
import FocusMode from '@/components/home/FocusMode.vue'
import SessionEditModal from '@/components/sessions/SessionEditModal.vue'
import { useFaceDownFocus } from '@/composables/useFaceDownFocus'
import { formatDuration, formatTimer, localDateStr, todayDateString } from '@/types'
import type { StudySession } from '@/types'

const timerStore = useTimerStore()
const sessionsStore = useSessionsStore()
const subjectsStore = useSubjectsStore()

const lastSubjectId = ref<string | null>(null)
const sheetOpen = ref(false)
const focusMode = ref(false)
const editingSession = ref<StudySession | null>(null)

// ── Gesto de foco (giroscópio) ─────────────────────────────────────────────
const { isFaceDown } = useFaceDownFocus()
watch(isFaceDown, (faceDown) => {
  if (faceDown && timerStore.mode !== 'idle') {
    focusMode.value = true
  }
})

// ── Date navigation ────────────────────────────────────────────────────────
const viewDate = ref(todayDateString())
const viewSessions = ref<StudySession[]>([])
const loadingHistory = ref(false)

const isToday = computed(() => viewDate.value === todayDateString())

const displaySessions = computed<StudySession[]>(() =>
  isToday.value ? sessionsStore.todaySessions : viewSessions.value
)

const dateNavLabel = computed(() => {
  if (isToday.value) return 'Hoje'
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (viewDate.value === localDateStr(yesterday)) return 'Ontem'
  const d = new Date(viewDate.value + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
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
  viewDate.value = localDateStr(d)
}

watch(viewDate, fetchViewDate)

// ── Swipe para navegar entre dias ──────────────────────────────────────────
let _swipeX = 0
let _swipeY = 0

function onTouchStart(e: TouchEvent) {
  _swipeX = e.touches[0].clientX
  _swipeY = e.touches[0].clientY
}

function onTouchEnd(e: TouchEvent) {
  const dx = e.changedTouches[0].clientX - _swipeX
  const dy = e.changedTouches[0].clientY - _swipeY
  // Ignora se movimento vertical domina ou se não atingiu o limiar
  if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.5) return
  if (dx < 0) goNext()  // swipe para a esquerda → dia seguinte
  else goPrev()          // swipe para a direita  → dia anterior
}

// ── ─────────────────────────────────────────────────────────────────────────

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

const totalStudyFormatted = computed(() => {
  if (isToday.value) {
    return formatTimer(sessionsStore.todayTotalSeconds + timerStore.studyElapsedSeconds)
  }
  const total = displaySessions.value.reduce((acc, s) => acc + s.duration, 0)
  return formatTimer(total)
})

const sessionLog = computed(() => {
  const sessions = [...displaySessions.value].sort((a, b) => a.startTime - b.startTime)
  const result: Array<any> = []
  for (let i = 0; i < sessions.length; i++) {
    result.push({ type: 'session', ...sessions[i] })
    if (i < sessions.length - 1) {
      const gapMs = sessions[i + 1].startTime - sessions[i].endTime
      if (gapMs > 60_000) {
        result.push({ type: 'gap', label: formatDuration(Math.floor(gapMs / 1000)) })
      }
    }
  }
  return result.reverse()
})

function handleSheetSelect(id: string) {
  if (timerStore.mode === 'idle' || timerStore.mode === 'break') {
    timerStore.startStudy(id)
  } else {
    switchSubject(id)
  }
}

async function handleStop() {
  lastSubjectId.value = timerStore.activeSubjectId
  await timerStore.stop()
  await sessionsStore.loadToday()
}

async function handleBreak() {
  lastSubjectId.value = timerStore.activeSubjectId
  await timerStore.startBreak()
  await sessionsStore.loadToday()
}

async function switchSubject(id: string) {
  if (id === timerStore.activeSubjectId) return
  await timerStore.stop()
  await sessionsStore.loadToday()
  timerStore.startStudy(id)
}

async function loadToday() {
  await sessionsStore.loadToday()
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

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-up-enter-active { transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }
.slide-up-enter-from { opacity: 0; transform: translateY(10px); }
</style>
