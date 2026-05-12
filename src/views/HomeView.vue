<template>
  <div class="min-h-screen bg-app-bg flex flex-col">

    <!-- Header -->
    <header class="px-4 pt-6 pb-4">
      <div class="flex items-end justify-between">
        <div>
          <p class="text-sm text-muted">{{ greeting }}</p>
          <div class="flex items-baseline gap-3 mt-0.5">
            <span class="font-mono text-2xl font-bold text-primary tabular-nums">{{ totalStudyFormatted }}</span>
            <span class="text-sm text-muted">de estudo hoje</span>
          </div>
        </div>
        <span class="text-xs text-muted pb-1">{{ dateLabel }}</span>
      </div>
    </header>

    <main class="flex-1 overflow-y-auto px-4 pb-28 space-y-4">

      <!-- ── IDLE ───────────────────────────────────────────── -->
      <Transition name="fade" mode="out-in">
        <div v-if="timerStore.mode === 'idle'" key="idle" class="pt-2">
          <button
            @click="sheetOpen = true"
            class="w-full py-4 rounded-xl bg-blue-500 font-semibold text-white flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] text-base"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
            Iniciar Estudo
          </button>
        </div>

        <!-- ── BREAK mode ─────────────────────────────────────── -->
        <div v-else-if="timerStore.mode === 'break'" key="break" class="pt-2 space-y-6">
          <div class="space-y-1">
            <p class="text-sm text-muted">em pausa</p>
            <span class="font-mono text-5xl font-bold text-primary tabular-nums">{{ timerStore.breakFormatted }}</span>
          </div>
          <div class="flex gap-2">
            <button
              v-if="lastSubjectId"
              @click="timerStore.startStudy(lastSubjectId!)"
              class="flex-1 py-3 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all bg-blue-500"
            >
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
              Continuar
            </button>
            <button
              @click="sheetOpen = true"
              class="flex-1 py-3 rounded-xl bg-app-card text-primary text-sm font-medium active:scale-[0.98] transition-all"
            >
              Trocar matéria
            </button>
            <button
              @click="timerStore.stop(); loadToday()"
              class="px-4 py-3 rounded-xl bg-app-card text-muted text-sm font-medium active:scale-[0.98] transition-all"
            >
              Encerrar
            </button>
          </div>
        </div>

        <!-- ── STUDY / PAUSED ─────────────────────────────────── -->
        <div v-else key="active" class="pt-2 space-y-6">

          <!-- Subject + status -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span class="text-2xl">{{ activeSubject?.icon ?? '📚' }}</span>
              <div>
                <p class="font-semibold text-primary leading-tight">{{ activeSubject?.name ?? 'Estudo' }}</p>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <div
                    class="w-1.5 h-1.5 rounded-full"
                    :class="timerStore.isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'"
                  />
                  <span class="text-xs text-muted">{{ timerStore.isRunning ? 'em andamento' : 'pausado' }}</span>
                </div>
              </div>
            </div>
            <button
              @click="sheetOpen = true"
              class="text-xs text-muted underline underline-offset-2 decoration-app-border"
            >
              trocar
            </button>
          </div>

          <!-- Timer -->
          <div
            class="font-mono tabular-nums leading-none"
            :style="{ color: activeSubject?.color ?? '#3b82f6', fontSize: 'clamp(4rem, 20vw, 5.5rem)', fontWeight: 700 }"
          >
            {{ timerStore.studyFormatted }}
          </div>

          <!-- Controls -->
          <div class="flex items-center gap-3">
            <!-- Stop -->
            <button
              @click="handleStop"
              class="w-11 h-11 rounded-full bg-app-card flex items-center justify-center text-muted active:scale-90 transition-all"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>
            </button>

            <!-- Pause / Resume — main -->
            <button
              @click="timerStore.isRunning ? timerStore.pause() : timerStore.resume()"
              class="flex-1 h-14 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
              :style="{ background: timerStore.isRunning ? (activeSubject?.color ?? '#3b82f6') : '#10b981' }"
            >
              <svg v-if="timerStore.isRunning" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>
              </svg>
              <svg v-else class="w-5 h-5 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21"/>
              </svg>
              {{ timerStore.isRunning ? 'Pausar' : 'Retomar' }}
            </button>

            <!-- Break -->
            <button
              @click="handleBreak"
              class="w-11 h-11 rounded-full bg-app-card flex items-center justify-center text-amber-500 active:scale-90 transition-all text-lg"
            >
              ☕
            </button>
          </div>
        </div>
      </Transition>

      <!-- ── Session log ─────────────────────────────────────── -->
      <div v-if="sessionsStore.todaySessions.length > 0" class="pt-2">
        <p class="text-xs text-muted mb-3">hoje</p>
        <div class="space-y-0">
          <template v-for="(item, index) in sessionLog" :key="item.id ?? item.type + index">

            <!-- Break gap -->
            <div v-if="item.type === 'gap'" class="flex items-center gap-3 py-2 pl-2">
              <div class="w-px self-stretch bg-app-border ml-3" />
              <span class="text-xs text-muted">☕ {{ item.label }} de intervalo</span>
            </div>

            <!-- Session row -->
            <div v-else class="flex items-start gap-3 py-2.5">
              <div
                class="w-1 self-stretch rounded-full mt-1 flex-shrink-0"
                :style="{ background: getSubject(item.subjectId)?.color ?? '#3b82f6' }"
              />
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2">
                  <p class="text-sm font-semibold text-primary truncate">{{ getSubject(item.subjectId)?.name ?? 'Matéria' }}</p>
                  <span class="text-sm font-semibold flex-shrink-0" :style="{ color: getSubject(item.subjectId)?.color ?? '#3b82f6' }">
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

// Session log with gap indicators
const sessionLog = computed(() => {
  const sessions = [...sessionsStore.todaySessions].sort((a, b) => a.startTime - b.startTime)
  const result: Array<any> = []
  for (let i = 0; i < sessions.length; i++) {
    result.push({ type: 'session', ...sessions[i] })
    if (i < sessions.length - 1) {
      const gapMs = sessions[i + 1].startTime - sessions[i].endTime
      if (gapMs > 60_000) { // only show gaps > 1 min
        result.push({ type: 'gap', label: formatDuration(Math.floor(gapMs / 1000)) })
      }
    }
  }
  return result.reverse() // newest first
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

onMounted(() => {
  timerStore.load()
  if (timerStore.activeSubjectId) lastSubjectId.value = timerStore.activeSubjectId
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-up-enter-active { transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }
.slide-up-enter-from { opacity: 0; transform: translateY(10px); }
</style>
