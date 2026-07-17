<template>
  <section class="timer-panel">
    <template v-if="timerStore.mode === 'break'">
      <div class="timer-panel__head">
        <div class="subject-leading">☕</div>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold text-warning">Em pausa</p>
          <p class="text-xs text-muted">Descanse um pouco</p>
        </div>
        <span class="timer-panel__time numeric text-warning">{{ timerStore.breakFormatted }}</span>
      </div>
      <div class="timer-panel__actions">
        <AkButton v-if="lastSubjectId" variant="primary" block @click="emit('continue')">
          Continuar estudo
        </AkButton>
        <div class="grid-2">
          <AkButton variant="secondary" block @click="emit('change-subject')">Trocar matéria</AkButton>
          <AkButton variant="secondary" block @click="emit('stop')">Encerrar</AkButton>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="timer-panel__head">
        <div
          class="subject-leading"
          :style="{ background: colorMix(subject?.color ?? 'var(--accent)', 14) }"
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

      <div class="timer-panel__time numeric" :style="{ color: subject?.color ?? 'var(--accent)' }">
        {{ timerStore.studyFormatted }}
      </div>

      <div class="timer-panel__actions timer-panel__actions--grid">
        <AkButton variant="secondary" @click="emit('stop')">Parar</AkButton>
        <AkButton variant="primary" @click="timerStore.isRunning ? timerStore.pause() : timerStore.resume()">
          {{ timerStore.isRunning ? 'Pausar' : 'Retomar' }}
        </AkButton>
        <AkButton variant="ghost" @click="emit('break')">☕ Pausa</AkButton>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AkButton } from '@rafael_dias/akoma'
import { useTimerStore } from '@/stores/timer'
import { useSubjectsStore } from '@/stores/subjects'
import type { Subject } from '@/types'

defineProps<{ lastSubjectId?: string | null }>()

const emit = defineEmits<{ stop: []; break: []; continue: []; 'change-subject': [] }>()

const timerStore = useTimerStore()
const subjectsStore = useSubjectsStore()

const subject = computed<Subject | null>(() => {
  const id = timerStore.activeSubjectId
  return id ? subjectsStore.getSubject(id) ?? null : null
})

function colorMix(color: string, pct: number) {
  return `color-mix(in srgb, ${color} ${pct}%, var(--bg-soft))`
}
</script>

<style scoped>
.timer-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
  background: var(--bg-elevated);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(41, 49, 45, 0.06));
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
  font-weight: 700;
  letter-spacing: -0.03em;
  text-align: center;
  line-height: 1;
}

.timer-panel__actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.timer-panel__actions--grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--space-2);
}

.timer-panel__actions--grid .ak-button {
  min-width: 0;
  padding-inline: var(--space-2);
}
</style>
