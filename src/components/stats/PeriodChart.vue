<template>
  <section class="section-block">
    <AkSectionHeader :title="title">
      <template #action>
        <span v-if="max > 0" class="text-xs text-muted numeric">
          pico {{ formatDuration(max) }}
        </span>
      </template>
    </AkSectionHeader>

    <div v-if="max > 0" class="period-chart">
      <div
        v-for="bucket in buckets"
        :key="bucket.key"
        class="period-chart__col"
        :class="{ 'period-chart__col--current': bucket.isCurrent }"
      >
        <div
          class="period-chart__bar"
          :style="{
            height: `${barHeight(bucket.seconds)}px`,
            background: barColor(bucket.seconds),
          }"
          :title="`${bucket.label}: ${formatDuration(bucket.seconds)}`"
        />
        <span class="period-chart__label">{{ bucket.label }}</span>
      </div>
    </div>

    <AkEmptyState
      v-else
      title="Sem estudo no período"
      description="Registre uma sessão para ver a distribuição."
    />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AkEmptyState, AkSectionHeader } from '@rafael_dias/akoma'
import { formatDuration } from '@/types'
import { completionShade, completionShadeColor } from '@/utils/completionShade'
import type { PeriodBucket } from '@/utils/studyProgress'

const props = defineProps<{
  title: string
  buckets: PeriodBucket[]
}>()

const BAR_MAX_PX = 104

const max = computed(() =>
  props.buckets.reduce((acc, b) => Math.max(acc, b.seconds), 0),
)

function barHeight(seconds: number): number {
  if (max.value === 0) return 3
  if (seconds === 0) return 3
  return Math.max(Math.round((seconds / max.value) * BAR_MAX_PX), 4)
}

/**
 * Intensidade pela escala de cinco tons do Akoma (content/patterns.md):
 * mais tempo, tom mais profundo. Accent porque o gráfico é chrome do
 * sistema — identidade de matéria fica no ranking, com `--cat-*`.
 */
function barColor(seconds: number): string {
  if (max.value === 0 || seconds === 0) return 'var(--bg-muted)'
  return completionShadeColor(completionShade(seconds / max.value))
}
</script>

<style scoped>
.period-chart {
  display: flex;
  align-items: flex-end;
  gap: var(--space-2);
  height: 132px;
  padding-top: var(--space-2);
}

.period-chart__col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  gap: var(--space-2);
}

.period-chart__bar {
  width: 100%;
  border-radius: 7px 7px 3px 3px;
  min-height: 3px;
  transition: height var(--transition);
}

.period-chart__label {
  font-size: 10px;
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.period-chart__col--current .period-chart__label {
  color: var(--accent);
  font-weight: 700;
}

@media (prefers-reduced-motion: reduce) {
  .period-chart__bar {
    transition: none;
  }
}
</style>
