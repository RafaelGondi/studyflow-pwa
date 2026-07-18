<template>
  <AkCard padding="md" class="stack-xs">
    <div class="flex-between">
      <AkIconButton label="Mês anterior" size="sm" icon="arrow-left-outline" @click="prevMonth" />
      <span class="text-sm font-semibold text-primary capitalize">{{ monthTitle }}</span>
      <AkIconButton
        label="Próximo mês"
        size="sm"
        icon="arrow-right-outline"
        :disabled="isCurrentMonth"
        @click="nextMonth"
      />
    </div>

    <div class="calendar-grid">
      <span v-for="d in weekDays" :key="d" class="calendar-weekday stat-label">{{ d }}</span>
      <template v-for="(cell, i) in cells" :key="i">
        <div v-if="!cell" class="calendar-cell calendar-cell--empty" />
        <button
          v-else
          type="button"
          class="calendar-cell tap-scale"
          :class="cellClasses(cell)"
          @click="emit('select', cell.date)"
        >
          <span>{{ cell.day }}</span>
          <span
            v-if="cell.seconds > 0"
            class="calendar-cell__sub numeric"
            :class="cellSubClass(cell)"
          >
            {{ shortTime(cell.seconds) }}
          </span>
        </button>
      </template>
    </div>

    <div class="flex-between calendar-legend">
      <div class="flex-row calendar-legend__swatches">
        <div
          v-for="level in 5"
          :key="level"
          class="heat-swatch"
          :class="completionShadeClass(heatLevelToShade(level - 1))"
        />
        <span class="text-xs text-muted calendar-legend__label">0+ → 5h+</span>
      </div>
      <span class="text-xs font-semibold text-muted numeric">
        {{ monthTitle }}: {{ formatShortDayTotal(monthTotal) }}
      </span>
    </div>
  </AkCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AkCard, AkIconButton } from '@rafael_dias/akoma'
import { localDateStr } from '@/types'
import {
  completionShadeClass,
  completionShadeNeedsContrast,
  heatLevelToShade,
} from '@/utils/completionShade'
import { getHeatLevel, formatShortDayTotal, monthLabel } from '@/utils/stats'

const props = defineProps<{
  year: number
  month: number
  selectedDate: string
  dailyTotals: Map<string, number>
}>()

const emit = defineEmits<{
  select: [date: string]
  'update:month': [year: number, month: number]
}>()

const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

const monthTitle = computed(() => monthLabel(props.year, props.month))

const isCurrentMonth = computed(() => {
  const now = new Date()
  return props.year === now.getFullYear() && props.month === now.getMonth()
})

const monthTotal = computed(() => {
  let total = 0
  for (const [date, secs] of props.dailyTotals) {
    const d = new Date(date + 'T12:00:00')
    if (d.getFullYear() === props.year && d.getMonth() === props.month) {
      total += secs
    }
  }
  return total
})

const cells = computed(() => {
  const first = new Date(props.year, props.month, 1)
  const last = new Date(props.year, props.month + 1, 0)
  const startPad = (first.getDay() + 6) % 7
  const result: Array<{ date: string; day: number; seconds: number } | null> = []

  for (let i = 0; i < startPad; i++) result.push(null)

  for (let day = 1; day <= last.getDate(); day++) {
    const d = new Date(props.year, props.month, day)
    const date = localDateStr(d)
    result.push({
      date,
      day,
      seconds: props.dailyTotals.get(date) ?? 0,
    })
  }

  return result
})

function cellClasses(cell: { date: string; seconds: number }) {
  if (cell.date === props.selectedDate) {
    return ['calendar-cell--selected']
  }
  return [completionShadeClass(heatLevelToShade(getHeatLevel(cell.seconds)))]
}

function cellSubClass(cell: { date: string; seconds: number }) {
  if (cell.date === props.selectedDate) return 'text-on-accent'
  const shade = heatLevelToShade(getHeatLevel(cell.seconds))
  return completionShadeNeedsContrast(shade) ? 'text-on-accent' : 'text-muted'
}

function shortTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}`
  return `${m}m`
}

function prevMonth() {
  const d = new Date(props.year, props.month - 1, 1)
  emit('update:month', d.getFullYear(), d.getMonth())
}

function nextMonth() {
  if (isCurrentMonth.value) return
  const d = new Date(props.year, props.month + 1, 1)
  emit('update:month', d.getFullYear(), d.getMonth())
}
</script>

<style scoped>
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--space-1);
  text-align: center;
}

.calendar-weekday {
  padding: var(--space-1) 0;
  font-size: 10px;
}

.calendar-cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  font-size: 11px;
  font-weight: 600;
  border: none;
  transition: box-shadow var(--transition);
}

.calendar-cell--selected {
  background: var(--accent);
  color: var(--accent-contrast);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 40%, transparent);
}

.calendar-cell:hover:not(.calendar-cell--selected) {
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent) 30%, transparent);
}

.calendar-cell--empty {
  pointer-events: none;
}

.calendar-cell__sub {
  font-size: 8px;
  line-height: 1;
  margin-top: 2px;
}

.calendar-legend {
  padding-top: var(--space-2);
  border-top: 1px solid var(--border);
}

.calendar-legend__swatches {
  gap: var(--space-1);
  align-items: center;
}

.calendar-legend__label {
  margin-left: var(--space-1);
}

.heat-swatch {
  width: 16px;
  height: 12px;
  border-radius: 2px;
}

.heat-swatch:first-child {
  border-top-left-radius: var(--radius-sm);
  border-bottom-left-radius: var(--radius-sm);
}

.heat-swatch:last-of-type {
  border-top-right-radius: var(--radius-sm);
  border-bottom-right-radius: var(--radius-sm);
}
</style>
