<template>
  <div class="stack-xs">
    <h2 v-if="showTitle" class="section-title">Timeline</h2>

    <AkEmptyState
      v-if="entries.length === 0"
      title="Nenhuma sessão"
      description="Nenhuma sessão neste dia."
    />

    <AkList v-else>
      <template v-for="(entry, i) in entries" :key="entryKey(entry, i)">
        <li v-if="entry.type === 'gap'" class="timeline-gap">
          <span class="timeline-time text-xs text-muted numeric">
            {{ formatClockTime(entry.startTime) }}
          </span>
          <span class="text-xs text-muted truncate">
            {{ gapLabel(entry.startTime, entry.endTime) }}
          </span>
        </li>

        <AkListRow
          v-else
          :divider="i < entries.length - 1"
        >
          <template #leading>
            <div class="timeline-leading">
              <span class="timeline-time text-xs text-muted numeric">
                {{ formatClockTime(entry.session.startTime) }}
              </span>
              <span
                class="timeline-accent"
                :style="{ background: normalizeAkomaColor(getSubject(entry.session.subjectId)?.color) }"
              />
            </div>
          </template>

          <span class="truncate">
            {{ getSubject(entry.session.subjectId)?.name ?? 'Matéria' }}
          </span>

          <template #subtitle>
            <span class="text-xs text-muted numeric">
              {{ formatDuration(entry.session.duration) }}
              · {{ formatClockTime(entry.session.startTime) }} – {{ formatClockTime(entry.session.endTime) }}
            </span>
          </template>

          <template #trailing>
            <AkIconButton label="Editar" size="sm" icon="edit-outline" @click="emit('edit', entry.session)" />
            <AkIconButton label="Excluir" size="sm" icon="trash-outline" @click="emit('delete', entry.session.id)" />
          </template>
        </AkListRow>
      </template>
    </AkList>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AkEmptyState, AkIconButton, AkList, AkListRow } from '@rafael_dias/akoma'
import type { StudySession } from '@/types'
import { formatDuration } from '@/types'
import { useSubjectsStore } from '@/stores/subjects'
import { buildStatsTimeline, formatClockTime, gapLabel, type TimelineEntry } from '@/utils/stats'
import { normalizeAkomaColor } from '@/utils/colors'

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
.timeline-gap {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) 0;
  list-style: none;
}

.timeline-leading {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.timeline-time {
  width: 2.75rem;
  flex-shrink: 0;
  text-align: right;
}

.timeline-accent {
  width: 3px;
  height: 2rem;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}
</style>
