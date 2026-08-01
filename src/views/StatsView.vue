<template>
  <div class="ak-app-page">
    <AkPageHeader
      label="Retrospectiva"
      title="Progresso"
      :meta="periodMeta.meta"
      size="md"
    />

    <div class="chip-scroll reveal reveal-d1">
      <AkChip
        v-for="p in PERIOD_ORDER"
        :key="p"
        :active="period === p"
        @click="period = p"
      >
        {{ PERIOD_META[p].label }}
      </AkChip>
    </div>

    <div class="ak-app-scroll page-body reveal reveal-d2">
      <section v-if="hasScopeFilters" class="scope-filters" aria-label="Filtros do progresso">
        <div v-if="availableCategoryFilters.length > 1" class="scope-filters__group">
          <span class="scope-filters__label">Categoria</span>
          <div class="scope-filters__chips">
            <AkChip :active="selectedCategoryId === null" @click="selectCategory(null)">
              Todas
            </AkChip>
            <AkChip
              v-for="category in availableCategoryFilters"
              :key="category.id"
              :active="selectedCategoryId === category.id"
              :color="category.color"
              @click="selectCategory(category.id)"
            >
              {{ category.name }}
            </AkChip>
          </div>
        </div>

        <label v-if="availableSubjectFilters.length > 1" class="scope-filters__group">
          <span class="scope-filters__label">Matéria</span>
          <select v-model="selectedSubjectId" class="ak-field__control ak-field__control--md field-select">
            <option value="">Todas as matérias</option>
            <option v-for="subject in availableSubjectFilters" :key="subject.id" :value="subject.id">
              {{ subject.name }}
            </option>
          </select>
        </label>
      </section>

      <section v-if="periodDates.length" class="progress-hero reveal reveal-d1">
        <span class="progress-hero__eyebrow">{{ heroEyebrow }}</span>

        <div class="progress-hero__row">
          <span class="progress-hero__time numeric">
            {{ formatDuration(studyTotalSeconds) }}
          </span>
          <AkBadge :variant="deltaVariant" :label="deltaLabel" />
        </div>

        <p class="progress-hero__vs">{{ comparisonMessage }}</p>

        <div class="progress-metrics">
          <div class="progress-metric">
            <span class="progress-metric__value numeric">{{ activeDayCount }}</span>
            <span class="progress-metric__label">dias ativos</span>
          </div>
          <div class="progress-metric">
            <span class="progress-metric__value numeric">{{ formatDuration(averagePerActiveDay) }}</span>
            <span class="progress-metric__label">por dia ativo</span>
          </div>
          <div class="progress-metric">
            <span class="progress-metric__value numeric">{{ sessions.length }}</span>
            <span class="progress-metric__label">sessões</span>
          </div>
          <div class="progress-metric">
            <span class="progress-metric__value numeric">{{ formatDuration(averagePerSession) }}</span>
            <span class="progress-metric__label">por sessão</span>
          </div>
        </div>
      </section>

      <ProgressInsights
        :sessions="sessions"
        :dates="periodDates"
        :subject-filtered="!!selectedSubjectId"
      />

      <PeriodChart :title="periodMeta.chartTitle" :period="period" :buckets="buckets" />

      <SubjectRanking :sessions="sessions" />

      <section class="section-block">
        <AkSectionHeader title="Histórico por dia">
          <template #action>
            <span v-if="groupedTimeline.length" class="text-xs text-muted">
              {{ groupedTimeline.length }} {{ groupedTimeline.length === 1 ? 'dia' : 'dias' }}
            </span>
          </template>
        </AkSectionHeader>

        <AkEmptyState
          v-if="groupedTimeline.length === 0"
          title="Nenhum registro"
          description="Nada corresponde aos filtros neste período."
        />

        <div v-else class="history-days">
          <details
            v-for="(group, groupIndex) in visibleTimeline"
            :key="group.date"
            class="history-day"
            :open="groupIndex === 0"
          >
            <summary class="history-day__summary">
              <span>
                <strong>{{ formatGroupDate(group.date) }}</strong>
                <small>{{ group.sessionCount }} {{ group.sessionCount === 1 ? 'sessão' : 'sessões' }}</small>
              </span>
              <span class="history-day__total numeric">{{ formatDuration(group.studyTotal) }}</span>
            </summary>

            <AkList>
              <template v-for="(item, i) in group.items" :key="item.type === 'gap' ? `gap-${group.date}-${i}` : item.session.id">
                <li v-if="item.type === 'gap'" class="text-xs text-muted gap-row">
                  ↕ ~{{ item.label }} entre sessões
                </li>

                <AkListRow v-else-if="item.type === 'study'" :divider="i < group.items.length - 1">
                  <template #leading>
                    <div class="subject-leading subject-leading--sm">
                      {{ getSubject(item.session.subjectId)?.icon ?? '📚' }}
                    </div>
                  </template>

                  <span class="truncate">
                    {{ getSubject(item.session.subjectId)?.name ?? 'Matéria' }}
                  </span>

                  <template #subtitle>
                    <span class="text-xs text-muted session-times">
                      {{ formatSessionTimeRange(item.session, formatTime) }}
                    </span>
                  </template>

                  <template #trailing>
                    <span class="numeric text-sm shrink-0 text-secondary">
                      {{ formatDuration(item.session.duration) }}
                    </span>
                    <AkIconButton label="Editar" size="sm" icon="edit-outline" @click="editingSession = item.session" />
                    <AkIconButton label="Excluir" size="sm" icon="trash-outline" @click="deleteSession(item.session.id)" />
                  </template>
                </AkListRow>
              </template>
            </AkList>
          </details>

          <button
            v-if="groupedTimeline.length > HISTORY_PREVIEW_DAYS"
            type="button"
            class="history-days__more"
            @click="showAllHistory = !showAllHistory"
          >
            {{ showAllHistory ? 'Mostrar menos dias' : `Ver histórico completo (${groupedTimeline.length} dias)` }}
          </button>
        </div>
      </section>
    </div>

    <SessionEditModal
      :show="!!editingSession"
      :session="editingSession"
      @close="editingSession = null"
      @saved="reloadAll(); editingSession = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  AkBadge, AkChip, AkEmptyState, AkIconButton, AkList, AkListRow,
  AkPageHeader, AkSectionHeader,
} from '@rafael_dias/akoma'
import { useSessionsStore } from '@/stores/sessions'
import { useSubjectsStore } from '@/stores/subjects'
import PeriodChart from '@/components/stats/PeriodChart.vue'
import ProgressInsights from '@/components/stats/ProgressInsights.vue'
import SubjectRanking from '@/components/stats/SubjectRanking.vue'
import SessionEditModal from '@/components/sessions/SessionEditModal.vue'
import { useAppToast } from '@/composables/useAppToast'
import { useConfirmSheet } from '@/composables/useConfirmSheet'
import { formatDuration, localDateStr, isStudySession } from '@/types'
import { buildTimeline, formatSessionTimeRange } from '@/utils/timeline'
import {
  PERIOD_META,
  PERIOD_ORDER,
  buildPeriodBuckets,
  comparePeriods,
  enumerateDates,
  getActiveStudyDays,
  getPeriodRange,
  getPreviousPeriodRange,
  totalStudySeconds,
} from '@/utils/studyProgress'
import { AKOMA_CAT_COLORS, normalizeAkomaColor } from '@/utils/colors'
import type { StudyPeriod } from '@/utils/studyProgress'
import type { StudySession } from '@/types'

