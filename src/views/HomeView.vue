<template>
  <div class="min-h-screen flex flex-col akoma-page" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd">

    <header class="flex items-center justify-between mb-5 reveal">
      <div>
        <span class="page-label">{{ greeting }}</span>
        <h1 class="page-title">StudyFlow</h1>
      </div>
      <span class="text-xs font-semibold text-muted">{{ dateLabel }}</span>
    </header>

    <div class="grid grid-cols-2 gap-3 mb-4 reveal reveal-d1">
      <div class="card p-3 flex flex-col gap-0.5">
        <span class="text-[10px] font-bold text-accent uppercase tracking-wider">Estudo</span>
        <span class="font-display text-2xl font-bold text-primary tabular-nums">{{ totalStudyFormatted }}</span>
        <span class="text-[10px] text-muted">{{ isToday ? 'hoje' : dateNavLabel.toLowerCase() }}</span>
      </div>
      <div class="card p-3 flex flex-col gap-0.5">
        <span class="text-[10px] font-bold uppercase tracking-wider" style="color: var(--cat-3)">{{ isToday ? 'Pausa' : 'Sessões' }}</span>
        <span class="font-display text-2xl font-bold text-primary tabular-nums">{{ isToday ? timerStore.breakFormatted : displaySessions.length }}</span>
        <span class="text-[10px] text-muted">{{ isToday ? 'hoje' : dateNavLabel.toLowerCase() }}</span>
      </div>
    </div>

    <main class="flex-1 overflow-y-auto pb-4 space-y-3 reveal reveal-d2">

      <!-- ── Timer controls: only when viewing today ──────────── -->
      <Transition name="fade" mode="out-in">
        <div v-if="isToday" key="today">
        <Transition name="fade" mode="out-in">
        <div v-if="timerStore.mode === 'idle'" key="idle">
          <button
            @click="sheetOpen = true"
            class="w-full py-3 btn-primary text-sm flex items-center justify-center gap-2 tap-scale"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
            Iniciar Estudo
          </button>
        </div>

        <!-- ── BREAK mode ─────────────────────────────────────── -->
        <div v-else-if="timerStore.mode === 'break'" key="break">
          <div class="card p-5 text-center space-y-4">
            <div>
              <p class="text-[11px] font-semibold text-amber-500 uppercase tracking-wider mb-1">☕ Em pausa</p>
              <span class="font-sans text-5xl font-bold text-primary tabular-nums">{{ timerStore.breakFormatted }}</span>
            </div>
            <p class="text-xs text-muted">Descanse um pouco.</p>
            <div class="flex gap-2">
              <button
                v-if="lastSubjectId"
                @click="timerStore.startStudy(lastSubjectId!)"
                class="flex-1 py-3 btn-primary text-sm flex items-center justify-center gap-2 tap-scale"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
                Continuar
              </button>
              <button
                @click="sheetOpen = true"
                class="flex-1 py-3 btn-secondary text-sm tap-scale"
              >
                Trocar matéria
              </button>
              <button
                @click="timerStore.stop(); loadToday()"
                class="px-4 py-3 btn-secondary text-muted text-sm tap-scale"
              >
                Encerrar
              </button>
            </div>
          </div>
        </div>

        <!-- ── STUDY / PAUSED ─────────────────────────────────── -->
        <div v-else key="active">
          <div class="card p-4 space-y-4">

            <!-- Subject row -->
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-akoma flex items-center justify-center text-xl flex-shrink-0"
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
                class="text-xs text-muted px-2 py-1 rounded-akoma btn-icon tap-scale"
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
                  class="w-6 h-6 btn-icon tap-scale"
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
                class="py-3 btn-secondary flex flex-col items-center gap-1 text-muted tap-scale"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>
                <span class="text-[10px] font-semibold">Parar</span>
              </button>

              <button
                @click="timerStore.isRunning ? timerStore.pause() : timerStore.resume()"
                class="py-3 rounded-akoma font-bold text-white flex flex-col items-center gap-1 tap-scale"
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
                class="py-3 btn-secondary flex flex-col items-center gap-1 tap-scale"
                style="color: var(--cat-3)"
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
            class="w-7 h-7 btn-icon tap-scale"
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
            :class="isToday ? 'text-faint opacity-30 cursor-default' : 'tap-scale'"
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
        <div v-else-if="timelineSessions.length === 0" class="py-8 text-center text-faint text-sm card">
          Nenhuma sessão neste dia
        </div>

        <StatsTimeline
          v-else
          :sessions="timelineSessions"
          :show-title="false"
          @edit="editingSession = $event"
          @delete="deleteSession"
        />
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
      @saved="onSessionSaved"
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
import StatsTimeline from '@/components/stats/StatsTimeline.vue'
import { useFaceDownFocus } from '@/composables/useFaceDownFocus'
import { formatTimer, localDateStr, todayDateString } from '@/types'
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

const timelineSessions = computed(() =>
  [...displaySessions.value].sort((a, b) => a.startTime - b.startTime)
)

async function onSessionSaved() {
  editingSession.value = null
  if (isToday.value) await sessionsStore.loadToday()
  else viewSessions.value = await sessionsStore.loadDate(viewDate.value)
}

async function deleteSession(id: string) {
  if (!confirm('Excluir esta sessão?')) return
  await sessionsStore.remove(id)
  if (isToday.value) await sessionsStore.loadToday()
  else viewSessions.value = await sessionsStore.loadDate(viewDate.value)
}

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
