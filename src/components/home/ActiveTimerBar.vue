<template>
  <AkCard padding="sm">
    <div v-if="timerStore.mode === 'break'" class="flex-row" style="gap: var(--space-3)">
      <div class="subject-avatar" :style="{ background: 'var(--warning-soft)' }">☕</div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-primary">Em pausa</p>
        <p class="text-2xl font-bold numeric text-warning">{{ timerStore.breakFormatted }}</p>
      </div>
      <div class="flex-row" style="gap: var(--space-2)">
        <AkButton v-if="lastSubjectId" size="sm" variant="primary" @click="emit('continue')">
          Continuar
        </AkButton>
        <AkButton size="sm" variant="secondary" @click="emit('stop')">Encerrar</AkButton>
      </div>
    </div>

    <div v-else class="stack-sm">
      <div class="flex-row" style="gap: var(--space-3)">
        <div
          class="subject-avatar"
          :style="{ background: colorMix(subject?.color ?? 'var(--accent)', 10) }"
        >
          {{ subject?.icon ?? '📚' }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-primary truncate">{{ subject?.name ?? 'Estudo' }}</p>
          <div class="flex-row" style="gap: var(--space-2)">
            <div
              class="status-dot"
              :class="timerStore.isRunning ? 'status-dot--live' : 'status-dot--paused'"
            />
            <span class="text-xs" :class="timerStore.isRunning ? 'text-success' : 'text-warning'">
              {{ timerStore.isRunning ? 'Gravando' : 'Pausado' }}
            </span>
          </div>
        </div>
        <span
          class="text-xl font-bold numeric"
          :style="{ color: subject?.color ?? 'var(--accent)' }"
        >
          {{ timerStore.studyFormatted }}
        </span>
      </div>

      <div class="grid-3">
        <AkButton size="sm" variant="secondary" @click="emit('stop')">
          <template #icon>
            <svg viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>
          </template>
          Parar
        </AkButton>

        <AkButton
          size="sm"
          variant="primary"
          :style="!timerStore.isRunning ? { background: 'var(--success)' } : { background: subject?.color ?? 'var(--accent)' }"
          @click="timerStore.isRunning ? timerStore.pause() : timerStore.resume()"
        >
          <template #icon>
            <svg v-if="timerStore.isRunning" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
          </template>
          {{ timerStore.isRunning ? 'Pausar' : 'Retomar' }}
        </AkButton>

        <AkButton size="sm" variant="secondary" style="color: var(--cat-3)" @click="emit('break')">
          ☕ Pausa
        </AkButton>
      </div>
    </div>
  </AkCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AkButton, AkCard } from '@rafael_dias/akoma'
import { useTimerStore } from '@/stores/timer'
import { useSubjectsStore } from '@/stores/subjects'
import type { Subject } from '@/types'

defineProps<{
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

function colorMix(color: string, pct: number) {
  return `color-mix(in srgb, ${color} ${pct}%, var(--bg-elevated))`
}
</script>
