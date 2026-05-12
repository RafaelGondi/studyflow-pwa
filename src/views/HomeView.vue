<template>
  <div class="min-h-screen bg-app-bg flex flex-col">

    <!-- Header -->
    <header class="flex items-center justify-between px-5 pt-6 pb-3">
      <div>
        <p class="text-xs text-muted font-medium uppercase tracking-widest">{{ greeting }}</p>
        <h1 class="text-xl font-bold text-primary">StudyFlow</h1>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs text-muted">{{ dateLabel }}</span>
        <ThemeToggle />
      </div>
    </header>

    <!-- Dual stats bar -->
    <div class="grid grid-cols-2 gap-2 px-4 pb-3">
      <div class="rounded-2xl p-3 flex flex-col gap-0.5" style="background: linear-gradient(135deg, #8b5cf620, #6366f110); border: 1px solid #8b5cf630">
        <span class="text-[10px] font-bold text-violet-500 uppercase tracking-wider">📚 Estudo</span>
        <span class="font-mono text-xl font-bold text-primary tabular-nums">{{ totalStudyFormatted }}</span>
        <span class="text-[10px] text-muted">hoje</span>
      </div>
      <div class="rounded-2xl p-3 flex flex-col gap-0.5" style="background: linear-gradient(135deg, #f59e0b20, #f97316 10%); border: 1px solid #f59e0b30; background: linear-gradient(135deg, #f59e0b15, #f9731608); border: 1px solid #f59e0b25">
        <span class="text-[10px] font-bold text-amber-500 uppercase tracking-wider">☕ Pausa</span>
        <span class="font-mono text-xl font-bold text-primary tabular-nums">{{ timerStore.breakFormatted }}</span>
        <span class="text-[10px] text-muted">hoje</span>
      </div>
    </div>

    <main class="flex-1 overflow-y-auto px-4 pb-28 space-y-4">

      <!-- ── IDLE: subject selector ─────────────────────────── -->
      <Transition name="fade" mode="out-in">
        <div v-if="timerStore.mode === 'idle'" key="idle" class="space-y-4">
          <SubjectSelector :selected="selectedSubjectId" @select="handleSelect" />
          <Transition name="slide-up">
            <button
              v-if="selectedSubjectId"
              @click="timerStore.startStudy(selectedSubjectId!)"
              class="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all duration-200 active:scale-95"
              :style="{
                background: `linear-gradient(135deg, ${selectedSubject?.color ?? '#8b5cf6'}, ${selectedSubject?.color ?? '#8b5cf6'}aa)`,
                boxShadow: `0 8px 20px ${selectedSubject?.color ?? '#8b5cf6'}40`,
              }"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
              Iniciar Estudo
            </button>
          </Transition>
        </div>

        <!-- ── BREAK mode ─────────────────────────────────────── -->
        <div v-else-if="timerStore.mode === 'break'" key="break" class="space-y-4">
          <div class="rounded-2xl border p-5 text-center space-y-4" style="background: linear-gradient(135deg, #f59e0b12, #f9731608); border-color: #f59e0b40">
            <div>
              <p class="text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">☕ Em pausa</p>
              <span class="font-mono text-5xl font-bold text-primary tabular-nums">{{ timerStore.breakFormatted }}</span>
            </div>
            <p class="text-xs text-muted">Descanse um pouco. Clique em Estudo quando quiser voltar.</p>
            <div class="flex gap-2">
              <button
                v-if="selectedSubjectId || lastSubjectId"
                @click="timerStore.startStudy(selectedSubjectId ?? lastSubjectId!)"
                class="flex-1 py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
                style="background: linear-gradient(135deg, #8b5cf6, #6366f1); box-shadow: 0 4px 16px #8b5cf640"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
                Voltar ao Estudo
              </button>
              <button
                @click="timerStore.stop(); loadToday()"
                class="px-4 py-3 rounded-xl bg-app-elevated border border-app-border text-muted text-sm font-semibold active:scale-95 transition-all"
              >
                Encerrar
              </button>
            </div>
          </div>
          <SubjectSelector :selected="selectedSubjectId ?? lastSubjectId" @select="handleSelect" />
        </div>

        <!-- ── STUDY / PAUSED ─────────────────────────────────── -->
        <div v-else key="active" class="space-y-4">
          <!-- Active subject + timer -->
          <div class="rounded-2xl border border-app-border bg-app-card p-5 space-y-5">

            <!-- Subject row -->
            <div class="flex items-center gap-3">
              <div
                class="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                :style="{ background: `${activeSubject?.color ?? '#8b5cf6'}22` }"
              >
                {{ activeSubject?.icon ?? '📚' }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-bold text-primary truncate">{{ activeSubject?.name ?? 'Estudo' }}</p>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <div
                    class="w-1.5 h-1.5 rounded-full"
                    :class="timerStore.isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'"
                  />
                  <span class="text-xs font-medium" :class="timerStore.isRunning ? 'text-emerald-500' : 'text-amber-500'">
                    {{ timerStore.isRunning ? 'Estudando' : 'Pausado' }}
                  </span>
                </div>
              </div>
              <!-- change subject -->
              <button
                @click="showSubjectPicker = !showSubjectPicker"
                class="text-xs text-muted hover:text-primary px-2 py-1 rounded-lg bg-app-elevated transition-colors"
              >
                trocar
              </button>
            </div>

            <!-- Timer display -->
            <div class="text-center py-2">
              <div
                class="font-mono text-6xl font-bold tabular-nums leading-none"
                :style="{ color: activeSubject?.color ?? '#8b5cf6' }"
              >
                {{ timerStore.studyFormatted }}
              </div>
              <p class="text-xs text-muted mt-2">sessão atual</p>
            </div>

            <!-- Control buttons -->
            <div class="grid grid-cols-3 gap-2">
              <!-- Stop -->
              <button
                @click="handleStop"
                class="py-3 rounded-xl bg-app-elevated border border-app-border flex flex-col items-center gap-1 text-muted hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/30 transition-all active:scale-95"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>
                <span class="text-[10px] font-semibold">Parar</span>
              </button>

              <!-- Study / Resume (main action) -->
              <button
                @click="timerStore.isRunning ? timerStore.pause() : timerStore.resume()"
                class="py-3 rounded-xl font-bold text-white flex flex-col items-center gap-1 transition-all active:scale-95"
                :style="{
                  background: timerStore.isRunning
                    ? `linear-gradient(135deg, ${activeSubject?.color ?? '#8b5cf6'}, ${activeSubject?.color ?? '#8b5cf6'}aa)`
                    : `linear-gradient(135deg, #10b981, #059669)`,
                  boxShadow: timerStore.isRunning
                    ? `0 4px 12px ${activeSubject?.color ?? '#8b5cf6'}40`
                    : '0 4px 12px #10b98140',
                }"
              >
                <svg v-if="timerStore.isRunning" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>
                </svg>
                <svg v-else class="w-4 h-4 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5,3 19,12 5,21"/>
                </svg>
                <span class="text-[10px] font-semibold">{{ timerStore.isRunning ? 'Pausar' : 'Retomar' }}</span>
              </button>

              <!-- Break -->
              <button
                @click="handleBreak"
                class="py-3 rounded-xl bg-app-elevated border border-app-border flex flex-col items-center gap-1 text-amber-500 hover:bg-amber-500/10 hover:border-amber-500/30 transition-all active:scale-95"
              >
                <span class="text-base leading-none">☕</span>
                <span class="text-[10px] font-semibold">Break</span>
              </button>
            </div>
          </div>

          <!-- Subject picker (expandable) -->
          <Transition name="slide-up">
            <div v-if="showSubjectPicker">
              <SubjectSelector :selected="timerStore.activeSubjectId" @select="switchSubject" />
            </div>
          </Transition>
        </div>
      </Transition>

      <!-- ── Session log ─────────────────────────────────────── -->
      <div v-if="sessionsStore.todaySessions.length > 0" class="space-y-1">
        <div class="flex items-center justify-between px-1 mb-2">
          <h2 class="text-xs font-bold text-muted uppercase tracking-wider">Sessões de hoje</h2>
          <span class="text-xs text-faint">{{ sessionsStore.todayTotalSeconds > 0 ? totalStudyFormatted : '—' }}</span>
        </div>

        <template v-for="(item, index) in sessionLog" :key="item.id ?? item.type + index">
          <!-- Break gap indicator -->
          <div v-if="item.type === 'gap'" class="flex items-center gap-2 py-1 px-2">
            <div class="flex-1 h-px bg-app-border" />
            <span class="text-[10px] text-amber-500 font-semibold flex items-center gap-1">
              <span>☕</span>
              {{ item.label }}
            </span>
            <div class="flex-1 h-px bg-app-border" />
          </div>

          <!-- Session row -->
          <div
            v-else
            class="flex items-center gap-3 p-3 rounded-xl bg-app-card border border-app-border"
          >
            <div
              class="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
              :style="{ background: `${getSubject(item.subjectId)?.color ?? '#8b5cf6'}20` }"
            >
              {{ getSubject(item.subjectId)?.icon ?? '📚' }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-primary truncate">{{ getSubject(item.subjectId)?.name ?? 'Matéria' }}</p>
              <p class="text-[10px] text-muted mt-0.5">
                {{ fmt(item.startTime) }} → {{ fmt(item.endTime) }}
                <span v-if="pausedTime(item) > 0" class="text-amber-500"> · ⏸ {{ formatDuration(pausedTime(item)) }} pausado</span>
              </p>
            </div>
            <span class="text-sm font-bold flex-shrink-0" :style="{ color: getSubject(item.subjectId)?.color ?? '#8b5cf6' }">
              {{ formatDuration(item.duration) }}
            </span>
          </div>
        </template>
      </div>

    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTimerStore } from '@/stores/timer'
