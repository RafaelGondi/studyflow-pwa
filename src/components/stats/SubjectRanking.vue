<template>
  <section class="section-block">
    <AkSectionHeader title="Matérias" />

    <AkEmptyState
      v-if="rows.length === 0"
      title="Nenhuma matéria"
      description="Cadastre matérias para ver a distribuição do seu tempo."
    />

    <div v-else class="subject-rank">
      <div
        v-for="row in rows"
        :key="row.id"
        class="subject-rank__row"
      >
        <div
          class="subject-leading subject-leading--sm"
          :style="{ background: subjectBgMix(row.color, 16) }"
        >
          {{ row.icon }}
        </div>

        <div class="subject-rank__mid">
          <span class="subject-rank__name truncate">{{ row.name }}</span>

          <div class="subject-rank__track">
            <div
              class="subject-rank__fill"
              :style="{
                width: `${row.share}%`,
                background: resolveSubjectColor(row.color),
              }"
            />
          </div>

          <span v-if="row.seconds === 0" class="subject-rank__idle">
            sem estudo no período
          </span>
        </div>

        <span class="subject-rank__value numeric">
          {{ row.seconds > 0 ? formatDuration(row.seconds) : '—' }}
        </span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AkEmptyState, AkSectionHeader } from '@rafael_dias/akoma'
import { useSubjectsStore } from '@/stores/subjects'
import { formatDuration } from '@/types'
import { resolveSubjectColor, subjectBgMix } from '@/utils/colors'
import { totalsBySubject } from '@/utils/studyProgress'
import type { StudySession } from '@/types'

const props = defineProps<{ sessions: StudySession[] }>()

const subjectsStore = useSubjectsStore()

/**
 * Ranking por tempo no período. Matérias sem registro entram no fim marcadas
 * como ociosas — é a informação acionável que o donut não comportava.
 */
const rows = computed(() => {
  const totals = totalsBySubject(props.sessions)
  const secondsById = new Map(totals.map(t => [t.subjectId, t.seconds]))
  const top = totals[0]?.seconds ?? 0

  return subjectsStore.subjects
    .map((subject) => {
      const seconds = secondsById.get(subject.id) ?? 0
      return {
        id: subject.id,
        name: subject.name,
        icon: subject.icon,
        color: subject.color,
        seconds,
        share: top > 0 ? Math.max((seconds / top) * 100, seconds > 0 ? 4 : 0) : 0,
      }
    })
    .sort((a, b) => b.seconds - a.seconds || a.name.localeCompare(b.name))
})
</script>

<style scoped>
.subject-rank {
  display: flex;
  flex-direction: column;
}

.subject-rank__row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) 0;
}

.subject-rank__row + .subject-rank__row {
  border-top: 1px solid var(--border);
}

.subject-rank__mid {
  flex: 1;
  min-width: 0;
}

.subject-rank__name {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.subject-rank__track {
  height: 5px;
  margin-top: var(--space-2);
  border-radius: var(--radius-full);
  background: var(--bg-muted);
  overflow: hidden;
}

.subject-rank__fill {
  height: 100%;
  border-radius: inherit;
  transition: width var(--transition);
}

.subject-rank__idle {
  display: block;
  margin-top: var(--space-1);
  font-size: 11px;
  color: var(--text-tertiary);
}

.subject-rank__value {
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 650;
  color: var(--text);
  font-variant-numeric: tabular-nums;
}

@media (prefers-reduced-motion: reduce) {
  .subject-rank__fill {
    transition: none;
  }
}
</style>
