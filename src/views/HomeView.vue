<template>
  <div
    class="page akoma-page app-page"
    :class="{ 'app-page--with-fab': isToday && subjectsStore.subjects.length > 0 }"
  >
    <div class="app-page__header">
      <PageHeader
      :label="pageLabel"
      :title="pageTitle"
      :meta="dateLabel"
      bordered
    >
      <div v-if="isToday && subjectsStore.subjects.length" class="day-header__progress">
        <AkProgress
          :value="studiedSubjectsCount"
          :max="subjectsStore.subjects.length"
          :label="`${studiedSubjectsCount} de ${subjectsStore.subjects.length} matérias estudadas`"
          show-value
        />
        <div class="progress-strip">
          <div class="progress-strip__hero">
            <span class="progress-strip__time numeric">{{ studyTotalFormatted }}</span>
            <span class="progress-strip__caption">de estudo hoje</span>
          </div>
        </div>
      </div>
      <template #nav>
        <div class="nav-cluster">
          <AkIconButton class="nav-btn" label="Dia anterior" size="sm" icon="arrow-left-outline" @click="goPrev" />
          <AkIconButton
            class="nav-btn"
            label="Próximo dia"
            size="sm"
            icon="arrow-right-outline"
            :disabled="isToday"
            @click="goNext"
          />
        </div>
      </template>
    </PageHeader>

      <Transition name="fade">
        <div v-if="!isToday" class="chip-row page-chip-row">
          <AkChip @click="goToToday">
            <AkIcon name="home-outline" :size="14" />
            Ir para hoje
          </AkChip>
        </div>
      </Transition>
    </div>

    <div
      class="app-scroll"
      @touchstart.passive="onTouchStart"
      @touchend.passive="onTouchEnd"
    >
      <Transition :name="slideDir === 'left' ? 'slide-left' : 'slide-right'" mode="out-in">
        <div :key="viewDate" class="page-body reveal reveal-d2">
          <template v-if="isToday">
            <ActiveTimerBar
              v-if="timerStore.mode !== 'idle'"
              @stop="handleStop"
              @change-subject="sheetOpen = true"
            />

            <AkEmptyState
              v-if="subjectsStore.subjects.length === 0"
              title="Nenhuma matéria cadastrada"
              description="Adicione matérias para registrar seu estudo."
            >
              <template #icon>📚</template>
              <AkButton variant="primary" @click="router.push('/subjects')">
                Ir para Matérias
              </AkButton>
            </AkEmptyState>

            <SubjectStudyList
              v-else-if="showSubjectList"
              :active-id="timerStore.activeSubjectId"
              :extra-seconds="timerStore.mode === 'study' || timerStore.mode === 'paused' ? timerStore.studyElapsedSeconds : 0"
              :extra-subject-id="timerStore.activeSubjectId"
              :show-play="timerStore.mode === 'idle'"
              @select="handleSubjectSelect"
              @browse="sheetOpen = true"
            />
          </template>

          <section
            v-if="showRecordsSection"
            class="section-block"
          >
            <AkSectionHeader :title="isToday ? 'Registros' : dateNavLabel">
              <template #action>
                <AkButton v-if="isToday" size="sm" variant="ghost" @click="showAddModal = true">
                  <template #icon>
                    <AkIcon name="plus-outline" :size="16" />
                  </template>
                  Adicionar
                </AkButton>
              </template>
            </AkSectionHeader>

            <div class="collapsible-section__body">
              <div v-if="loadingHistory" class="loading-center">
                <AkShimmer width="24px" height="24px" radius="full" />
              </div>

              <AkEmptyState
                v-else-if="timeline.length === 0 && isToday"
                title="Nenhum registro ainda"
                description="Toque em uma matéria acima para começar."
              />

              <AkList v-else-if="timeline.length > 0">
                <template v-for="(item, index) in timeline" :key="item.type === 'gap' ? `gap-${index}` : item.session.id">
                  <li v-if="item.type === 'gap'" class="text-xs text-muted gap-row">
                    ↕ ~{{ item.label }} entre sessões
                  </li>

                  <li v-else-if="item.type === 'break'" class="text-xs text-muted gap-row">
                    ↕ ~{{ formatDuration(item.session.duration) }} de intervalo
                    <span class="gap-row__times">{{ fmt(item.session.startTime) }} – {{ fmt(item.session.endTime) }}</span>
                  </li>

                  <AkListRow v-else :divider="index < timeline.length - 1">
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
                        {{ formatSessionTimeRange(item.session, fmt) }}
                      </span>
                    </template>

                    <template #trailing>
                      <span class="numeric text-sm font-semibold shrink-0 row-duration text-secondary">
                        {{ formatDuration(item.session.duration) }}
                      </span>
                      <AkIconButton label="Editar" size="sm" icon="edit-outline" @click="editingSession = item.session" />
                      <AkIconButton label="Excluir" size="sm" icon="trash-outline" @click="deleteSession(item.session.id)" />
                    </template>
                  </AkListRow>
                </template>
              </AkList>
            </div>
          </section>

          <AkEmptyState
            v-else-if="!isToday && !loadingHistory && timeline.length === 0"
            title="Nenhum registro neste dia"
            description="Adicione um registro manual ou volte para hoje."
          />
        </div>
      </Transition>
    </div>

    <div v-if="isToday && subjectsStore.subjects.length > 0" class="fab">
      <AkButton size="lg" aria-label="Adicionar registro" @click="showAddModal = true">
        <template #icon>
          <AkIcon name="plus-outline" :size="18" />
        </template>
        Adicionar
      </AkButton>
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
import { useRouter } from 'vue-router'
import {
  AkButton, AkChip, AkEmptyState, AkIcon, AkIconButton, AkList, AkListRow,
  AkProgress, AkSectionHeader, AkShimmer,
} from '@rafael_dias/akoma'
import { useTimerStore } from '@/stores/timer'
import { useSessionsStore } from '@/stores/sessions'
import { useSubjectsStore } from '@/stores/subjects'
import ActiveTimerBar from '@/components/home/ActiveTimerBar.vue'
import FocusMode from '@/components/home/FocusMode.vue'
import SubjectBottomSheet from '@/components/home/SubjectBottomSheet.vue'
import SubjectStudyList from '@/components/home/SubjectStudyList.vue'
import SessionEditModal from '@/components/sessions/SessionEditModal.vue'
import SessionAddModal from '@/components/sessions/SessionAddModal.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import { useFaceDownFocus } from '@/composables/useFaceDownFocus'
import { useAppToast } from '@/composables/useAppToast'
import { useConfirmSheet } from '@/composables/useConfirmSheet'
import { formatDuration, formatTimer, localDateStr, todayDateString, isStudySession } from '@/types'
import { buildTimeline, formatSessionTimeRange } from '@/utils/timeline'
import type { StudySession } from '@/types'

