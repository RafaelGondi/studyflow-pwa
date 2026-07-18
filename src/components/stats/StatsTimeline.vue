<template>
  <div class="stack-xs">
    <h2 v-if="showTitle" class="section-title">Timeline</h2>

    <AkEmptyState
      v-if="entries.length === 0"
      title="Nenhuma sessão"
      description="Nenhuma sessão neste dia."
    />

    <div v-else class="stack-xs">
      <template v-for="(entry, i) in entries" :key="entryKey(entry, i)">
        <div v-if="entry.type === 'gap'" class="timeline-gap flex-row" style="gap: var(--space-3)">
          <span class="timeline-time text-xs text-muted numeric">
            {{ formatClockTime(entry.startTime) }}
          </span>
          <div class="timeline-gap__body surface-soft flex-row" style="gap: var(--space-2); flex: 1; padding: var(--space-2) var(--space-3)">
            <span class="text-xs text-muted truncate">{{ gapLabel(entry.startTime, entry.endTime) }}</span>
          </div>
        </div>

        <div v-else class="timeline-row flex-row" style="gap: var(--space-3); align-items: flex-start">
          <span class="timeline-time text-xs text-muted numeric" style="padding-top: var(--space-3)">
            {{ formatClockTime(entry.session.startTime) }}
          </span>
          <AkCard padding="sm" class="timeline-card" style="flex: 1">
            <div class="flex-row" style="gap: var(--space-3); align-items: flex-start">
              <div
                class="timeline-accent"
                :style="{ background: getSubject(entry.session.subjectId)?.color ?? 'var(--accent)' }"
              />
              <div class="min-w-0 flex-1">
                <p class="text-sm font-semibold text-primary truncate">
                  {{ getSubject(entry.session.subjectId)?.name ?? 'Matéria' }}
                </p>
                <p class="text-xs font-semibold text-secondary numeric" style="margin-top: 2px">
                  {{ formatDuration(entry.session.duration) }}
                </p>
                <p class="text-xs text-muted numeric" style="margin-top: 2px">
                  {{ formatClockTime(entry.session.startTime) }} – {{ formatClockTime(entry.session.endTime) }}
                </p>
              </div>
              <div class="flex-row" style="gap: var(--space-1)">
                <AkIconButton label="Editar" size="sm" icon="edit-outline" @click="emit('edit', entry.session)" />
                <AkIconButton label="Excluir" size="sm" icon="trash-outline" class="btn-icon--danger" @click="emit('delete', entry.session.id)" />
              </div>
            </div>
          </AkCard>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AkCard, AkEmptyState, AkIconButton } from '@rafael_dias/akoma'
import type { StudySession } from '@/types'
import { formatDuration } from '@/types'
import { useSubjectsStore } from '@/stores/subjects'
import { buildStatsTimeline, formatClockTime, gapLabel, type TimelineEntry } from '@/utils/stats'

const props = defineProps<{ sessions: StudySession[]; showTitle?: boolean }>()
const emit = defineEmits<{
  edit: [session: StudySession]
  delete: [id: string]
}>()

const subjectsStore = useSubjectsStore()
const entries = computed(() => buildStatsTimeline(props.sessions))

function getSubject(id?: string) {
  return id ? subjectsStore.getSubject(id) : undefined
}

function entryKey(entry: TimelineEntry, i: number) {
  if (entry.type === 'gap') return `gap-${i}-${entry.startTime}`
  return entry.session.id
}
</script>

<style scoped>
.timeline-time {
  width: 3rem;
  flex-shrink: 0;
  text-align: right;
}

.timeline-accent {
  width: 3px;
  align-self: stretch;
  min-height: 40px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.timeline-card :deep(.ak-card__body) {
  padding: var(--space-3);
}
</style>