const UNCATEGORIZED = '__uncategorized__'
const HISTORY_PREVIEW_DAYS = 3
const sessionsStore = useSessionsStore()
const subjectsStore = useSubjectsStore()
const toast = useAppToast()
const confirmSheet = useConfirmSheet()

const editingSession = ref<StudySession | null>(null)
const period = ref<StudyPeriod>('week')
const selectedCategoryId = ref<string | null>(null)
const selectedSubjectId = ref('')
const previousSessions = ref<StudySession[]>([])
const showAllHistory = ref(false)

const periodMeta = computed(() => PERIOD_META[period.value])
const periodRange = computed(() => getPeriodRange(period.value))
const periodDates = computed(() => enumerateDates(periodRange.value.from, periodRange.value.to))
const rawStudySessions = computed(() => sessionsStore.rangeSessions.filter(isStudySession))

function categoryIdFor(session: StudySession): string {
  const categoryId = session.subjectId
    ? subjectsStore.getSubject(session.subjectId)?.categoryId
    : null
  return categoryId ?? UNCATEGORIZED
}

function applyScope(source: StudySession[]): StudySession[] {
  return source.filter((session) => {
    if (!isStudySession(session)) return false
    if (selectedCategoryId.value && categoryIdFor(session) !== selectedCategoryId.value) return false
    if (selectedSubjectId.value && session.subjectId !== selectedSubjectId.value) return false
    return true
  })
}

