<template>
  <section class="timer-panel">
    <div class="timer-panel__head">
      <div
        class="subject-leading"
        :style="{ background: subjectBgMix(subject?.color ?? 'var(--accent)', 14) }"
      >
        {{ subject?.icon ?? '📚' }}
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-sm font-semibold truncate">{{ subject?.name ?? 'Estudo' }}</p>
        <p class="text-xs" :class="timerStore.isRunning ? 'text-accent' : 'text-warning'">
          {{ timerStore.isRunning ? 'Gravando' : 'Pausado' }}
        </p>
      </div>
      <AkButton size="sm" variant="ghost" @click="emit('change-subject')">Trocar</AkButton>
    </div>

    <div
      class="timer-panel__time numeric"
      :class="timerStore.isRunning ? 'timer-panel__time--live' : 'timer-panel__time--paused'"
    >
      {{ timerStore.studyFormatted }}
    </div>

    <div class="timer-panel__actions timer-panel__actions--grid">
      <AkButton variant="secondary" @click="emit('stop')">Parar</AkButton>
      <AkButton variant="primary" @click="timerStore.isRunning ? timerStore.pause() : timerStore.resume()">
        {{ timerStore.isRunning ? 'Pausar' : 'Retomar' }}
      </AkButton>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AkButton } from '@rafael_dias/akoma'
import { useTimerStore } from '@/stores/timer'
import { useSubjectsStore } from '@/stores/subjects'
import { subjectBgMix } from '@/utils/colors'
import type { Subject } from '@/types'

const emit = defineEmits<{ stop: []; 'change-subject': [] }>()

const timerStore = useTimerStore()
const subjectsStore = useSubjectsStore()

const subject = computed<Subject | null>(() => {
  const id = timerStore.activeSubjectId
  return id ? subjectsStore.getSubject(id) ?? null : null
})
</script>

<style scoped>
.timer-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--card-radius, 16px);
  box-shadow: var(--card-shadow);
}

.timer-panel__head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
}

.timer-panel__time {
  font-family: var(--font-display);
  font-size: clamp(40px, 12vw, 52px);
  font-weight: 650;
  letter-spacing: -0.03em;
  text-align: center;
  line-height: 1;
  color: var(--text);
}

.timer-panel__time--paused {
  color: var(--warning);
}

.timer-panel__actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.timer-panel__actions--grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2);
}
</style>
