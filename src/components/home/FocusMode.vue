<template>
  <Teleport to="body">
    <Transition name="focus">
      <div
        v-if="active"
        class="focus-overlay"
        @dblclick="$emit('close')"
      >
        <button
          type="button"
          class="focus-exit"
          aria-label="Sair do modo foco"
          @click="$emit('close')"
        >
          <AkIcon name="minimize-outline" :size="18" />
        </button>

        <!-- Break state -->
        <template v-if="timerStore.isInBreak">
          <div class="focus-phase-label">
            {{ breakLabel }}
          </div>

          <div class="focus-timer numeric focus-timer--break">
            {{ timerStore.breakFormatted }}
          </div>

          <p class="focus-total">{{ breakSubtitle }}</p>

          <div class="flex-row" style="gap: var(--space-2); margin-top: var(--space-8)">
            <div class="status-dot status-dot--paused" />
            <span class="text-sm font-medium focus-status">pausa</span>
          </div>

          <button
            type="button"
            class="focus-control focus-control--skip"
            aria-label="Pular pausa"
            @click="timerStore.skipBreak()"
          >
            <AkIcon name="arrow-right-outline" :size="22" />
          </button>

          <p class="focus-hint">toque duas vezes para sair</p>
        </template>

        <!-- Work / counter state -->
        <template v-else>
          <div class="focus-subject">
            <div
              class="subject-avatar subject-avatar--lg"
              :style="{ background: subjectBgMix(subject?.color ?? DEFAULT_SUBJECT_COLOR, 10) }"
            >
              <SubjectIcon :icon="subject?.icon ?? '📚'" :name="subject?.name" />
            </div>
            <p class="focus-subject__name">{{ subject?.name ?? 'Estudo' }}</p>
          </div>

          <div
            class="focus-timer numeric"
            :class="timerStore.isRunning ? 'focus-timer--live' : 'focus-timer--paused'"
          >
            {{ timerStore.displayFormatted }}
          </div>

          <!-- Pomodoro count indicator -->
          <p v-if="timerStore.timerType === 'pomodoro'" class="focus-total">
            Pomodoro {{ timerStore.pomodoroCount + 1 }}
            · {{ prefs.pomodoro.workMinutes }} min
          </p>
          <p v-else-if="props.totalSeconds != null" class="focus-total">
            {{ formatDuration(props.totalSeconds) }} hoje
          </p>

          <div class="flex-row" style="gap: var(--space-2); margin-top: var(--space-8)">
            <div
              class="status-dot"
              :class="timerStore.isRunning ? 'status-dot--live' : 'status-dot--paused'"
            />
            <span class="text-sm font-medium focus-status">
              {{ timerStore.isRunning ? 'em foco' : 'pausado' }}
            </span>
          </div>

          <button
            type="button"
            class="focus-control"
            :aria-label="timerStore.isRunning ? 'Pausar' : 'Retomar'"
            @click="timerStore.isRunning ? timerStore.pause() : timerStore.resume()"
          >
            <AkIcon :name="timerStore.isRunning ? 'pause-outline' : 'play-outline'" :size="26" />
          </button>

          <p class="focus-hint">toque duas vezes para sair</p>
        </template>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { AkIcon } from '@rafael_dias/akoma'
import SubjectIcon from '@/components/ui/SubjectIcon.vue'
import { useTimerStore } from '@/stores/timer'
import { DEFAULT_SUBJECT_COLOR, subjectBgMix } from '@/utils/colors'
import { formatDuration } from '@/types'
import type { Subject } from '@/types'

const props = defineProps<{
  active: boolean
  subject?: Subject | null
  totalSeconds?: number
}>()

const emit = defineEmits<{ close: [] }>()
const timerStore = useTimerStore()
const prefs = computed(() => timerStore.prefs)

const breakLabel = computed(() => {
  const kind = timerStore.breakKind
  if (kind === 'long')  return 'Pausa longa'
  if (kind === 'flow')  return 'Pausa proporcional'
  return 'Pausa curta'
})

const breakSubtitle = computed(() => {
  const kind = timerStore.breakKind
  if (kind === 'flow') {
    return `1/${prefs.value.flowBreakRatio} do tempo estudado`
  }
  const total = timerStore.prefs.pomodoro
  const interval = total.longBreakInterval
  const count = timerStore.pomodoroCount
  return `Pomodoro ${count} de ${interval}`
})

watch(() => props.active, async (val) => {
  if (val) {
    try { await document.documentElement.requestFullscreen() } catch {}
  } else {
    if (document.fullscreenElement) {
      try { await document.exitFullscreen() } catch {}
    }
  }
})

function handleFullscreenChange() {
  if (!document.fullscreenElement && props.active) emit('close')
}

onMounted(() => document.addEventListener('fullscreenchange', handleFullscreenChange))
onUnmounted(() => document.removeEventListener('fullscreenchange', handleFullscreenChange))
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
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--text-inverse);
  opacity: 0.4;
  cursor: pointer;
}
.focus-exit:hover { opacity: 1; }
.focus-exit:focus-visible {
  outline: none;
  opacity: 1;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--text-inverse) 40%, transparent);
}

.focus-phase-label {
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--text-inverse) 50%, transparent);
  margin-bottom: var(--space-6);
}

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

.focus-timer--break {
  color: color-mix(in srgb, var(--text-inverse) 70%, transparent);
}

.focus-total {
  margin-top: var(--space-2);
  font-size: 12px;
  color: color-mix(in srgb, var(--text-inverse) 45%, transparent);
}

.focus-status {
  color: color-mix(in srgb, var(--text-inverse) 35%, transparent);
}

.focus-control {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: var(--space-14);
  width: 64px;
  height: 64px;
  border: 0;
  border-radius: var(--radius-full);
  background: var(--accent-ink);
  color: var(--accent-contrast);
  cursor: pointer;
}

.focus-control--skip {
  background: color-mix(in srgb, var(--text-inverse) 12%, transparent);
  color: var(--text-inverse);
}

.focus-control:active { transform: scale(0.96); }
.focus-control:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--text-inverse) 30%, transparent);
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