const sessions = computed(() => applyScope(rawStudySessions.value))
const scopedPreviousSessions = computed(() => applyScope(previousSessions.value))

const availableCategoryFilters = computed(() => {
  const activeIds = new Set(rawStudySessions.value.map(categoryIdFor))
  return [...activeIds].map((id) => {
    if (id === UNCATEGORIZED) {
      return { id, name: 'Sem categoria', color: AKOMA_CAT_COLORS[5].value }
    }
    const category = subjectsStore.getCategory(id)
    return {
      id,
      name: category?.name ?? 'Categoria removida',
      color: normalizeAkomaColor(category?.color),
    }
  }).sort((a, b) => a.name.localeCompare(b.name))
})

const availableSubjectFilters = computed(() => {
  const activeIds = new Set(
    rawStudySessions.value
      .filter(session => !selectedCategoryId.value || categoryIdFor(session) === selectedCategoryId.value)
      .map(session => session.subjectId)
      .filter((id): id is string => !!id),
  )
  return [...activeIds]
    .map(id => subjectsStore.getSubject(id))
    .filter((subject): subject is NonNullable<typeof subject> => !!subject)
    .sort((a, b) => a.name.localeCompare(b.name))
})

const hasScopeFilters = computed(() =>
  availableCategoryFilters.value.length > 1 || availableSubjectFilters.value.length > 1,
)

const selectedCategory = computed(() =>
  availableCategoryFilters.value.find(category => category.id === selectedCategoryId.value),
)
const selectedSubject = computed(() =>
  selectedSubjectId.value ? subjectsStore.getSubject(selectedSubjectId.value) : undefined,
)
const heroEyebrow = computed(() => {
  if (selectedSubject.value) return `Tempo em ${selectedSubject.value.name}`
  if (selectedCategory.value) return `Tempo em ${selectedCategory.value.name}`
  return 'Tempo registrado'
})

const studyTotalSeconds = computed(() => totalStudySeconds(sessions.value))
const previousSeconds = computed(() => totalStudySeconds(scopedPreviousSessions.value))
const activeDayCount = computed(() => {
  const active = getActiveStudyDays(sessions.value)
  return periodDates.value.filter(date => active.has(date)).length
})
const averagePerActiveDay = computed(() =>
  activeDayCount.value ? Math.round(studyTotalSeconds.value / activeDayCount.value) : 0,
)
const averagePerSession = computed(() =>
  sessions.value.length ? Math.round(studyTotalSeconds.value / sessions.value.length) : 0,
)

const buckets = computed(() =>
  buildPeriodBuckets(period.value, periodDates.value, sessions.value),
)
const comparison = computed(() => comparePeriods(studyTotalSeconds.value, previousSeconds.value))
const deltaVariant = computed(() => {
  if (!comparison.value.hasBaseline) return 'neutral' as const
  if (comparison.value.direction === 'up') return 'success' as const
  if (comparison.value.direction === 'down') return 'warning' as const
  return 'neutral' as const
})
const deltaLabel = computed(() => {
  const { hasBaseline, direction, deltaSeconds } = comparison.value
  if (!hasBaseline) return 'sem comparação'
  if (direction === 'flat') return 'estável'
  return `${direction === 'up' ? '▲' : '▼'} ${formatDuration(Math.abs(deltaSeconds))}`
})
const comparisonMessage = computed(() => {
  const { hasBaseline, direction, previousSeconds: previous } = comparison.value
  const meta = periodMeta.value
  if (!hasBaseline) return `Sem registros equivalentes ${meta.prevPrep} ${meta.prevName}.`
  if (direction === 'flat') return `Ritmo praticamente igual ${meta.prevArticle} ${meta.prevName}.`
  return `${direction === 'up' ? 'A mais' : 'A menos'} que ${meta.prevPrep} ${meta.prevName} (${formatDuration(previous)}).`
})

const groupedTimeline = computed(() => {
  const map = new Map<string, StudySession[]>()
  for (const session of sessions.value) {
    if (!map.has(session.date)) map.set(session.date, [])
    map.get(session.date)!.push(session)
  }
  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, daySessions]) => ({
      date,
      items: buildTimeline(daySessions),
      sessionCount: daySessions.length,
      studyTotal: totalStudySeconds(daySessions),
    }))
})
const visibleTimeline = computed(() =>
  showAllHistory.value ? groupedTimeline.value : groupedTimeline.value.slice(0, HISTORY_PREVIEW_DAYS),
)

