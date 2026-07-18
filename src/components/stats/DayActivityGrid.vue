<template>
  <AkCard padding="md" class="stack-xs">
    <div class="flex-between">
      <p class="stat-label">Atividade do dia</p>
      <span class="text-sm font-semibold text-primary numeric">{{ formatStudyClock(totalSeconds) }}</span>
    </div>

    <AkEmptyState
      v-if="totalSeconds === 0"
      title="Sem atividade"
      description="Nenhuma atividade registrada neste dia."
    />

    <template v-else>
      <div class="activity-strip">
        <div
          v-for="slot in 144"
          :key="slot"
          class="activity-strip__slot"
          :class="{
            'activity-strip__slot--active': activeSlots.has(slot - 1),
            'activity-strip__slot--hour': slot % 6 === 1,
          }"
          :title="slotLabel(slot - 1)"
        />
      </div>

      <div class="flex-between text-xs text-muted numeric">
        <span>0h</span>
        <span>6h</span>
        <span>12h</span>
        <span>18h</span>
        <span>24h</span>
      </div>

      <p class="text-xs text-faint text-center">Cada bloco = 10 min · cor = estudando</p>
    </template>
  </AkCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AkCard, AkEmptyState } from '@rafael_dias/akoma'
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

<style scoped>
.activity-strip {
  display: flex;
  height: 40px;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--border);
}

.activity-strip__slot {
  flex: 1;
  min-width: 0;
  background: var(--bg-soft);
}

.activity-strip__slot--active {
  background: var(--accent);
}

.activity-strip__slot--hour {
  border-left: 1px solid var(--border);
}

.activity-strip__slot--hour:first-child {
  border-left: none;
}
</style>
