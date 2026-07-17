<template>
  <div class="page akoma-page" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd">
    <PageHeader
      :label="pageLabel"
      :title="pageTitle"
      :meta="dateLabel"
    >
      <div v-if="isToday && subjectsStore.subjects.length" class="progress-strip">
        <div class="progress-strip__meta">
          <span><strong>{{ studiedSubjectsCount }}</strong> de {{ subjectsStore.subjects.length }} matérias</span>
          <span class="progress-strip__pct numeric">{{ studyProgressPct }}%</span>
        </div>
        <AkProgress :value="studyProgressPct" size="sm" />
        <div class="day-stats">
          <span>Estudo <span class="day-stats__value numeric">{{ studyTotalFormatted }}</span></span>
          <span>Pausa <span class="day-stats__value day-stats__value--break numeric">{{ breakTotalFormatted }}</span></span>
        </div>
      </div>
      <template #nav>
        <AkIconButton class="nav-btn" label="Dia anterior" size="sm" icon="arrow-left-outline" @click="goPrev" />
        <AkIconButton
          v-if="isToday"
          class="nav-btn"
          label="Adicionar registro"
          size="sm"
          icon="plus-outline"
          @click="showAddModal = true"
        />
        <AkIconButton
          class="nav-btn"
          label="Próximo dia"
          size="sm"
          icon="arrow-right-outline"
          :disabled="isToday"
          @click="goNext"
        />
      </template>
    </PageHeader>

    <div class="page-body reveal reveal-d2">
      <SubjectStudyList
        v-if="isToday"
        :active-id="timerStore.activeSubjectId"
        :extra-seconds="timerStore.mode === 'study' || timerStore.mode === 'paused' ? timerStore.studyElapsedSeconds : 0"
        :extra-subject-id="timerStore.activeSubjectId"
        @select="handleSubjectSelect"
      />

      <ActiveTimerBar
        v-if="isToday && timerStore.mode !== 'idle'"
        :last-subject-id="lastSubjectId"
        @stop="handleStop"
        @break="handleBreak"
        @continue="handleContinue"
      />

      <section v-if="!isToday || timeline.length > 0 || loadingHistory" class="section-block">
        <AkSectionHeader :title="isToday ? 'Registros' : dateNavLabel" />

        <div v-if="loadingHistory" class="loading-center">
          <AkShimmer width="24px" height="24px" radius="full" />
        </div>

        <AkList v-else-if="timeline.length > 0">
          <template v-for="(item, index) in timeline" :key="item.type === 'gap' ? `gap-${index}` : item.session.id">
            <li v-if="item.type === 'gap'" class="text-xs text-muted gap-row">
              ☕ ~{{ item.label }} de intervalo
            </li>

            <AkListRow v-else :divider="index < timeline.length - 1">
              <template #leading>
                <div v-if="item.type === 'break'" class="subject-leading subject-leading--sm">☕</div>
                <div v-else class="subject-leading subject-leading--sm">
                  {{ getSubject(item.session.subjectId)?.icon ?? '📚' }}
                </div>
              </template>

              <span class="truncate" :class="item.type === 'break' ? 'text-warning' : ''">
                {{ item.type === 'break' ? 'Pausa' : (getSubject(item.session.subjectId)?.name ?? 'Matéria') }}
              </span>

              <template #subtitle>
                <span class="text-xs text-muted">
                  <template v-if="item.type !== 'break' && item.session.segments && item.session.segments.length > 1">
                    <template v-for="(seg, i) in item.session.segments" :key="i">
                      {{ fmt(seg.start) }}–{{ fmt(seg.end) }}
                      <span v-if="i < item.session.segments.length - 1" class="text-warning">
                        · ⏸ {{ formatDuration(Math.round((item.session.segments[i + 1].start - seg.end) / 1000)) }}
                      </span>
                    </template>
                  </template>
                  <template v-else>
                    {{ fmt(item.session.startTime) }} – {{ fmt(item.session.endTime) }}
                  </template>
                </span>
              </template>

              <template #trailing>
                <span
                  class="numeric text-sm font-semibold shrink-0"
                  :class="item.type === 'break' ? 'text-warning' : 'text-secondary'"
                >
                  {{ formatDuration(item.session.duration) }}
                </span>
                <AkIconButton label="Editar" size="sm" icon="edit-outline" @click="editingSession = item.session" />
                <AkIconButton label="Excluir" size="sm" icon="trash-outline" @click="deleteSession(item.session.id)" />
              </template>
            </AkListRow>
          </template>
        </AkList>
      </section>

      <AkEmptyState
        v-else-if="!isToday"
        title="Nenhum registro neste dia"
        description="Adicione um registro manual ou volte para hoje."
      />
    </div>

    <FocusMode :active="focusMode" :subject="activeSubject" @close="focusMode = false" />

    <SessionEditModal
      :show="!!editingSession"
      :session="editingSession"
      @close="editingSession = null"
      @saved="onSessionSaved"
    />

    <SessionAddModal
      :show="showAddModal"
      :date="viewDate"
      @close="showAddModal = false"
      @saved="onSessionSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  AkEmptyState, AkIconButton, AkList, AkListRow, AkProgress, AkSectionHeader, AkShimmer,
} from '@rafael_dias/akoma'
import { useTimerStore } from '@/stores/timer'
import { useSessionsStore } from '@/stores/sessions'
import { useSubjectsStore } from '@/stores/subjects'
import SubjectStudyList from '@/components/home/SubjectStudyList.vue'
import ActiveTimerBar from '@/components/home/ActiveTimerBar.vue'
import FocusMode from '@/components/home/FocusMode.vue'
import SessionEditModal from '@/components/sessions/SessionEditModal.vue'
import SessionAddModal from '@/components/sessions/SessionAddModal.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import { useFaceDownFocus } from '@/composables/useFaceDownFocus'
import { formatDuration, formatTimer, localDateStr, todayDateString, isStudySession, isBreakSession } from '@/types'
import { buildTimeline } from '@/utils/timeline'
import type { StudySession } from '@/types'

