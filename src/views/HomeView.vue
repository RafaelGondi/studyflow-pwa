<template>
  <div class="min-h-screen bg-app-bg flex flex-col">

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
        <span class="text-[10px] text-muted">hoje</span>
      </div>
      <div class="rounded-md bg-app-card p-3 flex flex-col gap-0.5">
        <span class="text-[10px] font-semibold text-amber-500 uppercase tracking-wider">Pausa</span>
        <span class="font-sans text-xl font-bold text-primary tabular-nums">{{ timerStore.breakFormatted }}</span>
        <span class="text-[10px] text-muted">hoje</span>
      </div>
    </div>

    <main class="flex-1 overflow-y-auto px-4 pb-28 space-y-3">

      <!-- ── IDLE ───────────────────────────────────────────── -->
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
              <p class="text-xs text-muted mt-2">sessão atual</p>
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

      <!-- ── Session log ─────────────────────────────────────── -->
      <div v-if="sessionsStore.todaySessions.length > 0" class="pt-5">
        <p class="text-xs text-muted mb-3 px-1">hoje</p>
        <template v-for="(item, index) in sessionLog" :key="item.id ?? item.type + index">

          <!-- Break gap -->
          <div v-if="item.type === 'gap'" class="pl-4 py-1.5">
            <span class="text-xs text-muted">☕ {{ item.label }} de intervalo</span>
          </div>

          <!-- Session row -->
          <div v-else class="flex items-start gap-3 py-2.5">
            <div
              class="w-1 self-stretch rounded-full mt-1 flex-shrink-0"
              :style="{ background: getSubject(item.subjectId)?.color ?? 'var(--accent-color)' }"
            />
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2">
                <p class="text-sm font-semibold text-primary truncate">{{ getSubject(item.subjectId)?.name ?? 'Matéria' }}</p>
                <span class="text-sm font-semibold flex-shrink-0" :style="{ color: getSubject(item.subjectId)?.color ?? 'var(--accent-color)' }">
                  {{ formatDuration(item.duration) }}
                </span>
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

    <SubjectBottomSheet
      v-model="sheetOpen"
      :active-id="timerStore.activeSubjectId"
      @select="handleSheetSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTimerStore } from '@/stores/timer'
import { useSessionsStore } from '@/stores/sessions'
import { useSubjectsStore } from '@/stores/subjects'
import SubjectBottomSheet from '@/components/home/SubjectBottomSheet.vue'
import { formatDuration, formatTimer } from '@/types'

const timerStore = useTimerStore()
const sessionsStore = useSessionsStore()
const subjectsStore = useSubjectsStore()

const lastSubjectId = ref<string | null>(null)
const sheetOpen = ref(false)

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

const totalStudyFormatted = computed(() =>
  formatTimer(sessionsStore.todayTotalSeconds + timerStore.studyElapsedSeconds)
)

const sessionLog = computed(() => {
  const sessions = [...sessionsStore.todaySessions].sort((a, b) => a.startTime - b.startTime)
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
