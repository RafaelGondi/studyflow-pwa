<template>
  <div class="card p-4 space-y-3">
    <div class="flex items-center justify-between">
      <button @click="prevMonth" class="w-8 h-8 btn-icon tap-scale">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <span class="text-sm font-semibold text-primary capitalize">{{ monthTitle }}</span>
      <button @click="nextMonth" class="w-8 h-8 btn-icon tap-scale" :disabled="isCurrentMonth">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" :class="isCurrentMonth ? 'opacity-30' : ''"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>

    <div class="grid grid-cols-7 gap-1 text-center">
      <span v-for="d in weekDays" :key="d" class="text-[10px] font-semibold text-muted py-1">{{ d }}</span>
      <template v-for="(cell, i) in cells" :key="i">
        <div v-if="!cell" class="aspect-square" />
        <button
          v-else
          @click="emit('select', cell.date)"
          class="aspect-square rounded-md flex flex-col items-center justify-center text-[11px] font-semibold transition-all tap-scale"
          :class="cell.date === selectedDate
            ? 'bg-accent text-white shadow-akoma ring-2 ring-accent/40'
            : 'text-secondary hover:ring-1 hover:ring-accent/30'"
          :style="cell.date !== selectedDate ? { background: heatBg(cell.seconds) } : undefined"
        >
          <span>{{ cell.day }}</span>
          <span
            v-if="cell.seconds > 0"
            class="text-[8px] leading-none mt-0.5 tabular-nums"
            :class="cell.date === selectedDate ? 'text-white/80' : 'text-muted'"
          >
            {{ shortTime(cell.seconds) }}
          </span>
        </button>
      </template>
    </div>

    <div class="flex items-center justify-between pt-1 border-t border-app-border">
      <div class="flex items-center gap-1">
        <div
          v-for="level in 5"
          :key="level"
          class="w-4 h-3 rounded-sm first:rounded-l last:rounded-r"
          :style="{ background: heatBg(levelThreshold(level - 1)) }"
        />
        <span class="text-[9px] text-muted ml-1">0+ → 5h+</span>
      </div>
      <span class="text-[10px] font-semibold text-muted tabular-nums">
        {{ monthTitle }}: {{ formatShortDayTotal(monthTotal) }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { localDateStr } from '@/types'
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
  // Monday-first offset (Mon=0)
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

function heatBg(seconds: number): string {
  const level = getHeatLevel(seconds)
  const opacities = [0.04, 0.15, 0.3, 0.5, 0.75]
  return `color-mix(in srgb, var(--accent) ${Math.round(opacities[level] * 100)}%, var(--bg-elevated))`
}

function levelThreshold(level: number): number {
  return [0, 3600, 7200, 14400, 18000][level] ?? 0
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