const timerStore = useTimerStore()
const sessionsStore = useSessionsStore()
const subjectsStore = useSubjectsStore()

const lastSubjectId = ref<string | null>(null)
const focusMode = ref(false)
const editingSession = ref<StudySession | null>(null)
const showAddModal = ref(false)

const { isFaceDown } = useFaceDownFocus()
watch(isFaceDown, (faceDown) => {
  if (faceDown && timerStore.mode !== 'idle') focusMode.value = true
})

const viewDate = ref(todayDateString())
const viewSessions = ref<StudySession[]>([])
const loadingHistory = ref(false)

const isToday = computed(() => viewDate.value === todayDateString())

const displaySessions = computed<StudySession[]>(() =>
  isToday.value ? sessionsStore.todaySessions : viewSessions.value
)

const timeline = computed(() => buildTimeline(displaySessions.value))

const pageLabel = computed(() => (isToday.value ? 'Seu dia' : 'Histórico'))

const pageTitle = computed(() => {
  if (isToday.value) return 'Hoje'
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (viewDate.value === localDateStr(yesterday)) return 'Ontem'
  const d = new Date(viewDate.value + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })
})

const dateNavLabel = computed(() => pageTitle.value)

const studiedSubjectsCount = computed(() => {
  const bySubject = new Map(sessionsStore.todayBySubject)
  if (timerStore.activeSubjectId && (timerStore.mode === 'study' || timerStore.mode === 'paused')) {
    bySubject.set(
      timerStore.activeSubjectId,
      (bySubject.get(timerStore.activeSubjectId) ?? 0) + timerStore.studyElapsedSeconds
    )
  }
  return [...bySubject.values()].filter(s => s > 0).length
})

const studyProgressPct = computed(() => {
  const total = subjectsStore.subjects.length
  if (!total) return 0
  return Math.round((studiedSubjectsCount.value / total) * 100)
})

const activeSubject = computed(() => {
  const id = timerStore.activeSubjectId
  return id ? subjectsStore.getSubject(id) : null
})

