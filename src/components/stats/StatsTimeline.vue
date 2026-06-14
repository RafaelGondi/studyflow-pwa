<template>
  <div class="space-y-3">
    <h2 v-if="showTitle" class="text-sm font-semibold text-muted uppercase tracking-wider px-1">Timeline</h2>

    <div v-if="entries.length === 0" class="py-8 text-center text-faint text-sm card">
      Nenhuma sessão neste dia
    </div>

    <div v-else class="relative pl-8 space-y-2">
      <!-- Dashed line -->
      <div
        class="absolute left-3 top-2 bottom-2 w-px border-l border-dashed border-app-border"
        aria-hidden="true"
      />

      <template v-for="(entry, i) in entries" :key="entryKey(entry, i)">
        <!-- Gap -->
        <div v-if="entry.type === 'gap'" class="relative">
          <span class="absolute -left-5 top-1/2 -translate-y-1/2 text-[9px] text-faint w-10 text-right">
            {{ formatClockTime(entry.startTime) }}
          </span>
          <div class="flex items-center gap-2 px-3 py-2 rounded-akoma bg-app-soft text-xs text-muted">
            <span class="flex-1 truncate">{{ gapLabel(entry.startTime, entry.endTime) }}</span>
          </div>
        </div>

        <!-- Session -->
        <div v-else class="relative group">
          <span class="absolute -left-5 top-3 text-[9px] text-faint w-10 text-right">
            {{ formatClockTime(entry.session.startTime) }}
          </span>
          <div class="card flex items-start gap-3 p-3 border border-app-border">
            <div
              class="w-1 self-stretch rounded-full flex-shrink-0 min-h-[40px]"
              :style="{ background: getSubject(entry.session.subjectId)?.color ?? 'var(--accent-color)' }"
            />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-primary truncate">
                {{ getSubject(entry.session.subjectId)?.name ?? 'Matéria' }}
              </p>
              <p class="text-xs font-semibold text-secondary mt-0.5">
                {{ formatDuration(entry.session.duration) }}
              </p>
              <p class="text-[11px] text-muted mt-0.5">
                {{ formatClockTime(entry.session.startTime) }} ~ {{ formatClockTime(entry.session.endTime) }}
              </p>
            </div>
            <div class="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button @click="emit('edit', entry.session)" class="w-7 h-7 btn-icon tap-scale">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button @click="emit('delete', entry.session.id)" class="w-7 h-7 btn-icon tap-scale hover:text-red-400">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { StudySession } from '@/types'
import { formatDuration } from '@/types'
import { useSubjectsStore } from '@/stores/subjects'
import { buildStatsTimeline, formatClockTime, gapLabel, type TimelineEntry } from '@/utils/stats'

const props = defineProps<{ sessions: StudySession[] }>()
const emit = defineEmits<{
  edit: [session: StudySession]
  delete: [id: string]
}>()

const subjectsStore = useSubjectsStore()
const entries = computed(() => buildStatsTimeline(props.sessions))

function getSubject(id: string) {
  return subjectsStore.getSubject(id)
}

function entryKey(entry: TimelineEntry, i: number) {
  if (entry.type === 'gap') return `gap-${i}-${entry.startTime}`
  return entry.session.id
}
</script>
