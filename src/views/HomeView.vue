<template>
  <div class="min-h-screen bg-app-bg flex flex-col">
    <!-- Header -->
    <header class="flex items-center justify-between px-5 pt-safe-top pb-4 pt-6">
      <div>
        <p class="text-xs text-muted font-medium uppercase tracking-widest">{{ greeting }}</p>
        <h1 class="text-2xl font-bold text-primary mt-0.5">StudyFlow</h1>
      </div>
      <div class="flex items-center gap-2">
        <div class="flex flex-col items-end">
          <span class="text-xs text-muted">{{ dateLabel }}</span>
          <span class="text-sm font-semibold text-secondary mt-0.5">
            {{ formatDuration(sessionsStore.todayTotalSeconds) || '0s' }} estudados
          </span>
        </div>
        <ThemeToggle />
      </div>
    </header>

    <!-- Content -->
    <main class="flex-1 overflow-y-auto px-4 pb-24 space-y-8">
      <!-- Timer active state -->
      <Transition name="fade" mode="out-in">
        <section v-if="timerStore.timer" key="timer" class="pt-4">
          <div class="bg-app-card border border-app-border rounded-3xl p-6 shadow-2xl">
            <TimerDisplay @stop="handleStop" @change="handleChange" />
          </div>
        </section>

        <!-- Subject selector state -->
        <section v-else key="selector" class="pt-2">
          <SubjectSelector :selected="selectedSubjectId" @select="handleSelect" />

          <Transition name="slide-up">
            <div v-if="selectedSubjectId" class="mt-4">
              <button
                @click="handleStart"
                class="w-full py-4 rounded-2xl font-bold text-base text-white transition-all duration-200 active:scale-95 shadow-lg flex items-center justify-center gap-3"
                :style="{
                  background: `linear-gradient(135deg, ${selectedSubject?.color ?? '#8b5cf6'}, ${selectedSubject?.color ?? '#8b5cf6'}bb)`,
                  boxShadow: `0 8px 24px ${selectedSubject?.color ?? '#8b5cf6'}40`,
                }"
              >
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5,3 19,12 5,21"/>
                </svg>
                Iniciar Estudo
              </button>
            </div>
          </Transition>
        </section>
      </Transition>

      <!-- Today stats -->
      <section>
        <TodayStats />
      </section>

      <!-- Recent sessions -->
      <section v-if="sessionsStore.todaySessions.length > 0" class="space-y-3">
        <div class="flex items-center justify-between px-1">
          <h2 class="text-sm font-semibold text-muted uppercase tracking-wider">Sessões de hoje</h2>
          <span class="text-xs text-faint">{{ sessionsStore.todaySessions.length }} sessões</span>
        </div>
        <div class="space-y-2">
          <div
            v-for="session in sessionsStore.todaySessions"
            :key="session.id"
            class="flex items-center gap-3 p-3 rounded-xl bg-app-card border border-app-border"
          >
            <div
              class="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
              :style="{ background: `${getSubject(session.subjectId)?.color ?? '#8b5cf6'}20` }"
            >
              {{ getSubject(session.subjectId)?.icon ?? '📚' }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-primary truncate">
                {{ getSubject(session.subjectId)?.name ?? 'Matéria' }}
              </p>
              <p class="text-xs text-muted">{{ formatSessionTime(session.startTime, session.endTime) }}</p>
            </div>
            <span class="text-sm font-semibold text-secondary flex-shrink-0">
              {{ formatDuration(session.duration) }}
            </span>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTimerStore } from '@/stores/timer'
import { useSessionsStore } from '@/stores/sessions'
import { useSubjectsStore } from '@/stores/subjects'
import SubjectSelector from '@/components/home/SubjectSelector.vue'
import TimerDisplay from '@/components/home/TimerDisplay.vue'
import TodayStats from '@/components/home/TodayStats.vue'
import ThemeToggle from '@/components/ui/ThemeToggle.vue'
import { formatDuration } from '@/types'

const timerStore = useTimerStore()
const sessionsStore = useSessionsStore()
const subjectsStore = useSubjectsStore()

const selectedSubjectId = ref<string | null>(null)

const selectedSubject = computed(() =>
  selectedSubjectId.value ? subjectsStore.getSubject(selectedSubjectId.value) : null
)

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
})

const dateLabel = computed(() =>
  new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
)

function handleSelect(id: string) {
  selectedSubjectId.value = selectedSubjectId.value === id ? null : id
}

function handleStart() {
  if (!selectedSubjectId.value) return
  timerStore.start(selectedSubjectId.value)
}

async function handleStop() {
  await timerStore.stop()
  await sessionsStore.loadToday()
  selectedSubjectId.value = null
}

function handleChange() {
  timerStore.pause()
  timerStore.reset()
  selectedSubjectId.value = null
}

function getSubject(id: string) {
  return subjectsStore.getSubject(id)
}

function formatSessionTime(start: number, end: number) {
  const fmt = (ts: number) => new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${fmt(start)} → ${fmt(end)}`
}

onMounted(() => {
  timerStore.load()
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-up-enter-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.slide-up-enter-from { opacity: 0; transform: translateY(12px); }
</style>
