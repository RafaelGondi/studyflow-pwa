<template>
  <div class="card p-3 space-y-3">
    <!-- Break mode -->
    <div v-if="timerStore.mode === 'break'" class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-akoma flex items-center justify-center text-lg flex-shrink-0 bg-amber-500/15">
        ☕
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-primary">Em pausa</p>
        <p class="text-2xl font-bold tabular-nums text-amber-500">{{ timerStore.breakFormatted }}</p>
      </div>
      <div class="flex items-center gap-1.5">
        <button
          v-if="lastSubjectId"
          @click="emit('continue')"
          class="px-3 py-2 btn-primary text-xs tap-scale"
        >
          Continuar
        </button>
        <button @click="emit('stop')" class="px-3 py-2 btn-secondary text-xs text-muted tap-scale">
          Encerrar
        </button>
      </div>
    </div>

    <!-- Study / paused mode -->
    <div v-else class="space-y-3">
      <div class="flex items-center gap-3">
        <div
          class="w-9 h-9 rounded-akoma flex items-center justify-center text-lg flex-shrink-0"
          :style="{ background: `${subject?.color ?? 'var(--accent-color)'}18` }"
        >
          {{ subject?.icon ?? '📚' }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-primary truncate">{{ subject?.name ?? 'Estudo' }}</p>
          <div class="flex items-center gap-1.5">
            <div
              class="w-1.5 h-1.5 rounded-full"
              :class="timerStore.isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'"
            />
            <span class="text-[11px]" :class="timerStore.isRunning ? 'text-emerald-500' : 'text-amber-500'">
              {{ timerStore.isRunning ? 'Gravando' : 'Pausado' }}
            </span>
          </div>
        </div>
        <span
          class="text-xl font-bold tabular-nums"
          :style="{ color: subject?.color ?? 'var(--accent-color)' }"
        >
          {{ timerStore.studyFormatted }}
        </span>
      </div>

      <div class="grid grid-cols-3 gap-2">
        <button @click="emit('stop')" class="py-2.5 btn-secondary flex flex-col items-center gap-0.5 text-muted tap-scale">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>
          <span class="text-[10px] font-semibold">Parar</span>
        </button>

        <button
          @click="timerStore.isRunning ? timerStore.pause() : timerStore.resume()"
          class="py-2.5 rounded-akoma font-bold text-white flex flex-col items-center gap-0.5 tap-scale"
          :style="{ background: timerStore.isRunning ? (subject?.color ?? 'var(--accent-color)') : '#10b981' }"
        >
          <svg v-if="timerStore.isRunning" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>
          </svg>
          <svg v-else class="w-4 h-4 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5,3 19,12 5,21"/>
          </svg>
          <span class="text-[10px] font-semibold">{{ timerStore.isRunning ? 'Pausar' : 'Retomar' }}</span>
        </button>

        <button @click="emit('break')" class="py-2.5 btn-secondary flex flex-col items-center gap-0.5 tap-scale" style="color: var(--cat-3)">
          <span class="text-base leading-none">☕</span>
          <span class="text-[10px] font-semibold">Pausa</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTimerStore } from '@/stores/timer'
import { useSubjectsStore } from '@/stores/subjects'
import type { Subject } from '@/types'

const props = defineProps<{
  lastSubjectId?: string | null
}>()

const emit = defineEmits<{
  stop: []
  break: []
  continue: []
}>()

const timerStore = useTimerStore()
const subjectsStore = useSubjectsStore()

const subject = computed<Subject | null>(() => {
  const id = timerStore.activeSubjectId
  return id ? subjectsStore.getSubject(id) ?? null : null
})
</script>
