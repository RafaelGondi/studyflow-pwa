<template>
  <div class="card p-4 space-y-3">
    <div class="flex items-center justify-between">
      <p class="text-xs font-bold text-muted uppercase tracking-wider">Atividade do dia</p>
      <span class="text-sm font-bold text-primary tabular-nums">{{ formatStudyClock(totalSeconds) }}</span>
    </div>

    <div v-if="totalSeconds === 0" class="py-6 text-center text-faint text-sm">
      Nenhuma atividade registrada
    </div>

    <template v-else>
      <!-- Faixa horizontal: esquerda = madrugada, direita = noite -->
      <div class="flex h-10 rounded-md overflow-hidden border border-app-border">
        <div
          v-for="slot in 144"
          :key="slot"
          class="flex-1 min-w-0"
          :class="[
            activeSlots.has(slot - 1) ? 'bg-accent' : 'bg-app-soft',
            slot % 6 === 1 ? 'border-l border-app-border/50' : '',
          ]"
          :title="slotLabel(slot - 1)"
        />
      </div>

      <div class="flex justify-between text-[10px] text-muted tabular-nums">
        <span>0h</span>
        <span>6h</span>
        <span>12h</span>
        <span>18h</span>
        <span>24h</span>
      </div>

      <p class="text-[10px] text-faint text-center">Cada bloco = 10 min · cor = estudando</p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { StudySession } from '@/types'
import { getActivitySlots, formatStudyClock } from '@/utils/stats'

const props = defineProps<{ sessions: StudySession[] }>()

const activeSlots = computed(() => getActivitySlots(props.sessions))
const totalSeconds = computed(() => props.sessions.reduce((a, s) => a + s.duration, 0))

function slotLabel(index: number): string {
  const hour = Math.floor(index / 6)
  const min = (index % 6) * 10
  const endMin = min + 10
  const endHour = endMin >= 60 ? hour + 1 : hour
  const em = endMin >= 60 ? endMin - 60 : endMin
  return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')} – ${String(endHour).padStart(2, '0')}:${String(em).padStart(2, '0')}`
}
</script>