const dateLabel = computed(() =>
  new Date(viewDate.value + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
)

const studyTotalFormatted = computed(() => {
  if (isToday.value) {
    const live = (timerStore.mode === 'study' || timerStore.mode === 'paused')
      ? timerStore.studyElapsedSeconds : 0
    return formatTimer(sessionsStore.todayStudyTotalSeconds + live)
  }
  return formatTimer(displaySessions.value.filter(isStudySession).reduce((a, s) => a + s.duration, 0))
})

const breakTotalFormatted = computed(() => {
  if (isToday.value) {
    const live = timerStore.mode === 'break' ? timerStore.breakElapsedSeconds : 0
    return formatTimer(sessionsStore.todayBreakTotalSeconds + live)
  }
  return formatTimer(displaySessions.value.filter(isBreakSession).reduce((a, s) => a + s.duration, 0))
})

async function fetchViewDate() {
  if (isToday.value) return
  loadingHistory.value = true
  viewSessions.value = await sessionsStore.loadDate(viewDate.value)
  loadingHistory.value = false
}

function goPrev() {
  const d = new Date(viewDate.value + 'T12:00:00')
  d.setDate(d.getDate() - 1)
  viewDate.value = localDateStr(d)
}

function goNext() {
  if (isToday.value) return
  const d = new Date(viewDate.value + 'T12:00:00')
  d.setDate(d.getDate() + 1)
  const today = todayDateString()
  viewDate.value = localDateStr(d) > today ? today : localDateStr(d)
}

watch(viewDate, fetchViewDate)

let _swipeX = 0
let _swipeY = 0
function onTouchStart(e: TouchEvent) {
  _swipeX = e.touches[0].clientX
  _swipeY = e.touches[0].clientY
}
function onTouchEnd(e: TouchEvent) {
  const dx = e.changedTouches[0].clientX - _swipeX
  const dy = e.changedTouches[0].clientY - _swipeY
  if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.5) return
  if (dx < 0) goNext()
  else goPrev()
}

async function handleSubjectSelect(id: string) {
  if (timerStore.mode === 'idle' || timerStore.mode === 'break') {
    await timerStore.startStudy(id)
    lastSubjectId.value = id
    await sessionsStore.loadToday()
    return
  }
  await switchSubject(id)
}

async function handleStop() {
  if (timerStore.mode === 'break') {
    lastSubjectId.value = timerStore.activeSubjectId ?? lastSubjectId.value
  } else {
    lastSubjectId.value = timerStore.activeSubjectId
  }
  await timerStore.stop()
  await sessionsStore.loadToday()
}

async function handleBreak() {
  lastSubjectId.value = timerStore.activeSubjectId
  await timerStore.startBreak()
  await sessionsStore.loadToday()
}

async function handleContinue() {
  if (!lastSubjectId.value) return
  await timerStore.startStudy(lastSubjectId.value)
  await sessionsStore.loadToday()
}

async function switchSubject(id: string) {
  if (id === timerStore.activeSubjectId) return
  lastSubjectId.value = id
  await timerStore.stop()
  await sessionsStore.loadToday()
  await timerStore.startStudy(id)
}

async function deleteSession(id: string) {
  if (!confirm('Excluir este registro?')) return
  await sessionsStore.remove(id)
  if (isToday.value) await sessionsStore.loadToday()
  else viewSessions.value = await sessionsStore.loadDate(viewDate.value)
}

async function onSessionSaved() {
  editingSession.value = null
  showAddModal.value = false
  if (isToday.value) await sessionsStore.loadToday()
  else viewSessions.value = await sessionsStore.loadDate(viewDate.value)
}

function getSubject(id?: string) {
  return id ? subjectsStore.getSubject(id) : undefined
}

function fmt(ts: number) {
  return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

onMounted(async () => {
  timerStore.load()
  if (timerStore.activeSubjectId) lastSubjectId.value = timerStore.activeSubjectId
  await sessionsStore.loadToday()
})
</script>

<style scoped>
:deep(.ak-list-row__trailing) {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  flex-shrink: 0;
}
:deep(.ak-list-row__content) {
  min-width: 0;
}
.gap-row {
  padding: var(--space-2) var(--space-4);
}
</style>
