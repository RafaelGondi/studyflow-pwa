<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between px-1">
      <h2 class="text-sm font-semibold text-muted uppercase tracking-wider">Hoje</h2>
      <span class="text-sm font-bold text-primary">{{ formatDuration(totalSeconds) }}</span>
    </div>

    <div v-if="items.length === 0" class="py-6 text-center text-faint text-sm">
      Nenhuma sessão registrada hoje
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="item in items"
        :key="item.subjectId"
        class="flex items-center gap-3 p-3 rounded-md bg-app-card border border-app-border"
      >
        <div
          class="w-9 h-9 rounded-sm flex items-center justify-center text-lg flex-shrink-0"
          :style="{ background: `${item.color}20` }"
        >
          {{ item.icon }}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between mb-1">
            <span class="text-sm font-medium text-primary truncate">{{ item.name }}</span>
            <span class="text-xs font-semibold text-secondary ml-2 flex-shrink-0">{{ formatDuration(item.seconds) }}</span>
          </div>
          <div class="h-1.5 rounded-full bg-app-elevated overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500"
              :style="{ width: `${item.pct}%`, background: item.color }"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSessionsStore } from '@/stores/sessions'
import { useSubjectsStore } from '@/stores/subjects'
import { formatDuration } from '@/types'

const sessionsStore = useSessionsStore()
const subjectsStore = useSubjectsStore()

const totalSeconds = computed(() => sessionsStore.todayTotalSeconds)

const items = computed(() => {
  const bySubject = sessionsStore.todayBySubject
  const total = totalSeconds.value || 1
  return [...bySubject.entries()]
    .map(([subjectId, seconds]) => {
      const s = subjectsStore.getSubject(subjectId)
      return {
        subjectId,
        name: s?.name ?? 'Desconhecida',
        color: s?.color ?? 'var(--accent-color)',
        icon: s?.icon ?? '📚',
        seconds,
        pct: Math.round((seconds / total) * 100),
      }
    })
    .sort((a, b) => b.seconds - a.seconds)
})
</script>