const router = useRouter()
const timerStore = useTimerStore()
const sessionsStore = useSessionsStore()
const subjectsStore = useSubjectsStore()
const toast = useAppToast()
const confirmSheet = useConfirmSheet()

const lastSubjectId = ref<string | null>(null)
const focusMode = ref(false)
const editingSession = ref<StudySession | null>(null)
const showAddModal = ref(false)
const sheetOpen = ref(false)
const slideDir = ref<'left' | 'right'>('left')

const { isFaceDown } = useFaceDownFocus()
watch(isFaceDown, (faceDown) => {
  if (faceDown && timerStore.mode !== 'idle') focusMode.value = true
})

const viewDate = ref(todayDateString())
const viewSessions = ref<StudySession[]>([])
const loadingHistory = ref(false)
const todayStr = todayDateString()

const isToday = computed(() => viewDate.value === todayStr)

const displaySessions = computed<StudySession[]>(() =>
  isToday.value ? sessionsStore.todaySessions : viewSessions.value
)

const timeline = computed(() => buildTimeline(displaySessions.value))

const showSubjectList = computed(() => timerStore.mode === 'idle')

const showRecordsSection = computed(() =>
  !isToday.value || subjectsStore.subjects.length > 0 || loadingHistory.value
)

const studiedSubjectsCount = computed(() => {
  const ids = new Set<string>()
  for (const [id, secs] of sessionsStore.todayBySubject) {
    if (secs > 0) ids.add(id)
  }
  if (
    timerStore.activeSubjectId
    && (timerStore.mode === 'study' || timerStore.mode === 'paused')
  ) {
    ids.add(timerStore.activeSubjectId)
  }
  return ids.size
})

const pageLabel = computed(() => (isToday.value ? 'Sua rotina' : 'Histórico'))

const pageTitle = computed(() => {
  if (isToday.value) return 'Hoje'
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (viewDate.value === localDateStr(yesterday)) return 'Ontem'
  const d = new Date(viewDate.value + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })
})

const dateNavLabel = computed(() => pageTitle.value)

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

async function fetchViewDate() {
  if (isToday.value) return
  loadingHistory.value = true
  viewSessions.value = await sessionsStore.loadDate(viewDate.value)
  loadingHistory.value = false
}

function goPrev() {
  slideDir.value = 'right'
  const d = new Date(viewDate.value + 'T12:00:00')
  d.setDate(d.getDate() - 1)
  viewDate.value = localDateStr(d)
}

function goNext() {
  if (isToday.value) return
  slideDir.value = 'left'
  const d = new Date(viewDate.value + 'T12:00:00')
  d.setDate(d.getDate() + 1)
  viewDate.value = localDateStr(d) > todayStr ? todayStr : localDateStr(d)
}

function goToToday() {
  slideDir.value = viewDate.value > todayStr ? 'right' : 'left'
  viewDate.value = todayStr
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
  if (timerStore.mode === 'idle') {
    timerStore.startStudy(id)
    lastSubjectId.value = id
  } else {
    switchSubject(id)
  }
}

async function handleSubjectSelect(id: string) {
  if (timerStore.mode === 'idle') {
    await timerStore.startStudy(id)
    lastSubjectId.value = id
    await sessionsStore.loadToday()
    return
  }
  await switchSubject(id)
}

async function handleStop() {
  lastSubjectId.value = timerStore.activeSubjectId ?? lastSubjectId.value
  await timerStore.stop()
  await sessionsStore.loadToday()
  if (navigator.vibrate) navigator.vibrate([100, 30, 80])
}

async function switchSubject(id: string) {
  if (id === timerStore.activeSubjectId) return
  lastSubjectId.value = id
  await timerStore.stop()
  await sessionsStore.loadToday()
  await timerStore.startStudy(id)
}

async function deleteSession(id: string) {
  const ok = await confirmSheet.ask({
    title: 'Excluir registro',
    message: 'Este registro será removido permanentemente.',
  })
  if (!ok) return
  await sessionsStore.remove(id)
  toast.success('Registro excluído')
  if (isToday.value) await sessionsStore.loadToday()
  else viewSessions.value = await sessionsStore.loadDate(viewDate.value)
}

async function onSessionSaved() {
  editingSession.value = null
  showAddModal.value = false
  if (isToday.value) {
    await sessionsStore.loadToday()
  } else {
    viewSessions.value = await sessionsStore.loadDate(viewDate.value)
  }
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

.row-duration {
  min-width: 3rem;
  text-align: right;
}
</style>
