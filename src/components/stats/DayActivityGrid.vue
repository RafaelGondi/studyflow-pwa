<template>
  <div class="card p-4">
    <div class="flex gap-4">
      <div class="flex flex-col items-center justify-center flex-shrink-0 w-16">
        <span class="text-3xl">📚</span>
        <span class="text-sm font-bold text-primary tabular-nums mt-2 text-center leading-tight">
          {{ formatStudyClock(totalSeconds) }}
        </span>
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex gap-1">
          <div class="flex flex-col justify-between flex-shrink-0 w-5">
            <span v-for="h in [6, 9, 12, 15, 18, 21]" :key="h" class="text-[8px] text-muted leading-none">{{ h }}</span>
          </div>
          <div class="grid grid-cols-6 gap-px flex-1" style="grid-template-rows: repeat(24, 6px)">
            <div
              v-for="slot in 144"
              :key="slot"
              class="rounded-[1px]"
              :class="activeSlots.has(slot - 1) ? 'bg-accent' : 'bg-app-soft'"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { StudySession } from '@/types'
import { getActivitySlots, formatStudyClock } from '@/utils/stats'

const props = defineProps<{ sessions: StudySession[] }>()

const activeSlots = computed(() => getActivitySlots(props.sessions))
const totalSeconds = computed(() => props.sessions.reduce((a, s) => a + s.duration, 0))
</script>
