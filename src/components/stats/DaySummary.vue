<template>
  <section class="section-block">
    <AkSectionHeader :title="dayLabel" />

    <div class="metric-strip">
      <div class="metric-strip__item">
        <p class="stat-label">Tempo total</p>
        <p class="stat-value numeric">{{ formatStudyClock(stats.totalSeconds) }}</p>
      </div>
      <div class="metric-strip__item">
        <p class="stat-label">Foco máximo</p>
        <p class="stat-value numeric">{{ formatStudyClock(stats.maxFocusSeconds) }}</p>
      </div>
      <div class="metric-strip__item">
        <p class="stat-label">Início</p>
        <p class="stat-value numeric" style="font-size: 18px">
          {{ stats.startTime ? formatClockTime(stats.startTime) : '—' }}
        </p>
      </div>
      <div class="metric-strip__item">
        <p class="stat-label">Fim</p>
        <p class="stat-value numeric" style="font-size: 18px">
          {{ stats.endTime ? formatClockTime(stats.endTime) : '—' }}
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AkSectionHeader } from '@rafael_dias/akoma'
import type { StudySession } from '@/types'
import { getDayStats, formatStudyClock, formatClockTime, dayHeaderLabel } from '@/utils/stats'

const props = defineProps<{ sessions: StudySession[]; date: string }>()

const stats = computed(() => getDayStats(props.sessions))
const dayLabel = computed(() => dayHeaderLabel(props.date))
</script>