import { useSessionsStore } from '@/stores/sessions'
import { useSubjectsStore } from '@/stores/subjects'
import SubjectSelector from '@/components/home/SubjectSelector.vue'
import ThemeToggle from '@/components/ui/ThemeToggle.vue'
import { formatDuration, formatTimer } from '@/types'

const timerStore = useTimerStore()
const sessionsStore = useSessionsStore()
const subjectsStore = useSubjectsStore()

const selectedSubjectId = ref<string | null>(null)
const lastSubjectId = ref<string | null>(null)
const showSubjectPicker = ref(false)

const selectedSubject = computed(() =>
  selectedSubjectId.value ? subjectsStore.getSubject(selectedSubjectId.value) : null
)
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

function handleSelect(id: string) {
  selectedSubjectId.value = selectedSubjectId.value === id ? null : id
}

async function handleStop() {
  lastSubjectId.value = timerStore.activeSubjectId
  await timerStore.stop()
  await sessionsStore.loadToday()
  showSubjectPicker.value = false
}

async function handleBreak() {
  lastSubjectId.value = timerStore.activeSubjectId
  await timerStore.startBreak()
  await sessionsStore.loadToday()
  showSubjectPicker.value = false
}

async function switchSubject(id: string) {
  if (id === timerStore.activeSubjectId) return
  await timerStore.stop()
  await sessionsStore.loadToday()
  timerStore.startStudy(id)
  showSubjectPicker.value = false
}

async function loadToday() {
  await sessionsStore.loadToday()
}

function getSubject(id?: string) {
  return id ? subjectsStore.getSubject(id) : undefined
}

function pausedTime(session: { startTime: number; endTime: number; duration: number }) {
  const totalSecs = Math.floor((session.endTime - session.startTime) / 1000)
  return Math.max(0, totalSecs - session.duration)
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