function selectCategory(categoryId: string | null) {
  selectedCategoryId.value = categoryId
  selectedSubjectId.value = ''
  showAllHistory.value = false
}
function getSubject(id?: string) { return id ? subjectsStore.getSubject(id) : undefined }
function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
function formatGroupDate(date: string) {
  const parsed = new Date(date + 'T12:00:00')
  if (date === localDateStr()) return 'Hoje'
  return parsed.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })
}

async function deleteSession(id: string) {
  const confirmed = await confirmSheet.ask({
    title: 'Excluir registro',
    message: 'Este registro será removido permanentemente.',
  })
  if (!confirmed) return
  await sessionsStore.remove(id)
  toast.success('Registro excluído')
  await reloadAll()
}
async function loadRange() {
  const { from, to } = periodRange.value
  await sessionsStore.loadRange(from, to)
}
async function loadPreviousPeriod() {
  const { from, to } = getPreviousPeriodRange(period.value)
  previousSessions.value = await sessionsStore.fetchRange(from, to)
}
async function reloadAll() {
  await Promise.all([loadRange(), loadPreviousPeriod()])
}

watch(period, async () => {
  selectedCategoryId.value = null
  selectedSubjectId.value = ''
  showAllHistory.value = false
  await reloadAll()
})
watch(selectedSubjectId, () => { showAllHistory.value = false })
watch(availableCategoryFilters, (categories) => {
  if (selectedCategoryId.value && !categories.some(category => category.id === selectedCategoryId.value)) {
    selectCategory(null)
  }
})
watch(availableSubjectFilters, (subjects) => {
  if (selectedSubjectId.value && !subjects.some(subject => subject.id === selectedSubjectId.value)) {
    selectedSubjectId.value = ''
  }
})
onMounted(reloadAll)
</script>

<style scoped>
.scope-filters {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding-bottom: var(--space-5);
  border-bottom: 1px solid var(--border);
}

.scope-filters__group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.scope-filters__label {
  font-size: 11px;
  font-weight: 650;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.scope-filters__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.progress-hero__eyebrow {
  font-size: 12px;
  font-weight: 650;
  color: var(--text-secondary);
}

.progress-hero__row {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
  flex-wrap: wrap;
  margin-top: var(--space-1);
}

.progress-hero__time {
  font-family: var(--font-display);
  font-size: clamp(38px, 11vw, 46px);
  font-weight: 650;
  letter-spacing: -0.045em;
  line-height: 1;
  color: var(--text);
}

.progress-hero__vs {
  margin: var(--space-2) 0 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.progress-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4) var(--space-3);
  margin-top: var(--space-5);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border);
}

.progress-metric {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.progress-metric__value {
  font-size: 18px;
  font-weight: 650;
  color: var(--text);
}

.progress-metric__label {
  font-size: 11px;
  color: var(--text-tertiary);
}

.history-days {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.history-day {
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--bg-elevated);
}

.history-day__summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  cursor: pointer;
  list-style: none;
}

.history-day__summary::-webkit-details-marker { display: none; }
.history-day__summary::before {
  content: '›';
  color: var(--text-tertiary);
  font-size: 20px;
  line-height: 1;
  transition: transform var(--transition);
}
.history-day[open] .history-day__summary::before { transform: rotate(90deg); }

.history-day__summary > span:first-of-type {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.history-day__summary strong {
  overflow: hidden;
  color: var(--text);
  font-size: 14px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-day__summary small {
  color: var(--text-tertiary);
  font-size: 11px;
}

.history-day__total {
  color: var(--text);
  font-size: 13px;
  font-weight: 650;
}

.history-day :deep(.ak-list) {
  border: 0;
  border-top: 1px solid var(--border);
  border-radius: 0;
}

.history-days__more {
  align-self: center;
  padding: var(--space-3);
  border: 0;
  background: transparent;
  color: var(--accent);
  font: inherit;
  font-size: 13px;
  font-weight: 650;
  cursor: pointer;
}

.gap-row {
  padding: var(--space-2) var(--space-4);
  line-height: 1.4;
}

.session-times {
  display: block;
  line-height: 1.45;
  white-space: normal;
}

@media (prefers-reduced-motion: reduce) {
  .history-day__summary::before { transition: none; }
}
</style>
