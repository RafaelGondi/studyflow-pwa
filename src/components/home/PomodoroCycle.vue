<template>
  <!--
    Trilha do ciclo. Um traço por bloco de foco, mais um pip redondo no fim
    representando a pausa longa — o mesmo desenho serve foco e pausa, então
    os dois estados se leem como o mesmo ciclo em andamento.

    A cor sai de `currentColor`, então funciona tanto na lista (fundo claro)
    quanto no overlay do modo foco (fundo escuro) sem prop de tema.
  -->
  <div class="cycle" :class="`cycle--${props.size}`">
    <div class="cycle__track" role="img" :aria-label="ariaLabel">
      <span
        v-for="i in blocks"
        :key="i"
        class="cycle__block"
        :class="[
          i <= done && 'cycle__block--done',
          i === current && 'cycle__block--current',
          i === current && running && 'cycle__block--live',
        ]"
      />
      <span
        class="cycle__pip"
        :class="inLongBreak && 'cycle__pip--current'"
      />
    </div>

    <p v-if="props.caption" class="cycle__caption">{{ captionText }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTimerStore } from '@/stores/timer'

const props = withDefaults(defineProps<{
  size?: 'sm' | 'lg'
  caption?: boolean
}>(), {
  size: 'lg',
  caption: true,
})

const timerStore = useTimerStore()

const blocks       = computed(() => Math.max(1, timerStore.prefs.pomodoro.longBreakInterval))
const running      = computed(() => timerStore.isRunning)
const inBreak      = computed(() => timerStore.isInBreak)
const inLongBreak  = computed(() => inBreak.value && timerStore.breakKind === 'long')

/**
 * Blocos concluídos dentro do ciclo atual. `pomodoroCount` só zera depois da
 * pausa longa, então na pausa longa o resto é 0 — aí a trilha tem que aparecer
 * cheia, não vazia.
 */
const done = computed(() => {
  const n = blocks.value
  const c = timerStore.pomodoroCount
  if (c <= 0) return 0
  const mod = c % n
  return mod === 0 ? n : mod
})

/** Bloco de foco em andamento (1-based). Null durante a pausa. */
const current = computed(() => {
  if (inBreak.value) return null
  const next = done.value + 1
  return next > blocks.value ? 1 : next
})

const nextFocus = computed(() => {
  const next = done.value + 1
  return next > blocks.value ? 1 : next
})

const nextBreakIsLong = computed(() => (current.value ?? nextFocus.value) === blocks.value)

const captionText = computed(() => {
  if (inBreak.value) {
    return `a seguir, foco ${nextFocus.value} de ${blocks.value}`
  }
  return `foco ${current.value} de ${blocks.value} · depois, pausa ${nextBreakIsLong.value ? 'longa' : 'curta'}`
})

const ariaLabel = computed(() => {
  if (inLongBreak.value) return `Pausa longa. Ciclo de ${blocks.value} blocos completo.`
  if (inBreak.value)     return `Pausa curta. ${done.value} de ${blocks.value} blocos de foco concluídos.`
  return `Bloco de foco ${current.value} de ${blocks.value}.`
})
</script>

<style scoped>
.cycle {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}

.cycle__track {
  display: flex;
  align-items: center;
}

.cycle__block,
.cycle__pip {
  flex-shrink: 0;
  background: color-mix(in srgb, currentColor 15%, transparent);
  transition: background 0.3s var(--ease-smooth);
}

.cycle__block--done    { background: color-mix(in srgb, currentColor 50%, transparent); }
.cycle__block--current { background: currentColor; }
.cycle__pip--current   { background: currentColor; }

.cycle__block--live { animation: cycle-pulse 2.4s var(--ease-smooth) infinite; }

.cycle__caption {
  margin: 0;
  font-size: 12px;
  color: color-mix(in srgb, currentColor 45%, transparent);
}

/* ── lg: modo foco ───────────────────────────────────────────── */
.cycle--lg .cycle__track { gap: 6px; }
.cycle--lg .cycle__block {
  width: 24px;
  height: 5px;
  border-radius: 3px;
}
.cycle--lg .cycle__pip {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  margin-left: 3px;
}

/* ── sm: linha da lista ──────────────────────────────────────── */
.cycle--sm { align-items: flex-start; }
.cycle--sm .cycle__track { gap: 4px; }
.cycle--sm .cycle__block {
  width: 14px;
  height: 3px;
  border-radius: 2px;
}
.cycle--sm .cycle__pip {
  width: 5px;
  height: 5px;
  border-radius: var(--radius-full);
  margin-left: 2px;
}

@keyframes cycle-pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.35; }
}

@media (prefers-reduced-motion: reduce) {
  .cycle__block--live { animation: none; }
}
</style>
