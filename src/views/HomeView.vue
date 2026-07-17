<template>
  <div class="page akoma-page" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd">
    <header class="page-hero reveal">
      <span class="page-label">{{ greeting }}</span>
      <h1 class="page-hero__title">StudyFlow</h1>
      <p class="page-hero__meta">{{ dateLabel }}</p>

      <div v-if="isToday" class="today-summary reveal reveal-d1">
        <div class="today-summary__item">
          <span class="today-summary__label">Estudo</span>
          <span class="today-summary__value numeric">{{ studyTotalFormatted }}</span>
        </div>
        <div class="today-summary__item today-summary__item--break">
          <span class="today-summary__label">Pausa</span>
          <span class="today-summary__value numeric">{{ breakTotalFormatted }}</span>
        </div>
      </div>
    </header>

    <div class="page-body reveal reveal-d2">
      <template v-if="isToday">
        <AkButton
          v-if="timerStore.mode === 'idle'"
          variant="primary"
          block
          @click="sheetOpen = true"
        >
          <AkIcon name="play-outline" :size="18" />
          Iniciar estudo
        </AkButton>

        <ActiveTimerBar
          v-else
          :last-subject-id="lastSubjectId"
          @stop="handleStop"
          @break="handleBreak"
          @continue="handleContinue"
          @change-subject="sheetOpen = true"
        />
      </template>

      <section class="section-block">
        <div class="date-nav">
          <AkIconButton class="nav-btn" label="Dia anterior" size="sm" icon="arrow-left-outline" @click="goPrev" />
          <span class="date-nav__label">{{ dateNavLabel }}</span>
          <AkIconButton
            class="nav-btn"
            label="Próximo dia"
            size="sm"
            icon="arrow-right-outline"
            :disabled="isToday"
            @click="goNext"
          />
        </div>

        <div v-if="isToday" class="flex-row" style="justify-content: flex-end; margin-top: calc(-1 * var(--space-2))">
          <AkButton size="sm" variant="ghost" @click="showAddModal = true">
            <AkIcon name="plus-outline" :size="16" />
            Adicionar registro
          </AkButton>
        </div>

        <div v-if="loadingHistory" class="loading-center">
          <AkShimmer width="24px" height="24px" radius="full" />
        </div>

        <AkEmptyState
          v-else-if="timeline.length === 0"
          title="Nenhum registro neste dia"
          description="Inicie um estudo ou adicione um registro manual."
        />

        <AkList v-else>
          <template v-for="(item, index) in timeline" :key="item.type === 'gap' ? `gap-${index}` : item.session.id">
            <li v-if="item.type === 'gap'" class="text-xs text-muted gap-row">
              ☕ ~{{ item.label }} de intervalo
            </li>

            <AkListRow v-else :divider="index < timeline.length - 1">
              <template #leading>
                <div
                  v-if="item.type === 'break'"
                  class="subject-leading subject-leading--sm"
                >
                  ☕
                </div>
                <div
                  v-else
                  class="subject-leading subject-leading--sm"
                  :style="{ background: colorMix(getSubject(item.session.subjectId)?.color ?? 'var(--accent)', 14) }"
                >
                  {{ getSubject(item.session.subjectId)?.icon ?? '📚' }}
                </div>
              </template>

              <span class="truncate" :class="item.type === 'break' ? 'text-warning' : ''">
                {{ item.type === 'break' ? 'Pausa' : (getSubject(item.session.subjectId)?.name ?? 'Matéria') }}
              </span>

              <template #subtitle>
                <span class="text-xs text-muted">
                  {{ fmt(item.session.startTime) }} – {{ fmt(item.session.endTime) }}
                </span>
              </template>

              <template #trailing>
                <span
                  class="numeric text-sm font-semibold shrink-0 row-duration"
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
    </div>

    <FocusMode :active="focusMode" :subject="activeSubject" @close="focusMode = false" />

    <SubjectBottomSheet
      v-model="sheetOpen"
      :active-id="timerStore.activeSubjectId"
      @select="handleSheetSelect"
    />

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
  AkButton, AkEmptyState, AkIcon, AkIconButton, AkList, AkListRow, AkShimmer,
} from '@rafael_dias/akoma'
import { useTimerStore } from '@/stores/timer'
import { useSessionsStore } from '@/stores/sessions'
import { useSubjectsStore } from '@/stores/subjects'
import ActiveTimerBar from '@/components/home/ActiveTimerBar.vue'
import FocusMode from '@/components/home/FocusMode.vue'
import SubjectBottomSheet from '@/components/home/SubjectBottomSheet.vue'
import SessionEditModal from '@/components/sessions/SessionEditModal.vue'
import SessionAddModal from '@/components/sessions/SessionAddModal.vue'
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
const sheetOpen = ref(false)

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

const dateNavLabel = computed(() => {
  if (isToday.value) return 'Hoje'
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (viewDate.value === localDateStr(yesterday)) return 'Ontem'
  const d = new Date(viewDate.value + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })
})

const activeSubject = computed(() => {
  const id = timerStore.activeSubjectId
  return id ? subjectsStore.getSubject(id) : null
})

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
})

const dateLabel = computed(() =>
  new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
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

function colorMix(color: string, pct: number) {
  return `color-mix(in srgb, ${color} ${pct}%, var(--bg-soft))`
}

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

function handleSheetSelect(id: string) {
  if (timerStore.mode === 'idle' || timerStore.mode === 'break') {
    timerStore.startStudy(id)
    lastSubjectId.value = id
  } else {
    switchSubject(id)
  }
}

async function handleStop() {
  lastSubjectId.value = timerStore.activeSubjectId ?? lastSubjectId.value
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
.gap-row {
  padding: var(--space-2) var(--space-4);
}
.row-duration {
  min-width: 3rem;
  text-align: right;
}
</style>
