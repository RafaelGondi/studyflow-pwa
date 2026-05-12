<template>
  <div class="flex flex-col items-center gap-6">
    <!-- Subject info -->
    <div class="flex flex-col items-center gap-2">
      <div
        class="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-xl"
        :style="{ background: `${subject?.color ?? '#8b5cf6'}25`, boxShadow: `0 0 32px ${subject?.color ?? '#8b5cf6'}40` }"
      >
        {{ subject?.icon ?? '📚' }}
      </div>
      <h2 class="text-lg font-bold text-primary">{{ subject?.name ?? 'Estudo' }}</h2>
      <div class="flex items-center gap-2">
        <div class="w-2 h-2 rounded-full" :class="isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-app-border'" />
        <span class="text-xs font-medium" :class="isRunning ? 'text-emerald-500' : 'text-muted'">
          {{ isRunning ? 'Estudando' : 'Pausado' }}
        </span>
      </div>
    </div>

    <!-- Timer ring -->
    <div class="relative flex items-center justify-center">
      <svg class="absolute w-52 h-52 -rotate-90" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="90" fill="none" stroke="rgb(var(--app-border))" stroke-width="8" />
        <circle
          cx="100" cy="100" r="90" fill="none"
          :stroke="subject?.color ?? '#8b5cf6'"
          stroke-width="8"
          stroke-linecap="round"
          :stroke-dasharray="565"
          :stroke-dashoffset="565 - (565 * progress)"
          style="transition: stroke-dashoffset 1s linear"
        />
      </svg>
      <div class="flex flex-col items-center z-10">
        <span class="font-mono text-5xl font-bold text-primary tracking-tight tabular-nums">
          {{ timerStore.formatted }}
        </span>
        <span class="text-xs text-muted mt-1 font-medium">
          {{ elapsedLabel }}
        </span>
      </div>
    </div>

    <!-- Controls -->
    <div class="flex items-center gap-4">
      <button
        @click="emit('stop')"
        class="w-14 h-14 rounded-full bg-app-elevated border border-app-border flex items-center justify-center text-muted hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/10 transition-all duration-200 active:scale-90"
        title="Parar e salvar"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <rect x="5" y="5" width="14" height="14" rx="2"/>
        </svg>
      </button>

      <button
        @click="togglePause"
        class="w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all duration-200 active:scale-90"
        :style="{
          background: `linear-gradient(135deg, ${subject?.color ?? '#8b5cf6'}, ${subject?.color ?? '#8b5cf6'}99)`,
          boxShadow: `0 0 32px ${subject?.color ?? '#8b5cf6'}50`,
        }"
      >
        <svg v-if="isRunning" class="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="4" width="4" height="16" rx="1"/>
          <rect x="14" y="4" width="4" height="16" rx="1"/>
        </svg>
        <svg v-else class="w-8 h-8 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5,3 19,12 5,21"/>
        </svg>
      </button>

      <button
        @click="emit('change')"
        class="w-14 h-14 rounded-full bg-app-elevated border border-app-border flex items-center justify-center text-muted hover:text-primary hover:bg-app-border transition-all duration-200 active:scale-90"
        title="Trocar matéria"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="17 1 21 5 17 9"/>
          <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
          <polyline points="7 23 3 19 7 15"/>
          <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTimerStore } from '@/stores/timer'
import { useSubjectsStore } from '@/stores/subjects'
import { formatDuration } from '@/types'

const emit = defineEmits<{ stop: []; change: [] }>()

const timerStore = useTimerStore()
const subjectsStore = useSubjectsStore()

const isRunning = computed(() => timerStore.isRunning)
const subject = computed(() => {
  const id = timerStore.activeSubjectId
  return id ? subjectsStore.getSubject(id) : null
})

const progress = computed(() => {
  const s = timerStore.elapsedSeconds
  // ring completes every 25 minutes (Pomodoro-style visual)
  return (s % 1500) / 1500
})

const elapsedLabel = computed(() => {
  const s = timerStore.elapsedSeconds
  return s > 0 ? `${formatDuration(s)} de estudo` : 'Pronto para começar'
})

function togglePause() {
  if (timerStore.isRunning) timerStore.pause()
  else timerStore.resume()
}
</script>
