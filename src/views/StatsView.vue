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
      <section v-if="periodDates.length" class="progress-hero reveal reveal-d1">
        <span class="progress-hero__eyebrow">Tempo estudado</span>

        <div class="progress-hero__row">
          <span class="progress-hero__time numeric">
            {{ formatDuration(studyTotalSeconds) }}
          </span>
          <AkBadge :variant="deltaVariant" :label="deltaLabel" />
        </div>

        <p class="progress-hero__vs">{{ comparisonMessage }}</p>

        <div class="progress-hero__consistency">
          <p class="progress-hero__days">
            <strong>{{ activeDayCount }} de {{ periodDates.length }}</strong>
            dias com estudo
          </p>
          <AkProgress
            :value="activeDayCount"
            :max="periodDates.length || 1"
            size="md"
          />
        </div>
      </section>

      <PeriodChart :title="periodMeta.chartTitle" :buckets="buckets" />

      <SubjectRanking :sessions="sessions" />

      <section class="section-block">
        <AkSectionHeader title="Histórico" />

        <AkEmptyState
          v-if="groupedTimeline.length === 0"
          title="Nenhum registro"
          description="Nada neste período ainda."
        />

        <template v-for="group in groupedTimeline" :key="group.date">
          <AkSectionHeader :title="formatGroupDate(group.date)">
            <template #action>
              <span class="text-xs text-muted numeric">
                {{ formatDuration(group.studyTotal) }}
              </span>
            </template>
          </AkSectionHeader>

          <AkList>
            <template v-for="(item, i) in group.items" :key="item.type === 'gap' ? `gap-${group.date}-${i}` : item.session.id">
              <li v-if="item.type === 'gap'" class="text-xs text-muted gap-row">
                ↕ ~{{ item.label }} entre sessões
              </li>

              <li v-else-if="item.type === 'break'" class="text-xs text-muted gap-row">
                ↕ ~{{ formatDuration(item.session.duration) }} de intervalo
                <span class="gap-row__times">
                  {{ formatTime(item.session.startTime) }} – {{ formatTime(item.session.endTime) }}
                </span>
              </li>

              <AkListRow
                v-else
                :divider="i < group.items.length - 1"
              >
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
        </template>
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
  AkPageHeader, AkProgress, AkSectionHeader,
} from '@rafael_dias/akoma'
import { useSessionsStore } from '@/stores/sessions'
import { useSubjectsStore } from '@/stores/subjects'
import PeriodChart from '@/components/stats/PeriodChart.vue'
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
import type { StudyPeriod } from '@/utils/studyProgress'
import type { StudySession } from '@/types'

const sessionsStore = useSessionsStore()
const subjectsStore = useSubjectsStore()
const toast = useAppToast()
const confirmSheet = useConfirmSheet()
const editingSession = ref<StudySession | null>(null)

const period = ref<StudyPeriod>('week')
const periodMeta = computed(() => PERIOD_META[period.value])

const sessions = computed(() => sessionsStore.rangeSessions.filter(isStudySession))
const studyTotalSeconds = computed(() => totalStudySeconds(sessions.value))
const previousSeconds = ref(0)

const periodRange = computed(() => getPeriodRange(period.value))
const periodDates = computed(() => enumerateDates(periodRange.value.from, periodRange.value.to))
const activeDayCount = computed(() => {
  const active = getActiveStudyDays(sessionsStore.rangeSessions)
  return periodDates.value.filter(date => active.has(date)).length
})

const buckets = computed(() =>
  buildPeriodBuckets(period.value, periodDates.value, sessions.value),
)

const comparison = computed(() =>
  comparePeriods(studyTotalSeconds.value, previousSeconds.value),
)

const deltaVariant = computed(() => {
  if (!comparison.value.hasBaseline) return 'neutral' as const
  if (comparison.value.direction === 'up') return 'success' as const
  if (comparison.value.direction === 'down') return 'warning' as const
  return 'neutral' as const
})

const deltaLabel = computed(() => {
  const { hasBaseline, direction, deltaSeconds } = comparison.value
  if (!hasBaseline) return 'primeiro registro'
  if (direction === 'flat') return 'estável'
  return `${direction === 'up' ? '▲' : '▼'} ${formatDuration(Math.abs(deltaSeconds))}`
})

const comparisonMessage = computed(() => {
  const { hasBaseline, direction, previousSeconds: prev } = comparison.value
  const meta = periodMeta.value
  if (!hasBaseline) return `Sem registro ${meta.prevPrep} ${meta.prevName} para comparar.`
  if (direction === 'flat') return `praticamente igual ${meta.prevArticle} ${meta.prevName}`
  const word = direction === 'up' ? 'a mais' : 'a menos'
  return `${word} que ${meta.prevPrep} ${meta.prevName} (${formatDuration(prev)})`
})

const groupedTimeline = computed(() => {
  const map = new Map<string, StudySession[]>()
  for (const s of sessionsStore.rangeSessions) {
    if (!map.has(s.date)) map.set(s.date, [])
    map.get(s.date)!.push(s)
  }
  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, daySessions]) => ({
      date,
      items: buildTimeline(daySessions),
      studyTotal: daySessions.filter(isStudySession).reduce((a, s) => a + s.duration, 0),
    }))
    .filter(group => group.items.some(i => i.type === 'study'))
})

function getSubject(id?: string) { return id ? subjectsStore.getSubject(id) : undefined }
function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
function formatGroupDate(date: string) {
  const d = new Date(date + 'T12:00:00')
  if (date === localDateStr()) return 'Hoje'
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })
}

async function deleteSession(id: string) {
  const ok = await confirmSheet.ask({
    title: 'Excluir registro',
    message: 'Este registro será removido permanentemente.',
  })
  if (!ok) return
  await sessionsStore.remove(id)
  toast.success('Registro excluído')
  await reloadAll()
}

async function loadRange() {
  const { from, to } = periodRange.value
  await sessionsStore.loadRange(from, to)
}

/** Janela anterior de mesmo tamanho — base da comparação do herói. */
async function loadPreviousPeriod() {
  const { from, to } = getPreviousPeriodRange(period.value)
  const all = await sessionsStore.fetchRange(from, to)
  previousSeconds.value = totalStudySeconds(all)
}

async function reloadAll() {
  await Promise.all([loadRange(), loadPreviousPeriod()])
}

watch(period, reloadAll)
onMounted(reloadAll)
</script>

<style scoped>
/* ── Herói: tempo do período + comparação com o anterior ── */
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

.progress-hero__consistency {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border);
}

.progress-hero__days {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.progress-hero__days strong {
  color: var(--text);
  font-weight: 700;
}

/* .ak-list-row__trailing agora vive em styles/app.css — Home e Progresso
   compartilham o mesmo alinhamento. */
.gap-row {
  padding: var(--space-2) var(--space-4);
  line-height: 1.4;
}

.gap-row__times {
  display: block;
  margin-top: 2px;
  opacity: 0.85;
}

.session-times {
  display: block;
  line-height: 1.45;
  white-space: normal;
}
</style>
