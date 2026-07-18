<template>
  <Teleport to="body">
    <Transition name="focus">
      <div
        v-if="active"
        class="focus-overlay"
        @dblclick="$emit('close')"
      >
        <AkButton
          class="focus-exit"
          size="sm"
          variant="ghost"
          @click="$emit('close')"
        >
          <template #icon>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-inverse)" stroke-width="2" stroke-linecap="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
            </svg>
          </template>
        </AkButton>

        <div class="focus-subject">
          <div
            class="subject-avatar subject-avatar--lg"
            :style="{ background: colorMix(subject?.color ?? 'var(--text-inverse)', 10) }"
          >
            {{ subject?.icon ?? '📚' }}
          </div>
          <p class="focus-subject__name">{{ subject?.name ?? 'Estudo' }}</p>
        </div>

        <div
          class="focus-timer numeric"
          :class="timerStore.isRunning ? 'focus-timer--live' : 'focus-timer--paused'"
        >
          {{ timerStore.studyFormatted }}
        </div>

        <div class="flex-row" style="gap: var(--space-2); margin-top: var(--space-8)">
          <div
            class="status-dot"
            :class="timerStore.isRunning ? 'status-dot--live' : 'status-dot--paused'"
          />
          <span class="text-sm font-medium focus-status">
            {{ timerStore.isRunning ? 'em foco' : 'pausado' }}
          </span>
        </div>

        <AkButton
          class="focus-control"
          variant="primary"
          @click="timerStore.isRunning ? timerStore.pause() : timerStore.resume()"
        >
          <template #icon>
            <svg v-if="timerStore.isRunning" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
          </template>
        </AkButton>

        <p class="focus-hint">toque duas vezes para sair</p>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { AkButton } from '@rafael_dias/akoma'
import { useTimerStore } from '@/stores/timer'
import type { Subject } from '@/types'

const props = defineProps<{
  active: boolean
  subject?: Subject | null
}>()

const emit = defineEmits<{ close: [] }>()
const timerStore = useTimerStore()

function colorMix(color: string, pct: number) {
  return `color-mix(in srgb, ${color} ${pct}%, transparent)`
}

watch(() => props.active, async (val) => {
  if (val) {
    try { await document.documentElement.requestFullscreen() } catch {}
  } else {
    if (document.fullscreenElement) {
      try { await document.exitFullscreen() } catch {}
    }
  }
})

document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement && props.active) {
    emit('close')
  }
})
</script>

<style scoped>
.focus-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  user-select: none;
  background: var(--fill-strong);
}

.focus-exit {
  position: absolute;
  top: var(--space-6);
  right: var(--space-6);
  opacity: 0.4;
}
.focus-exit:hover { opacity: 1; }

.focus-subject {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-12);
}

.focus-subject__name {
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--text-inverse) 40%, transparent);
}

.focus-timer {
  font-family: var(--font-display);
  font-size: clamp(4rem, 18vw, 9rem);
  font-weight: 650;
  line-height: 1;
  color: var(--text-inverse);
}

.focus-timer--paused {
  color: color-mix(in srgb, var(--warning) 85%, var(--text-inverse));
}

.focus-status {
  color: color-mix(in srgb, var(--text-inverse) 35%, transparent);
}

.focus-control {
  margin-top: var(--space-14);
  width: 64px;
  height: 64px;
  border-radius: var(--radius-full);
  padding: 0;
}

.focus-hint {
  position: absolute;
  bottom: var(--space-8);
  font-size: 12px;
  color: color-mix(in srgb, var(--text-inverse) 15%, transparent);
}

.focus-enter-active { transition: opacity 0.3s var(--ease-smooth); }
.focus-leave-active { transition: opacity 0.2s var(--ease-smooth); }
.focus-enter-from,
.focus-leave-to { opacity: 0; }
</style>
