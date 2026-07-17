<template>
  <section class="timer-bar">
    <template v-if="timerStore.mode === 'break'">
      <div class="timer-bar__row">
        <div class="subject-leading">☕</div>
        <div class="min-w-0">
          <p class="text-sm font-semibold">Em pausa</p>
          <p class="text-xs text-muted">Intervalo ativo</p>
        </div>
        <span class="timer-bar__time numeric text-warning">{{ timerStore.breakFormatted }}</span>
      </div>
      <div class="timer-bar__actions">
        <AkButton v-if="lastSubjectId" size="sm" variant="primary" @click="emit('continue')">
          Continuar
        </AkButton>
        <AkButton size="sm" variant="secondary" @click="emit('stop')">Encerrar</AkButton>
      </div>
    </template>

    <template v-else>
      <div class="timer-bar__row">
        <div class="subject-leading">{{ subject?.icon ?? '📚' }}</div>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold truncate">{{ subject?.name ?? 'Estudo' }}</p>
          <p class="text-xs" :class="timerStore.isRunning ? 'text-accent' : 'text-warning'">
            {{ timerStore.isRunning ? 'Gravando' : 'Pausado' }}
          </p>
        </div>
        <span
          class="timer-bar__time numeric"
          :style="{ color: subject?.color ?? 'var(--accent)' }"
        >
          {{ timerStore.studyFormatted }}
        </span>
      </div>
      <div class="timer-bar__actions">
        <AkButton size="sm" variant="secondary" @click="emit('stop')">Parar</AkButton>
        <AkButton
          size="sm"
          variant="primary"
          @click="timerStore.isRunning ? timerStore.pause() : timerStore.resume()"
        >
          {{ timerStore.isRunning ? 'Pausar' : 'Retomar' }}
        </AkButton>
        <AkButton size="sm" variant="ghost" @click="emit('break')">☕ Pausa</AkButton>
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

const emit = defineEmits<{ stop: []; break: []; continue: [] }>()

const timerStore = useTimerStore()
const subjectsStore = useSubjectsStore()

const subject = computed<Subject | null>(() => {
  const id = timerStore.activeSubjectId
  return id ? subjectsStore.getSubject(id) ?? null : null
})
</script>
