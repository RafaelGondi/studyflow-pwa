<template>
  <section class="section-block">
    <AkSectionHeader title="Distribuição do tempo" />

    <AkEmptyState
      v-if="subjectRows.length === 0"
      title="Sem dados"
      description="Nenhum estudo corresponde aos filtros selecionados."
    />

    <div v-else class="distribution">
      <div v-if="categoryRows.length > 1" class="distribution__group">
        <span class="distribution__label">Categorias</span>
        <div
          v-for="row in categoryRows"
          :key="row.id"
          class="distribution__row distribution__row--category"
        >
          <span class="distribution__dot" :style="{ background: resolvePaintColor(row.color) }" />
          <div class="distribution__content">
            <div class="distribution__line">
              <span class="distribution__name truncate">{{ row.name }}</span>
              <span class="distribution__value numeric">{{ formatDuration(row.seconds) }}</span>
              <span class="distribution__pct numeric">{{ row.share }}%</span>
            </div>
            <div class="distribution__track">
              <div
                class="distribution__fill"
                :style="{ width: `${row.share}%`, background: resolvePaintColor(row.color) }"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="distribution__group">
        <span class="distribution__label">Matérias estudadas</span>
        <div
          v-for="row in visibleSubjectRows"
          :key="row.id"
          class="distribution__row"
        >
          <div
            class="subject-leading subject-leading--sm"
            :style="{ background: subjectBgMix(row.color, 16) }"
          >
            <SubjectIcon :icon="row.icon" :name="row.name" />
          </div>
          <div class="distribution__content">
            <div class="distribution__line">
              <span class="distribution__name truncate">{{ row.name }}</span>
              <span class="distribution__value numeric">{{ formatDuration(row.seconds) }}</span>
              <span class="distribution__pct numeric">{{ row.share }}%</span>
            </div>
            <div class="distribution__track">
              <div
                class="distribution__fill"
                :style="{ width: `${row.share}%`, background: resolveSubjectColor(row.color) }"
              />
            </div>
          </div>
        </div>

        <button
          v-if="subjectRows.length > INITIAL_ROWS"
          type="button"
          class="distribution__more"
          @click="showAll = !showAll"
        >
          {{ showAll ? 'Mostrar menos' : `Ver todas (${subjectRows.length})` }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { AkEmptyState, AkSectionHeader } from '@rafael_dias/akoma'
import SubjectIcon from '@/components/ui/SubjectIcon.vue'
import { useSubjectsStore } from '@/stores/subjects'
import { formatDuration } from '@/types'
import {
  AKOMA_CAT_COLORS,
  normalizeAkomaColor,
  resolvePaintColor,
  resolveSubjectColor,
  subjectBgMix,
} from '@/utils/colors'
import { totalsBySubject } from '@/utils/studyProgress'
import type { StudySession } from '@/types'

const INITIAL_ROWS = 5
const props = defineProps<{ sessions: StudySession[] }>()
const subjectsStore = useSubjectsStore()
const showAll = ref(false)

const total = computed(() => props.sessions.reduce((sum, session) => sum + session.duration, 0))

const subjectRows = computed(() => {
  const denominator = total.value || 1
  return totalsBySubject(props.sessions).map(({ subjectId, seconds }) => {
    const subject = subjectsStore.getSubject(subjectId)
    return {
      id: subjectId,
      name: subject?.name ?? 'Matéria removida',
      icon: subject?.icon ?? '📚',
      color: normalizeAkomaColor(subject?.color),
      categoryId: subject?.categoryId ?? null,
      seconds,
      share: Math.round((seconds / denominator) * 100),
    }
  })
})

const categoryRows = computed(() => {
  const denominator = total.value || 1
  const totals = new Map<string | null, number>()
  for (const row of subjectRows.value) {
    totals.set(row.categoryId, (totals.get(row.categoryId) ?? 0) + row.seconds)
  }
  return [...totals.entries()]
    .map(([categoryId, seconds]) => {
      const category = categoryId ? subjectsStore.getCategory(categoryId) : null
      return {
        id: categoryId ?? '__none__',
        name: category?.name ?? 'Sem categoria',
        color: normalizeAkomaColor(category?.color ?? AKOMA_CAT_COLORS[5].value),
        seconds,
        share: Math.round((seconds / denominator) * 100),
      }
    })
    .sort((a, b) => b.seconds - a.seconds)
})

const visibleSubjectRows = computed(() =>
  showAll.value ? subjectRows.value : subjectRows.value.slice(0, INITIAL_ROWS),
)

watch(() => props.sessions, () => { showAll.value = false })
</script>

<style scoped>
.distribution,
.distribution__group {
  display: flex;
  flex-direction: column;
}

.distribution {
  gap: var(--space-5);
}

.distribution__group {
  gap: var(--space-3);
}

.distribution__label {
  font-size: 11px;
  font-weight: 650;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.distribution__row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.distribution__dot {
  width: 10px;
  height: 10px;
  margin-inline: 13px;
  border-radius: var(--radius-full);
  flex: 0 0 auto;
}

.distribution__content {
  flex: 1;
  min-width: 0;
}

.distribution__line {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto 36px;
  align-items: baseline;
  gap: var(--space-2);
}

.distribution__name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.distribution__value {
  font-size: 13px;
  font-weight: 650;
  color: var(--text);
}

.distribution__pct {
  text-align: right;
  font-size: 11px;
  color: var(--text-tertiary);
}

.distribution__track {
  height: 5px;
  margin-top: var(--space-2);
  overflow: hidden;
  border-radius: var(--radius-full);
  background: var(--bg-muted);
}

.distribution__fill {
  height: 100%;
  min-width: 3px;
  border-radius: inherit;
  transition: width var(--transition);
}

.distribution__more {
  align-self: flex-start;
  padding: var(--space-1) 0;
  border: 0;
  background: transparent;
  color: var(--accent);
  font: inherit;
  font-size: 13px;
  font-weight: 650;
  cursor: pointer;
}

@media (prefers-reduced-motion: reduce) {
  .distribution__fill { transition: none; }
}
</style>
