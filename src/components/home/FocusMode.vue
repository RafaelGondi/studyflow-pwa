<template>
  <Teleport to="body">
    <Transition name="focus">
      <div
        v-if="active"
        class="fixed inset-0 z-[200] flex flex-col items-center justify-center select-none"
        style="background: #000"
        @dblclick="$emit('close')"
      >
        <!-- Exit button -->
        <button
          @click="$emit('close')"
          class="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center transition-opacity opacity-30 hover:opacity-100"
          style="background: rgba(255,255,255,0.08)"
        >
          <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
          </svg>
        </button>

        <!-- Subject -->
        <div class="flex flex-col items-center gap-2 mb-12">
          <div
            class="w-14 h-14 rounded-akoma flex items-center justify-center text-3xl"
            :style="{ background: `${subject?.color ?? '#ffffff'}18` }"
          >
            {{ subject?.icon ?? '📚' }}
          </div>
          <p class="text-sm font-medium tracking-widest uppercase" style="color: rgba(255,255,255,0.4)">
            {{ subject?.name ?? 'Estudo' }}
          </p>
        </div>

        <!-- Timer -->
        <div
          class="font-sans tabular-nums leading-none"
          style="font-size: clamp(4rem, 18vw, 9rem); font-weight: 700;"
          :style="{ color: subject?.color ?? 'var(--accent)' }"
        >
          {{ timerStore.studyFormatted }}
        </div>

        <!-- Status -->
        <div class="flex items-center gap-2 mt-8">
          <div
            class="w-2 h-2 rounded-full"
            :class="timerStore.isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'"
          />
          <span class="text-sm font-medium" style="color: rgba(255,255,255,0.35)">
            {{ timerStore.isRunning ? 'em foco' : 'pausado' }}
          </span>
        </div>

        <!-- Controls -->
        <div class="flex items-center gap-4 mt-14">
          <button
            @click="timerStore.isRunning ? timerStore.pause() : timerStore.resume()"
            class="w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-95"
            :style="{
              background: timerStore.isRunning
                ? 'rgba(255,255,255,0.08)'
                : (subject?.color ?? 'var(--accent)')
            }"
          >
            <svg v-if="timerStore.isRunning" class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>
            </svg>
            <svg v-else class="w-6 h-6 ml-1 text-white" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21"/>
            </svg>
          </button>
        </div>

        <!-- Hint -->
        <p class="absolute bottom-8 text-xs" style="color: rgba(255,255,255,0.15)">
          toque duas vezes para sair
        </p>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useTimerStore } from '@/stores/timer'
import type { Subject } from '@/types'

const props = defineProps<{
  active: boolean
  subject?: Subject | null
}>()

const emit = defineEmits<{ close: [] }>()
const timerStore = useTimerStore()

// Enter/exit native fullscreen
watch(() => props.active, async (val) => {
  if (val) {
    try { await document.documentElement.requestFullscreen() } catch {}
  } else {
    if (document.fullscreenElement) {
      try { await document.exitFullscreen() } catch {}
    }
  }
})

// Exit focus if browser exits fullscreen (e.g. pressing Esc)
document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement && props.active) {
    emit('close')
  }
})
</script>

<style scoped>
.focus-enter-active { transition: opacity 0.3s ease; }
.focus-leave-active { transition: opacity 0.2s ease; }
.focus-enter-from,
.focus-leave-to     { opacity: 0; }
</style>
