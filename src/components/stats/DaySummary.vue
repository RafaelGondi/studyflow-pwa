<template>
  <div class="card p-4 space-y-4">
    <h3 class="text-sm font-semibold text-primary text-center">{{ dayLabel }}</h3>

    <div class="grid grid-cols-2 gap-x-4 gap-y-5">
      <div>
        <p class="text-[10px] font-semibold text-muted uppercase tracking-wider">Tempo total</p>
        <p class="text-2xl font-bold text-primary tabular-nums mt-1">{{ formatStudyClock(stats.totalSeconds) }}</p>
      </div>
      <div>
        <p class="text-[10px] font-semibold text-muted uppercase tracking-wider">Foco máximo</p>
        <p class="text-2xl font-bold text-primary tabular-nums mt-1">{{ formatStudyClock(stats.maxFocusSeconds) }}</p>
      </div>
      <div>
        <p class="text-[10px] font-semibold text-muted uppercase tracking-wider">Início</p>
        <p class="text-lg font-bold text-primary mt-1">{{ stats.startTime ? formatClockTime(stats.startTime) : '—' }}</p>
      </div>
      <div>
        <p class="text-[10px] font-semibold text-muted uppercase tracking-wider">Fim</p>
        <p class="text-lg font-bold text-primary mt-1">{{ stats.endTime ? formatClockTime(stats.endTime) : '—' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { StudySession } from '@/types'
import { getDayStats, formatStudyClock, formatClockTime, dayHeaderLabel } from '@/utils/stats'

const props = defineProps<{ sessions: StudySession[]; date: string }>()

const stats = computed(() => getDayStats(props.sessions))
const dayLabel = computed(() => dayHeaderLabel(props.date))
</script>
