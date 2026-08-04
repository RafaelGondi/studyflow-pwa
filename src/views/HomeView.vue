<template>
  <div
    class="ak-app-page"
    @touchstart.passive="onTouchStart"
    @touchend.passive="onTouchEnd"
  >
    <AkPageHeader
      label="Estudo"
      :title="headerTitle"
      :meta="headerMeta"
      size="md"
    >
      <template #actions>
        <div class="day-nav">
          <AkIconButton
            icon="arrow-left-outline"
            label="Dia anterior"
            size="sm"
            @click="goToPrevDay"
          />
          <AkIconButton
            v-if="!isViewingToday"
            icon="arrow-right-outline"
            label="Próximo dia"
            size="sm"
            @click="goToNextDay"
          />
        </div>
      </template>

      <div v-if="subjectsStore.subjects.length" class="day-header__progress">
        <div class="progress-strip">
          <div class="progress-strip__hero">
            <span class="progress-strip__time numeric">{{ studyTotalFormatted }}</span>
            <span class="progress-strip__caption">{{ progressCaption }}</span>
          </div>
        </div>
      </div>
    </AkPageHeader>

    <div
      v-if="availableCategoryFilters.length"
      class="chip-scroll home-category-filter reveal reveal-d1"
      aria-label="Filtrar resumo por categoria"
      @touchstart.stop
      @touchend.stop
    >
      <AkChip
        :active="selectedCategoryFilter === null"
        @click="selectedCategoryFilter = null"
      >
        Todas
      </AkChip>
      <AkChip
        v-for="category in availableCategoryFilters"
        :key="category.id"
        :active="selectedCategoryFilter === category.id"
        :color="category.color"
        @click="selectedCategoryFilter = category.id"
      >
        {{ category.name }}
      </AkChip>
    </div>

    <div class="ak-app-scroll page-body">
      <div class="day-panel reveal reveal-d2">
        <AkEmptyState
          v-if="subjectsStore.subjects.length === 0"
          title="Nenhuma matéria cadastrada"
          description="Cadastre matérias para iniciar o timer e registrar sessões."
        >
          <template #icon>📚</template>
          <AkButton variant="primary" @click="router.push('/subjects')">
            Ir para Matérias
          </AkButton>
        </AkEmptyState>

        <StudyLauncher
          v-else-if="isViewingToday && activeSubjects.length > 0"
          :active-id="timerStore.activeSubjectId"
          :last-subject-id="lastSubjectId"
          :extra-seconds="liveExtraSeconds"
          :extra-subject-id="timerStore.activeSubjectId"
          :timer-idle="timerStore.mode === 'idle'"
          @select="handleSubjectSelect"
          @browse="sheetOpen = true"
          @stop="handleStop"
          @focus="focusMode = true"
        />

        <AkEmptyState
          v-else-if="isViewingToday && subjectsStore.subjects.length > 0 && activeSubjects.length === 0"
          title="Nenhuma matéria ativa"
          description="Restaure uma matéria arquivada ou crie uma nova para iniciar o timer."
        >
          <template #icon>📚</template>
          <AkButton variant="primary" @click="router.push('/subjects')">
            Abrir Matérias
          </AkButton>
        </AkEmptyState>

        <section class="section-block">
          <AkSectionHeader :title="sectionTitle">
            <template #action>
              <div class="section-actions">
                <AkButton
                  v-if="activeSubjects.length"
                  size="sm"
                  variant="ghost"
                  @click="showAddModal = true"
                >
                  <template #icon>
                    <AkIcon name="plus-outline" :size="16" />
                  </template>
                  Manual
                </AkButton>
                <AkIconButton
                  v-if="studySessionCount > 0"
                  size="sm"
                  :label="sessionsExpanded ? 'Ocultar sessões' : 'Mostrar sessões'"
                  :icon="sessionsExpanded ? 'caret-up-outline' : 'caret-down-outline'"
                  @click="sessionsExpanded = !sessionsExpanded"
                />
              </div>
            </template>
          </AkSectionHeader>

          <AkEmptyState
            v-if="timeline.length === 0 && !pastLoading"
            title="Nenhuma sessão ainda"
            :description="isViewingToday ? 'Inicie o timer ou adicione um registro manual.' : 'Nenhum estudo registrado neste dia.'"
          />

          <button
            v-else-if="!sessionsExpanded && !pastLoading"
            type="button"
            class="sessions-peek"
            @click="sessionsExpanded = true"
          >
            <span>{{ studySessionCount }} {{ studySessionCount === 1 ? 'sessão registrada' : 'sessões registradas' }}</span>
            <AkIcon name="caret-down-outline" :size="14" />
          </button>

          <div v-else-if="!pastLoading" class="collapsible-section__body">
            <AkList>
              <template
                v-for="(item, index) in timeline"
                :key="item.type === 'gap' ? `gap-${index}` : item.session.id"
              >
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
                      <SubjectIcon
                        :icon="getSubject(item.session.subjectId)?.icon ?? '📚'"
                        :name="getSubject(item.session.subjectId)?.name"
                      />
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
      </div>
    </div>

    <FocusMode
      :active="focusMode"
      :subject="activeSubject"
      :total-seconds="todayTotalSeconds"
      @close="focusMode = false"
      @stop="handleFocusStop"
    />

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
  AkPageHeader, AkSectionHeader,
} from '@rafael_dias/akoma'
import { useTimerStore } from '@/stores/timer'
import { useSessionsStore } from '@/stores/sessions'
import { useSubjectsStore } from '@/stores/subjects'
import FocusMode from '@/components/home/FocusMode.vue'
import SubjectBottomSheet from '@/components/home/SubjectBottomSheet.vue'
import StudyLauncher from '@/components/home/StudyLauncher.vue'
import SubjectIcon from '@/components/ui/SubjectIcon.vue'
import SessionEditModal from '@/components/sessions/SessionEditModal.vue'
import SessionAddModal from '@/components/sessions/SessionAddModal.vue'
import { useFaceDownFocus } from '@/composables/useFaceDownFocus'
import { useAppToast } from '@/composables/useAppToast'
import { useConfirmSheet } from '@/composables/useConfirmSheet'
import { formatDuration, formatTimer, todayDateString, localDateStr } from '@/types'
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
const sessionsExpanded = ref(false)
const selectedCategoryFilter = ref<string | null>(null)
const activeSubjects = computed(() => subjectsStore.activeSubjects)

/* ─── Day navigation ─────────────────────────────────────────── */
const viewDate = ref(todayDateString())
const isViewingToday = computed(() => viewDate.value === todayDateString())
const pastSessions = ref<StudySession[]>([])
const pastLoading = ref(false)

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function dateToStr(d: Date): string {
  return localDateStr(d)
}

function goToPrevDay() {
  const d = parseLocalDate(viewDate.value)
  d.setDate(d.getDate() - 1)
  viewDate.value = dateToStr(d)
  sessionsExpanded.value = true
}

function goToNextDay() {
  if (isViewingToday.value) return
  const d = parseLocalDate(viewDate.value)
  d.setDate(d.getDate() + 1)
  const next = dateToStr(d)
  viewDate.value = next
  // If we've arrived back at today, reset expansion state
  if (next === todayDateString()) sessionsExpanded.value = false
}

watch(viewDate, async (date) => {
  if (date === todayDateString()) {
    await sessionsStore.loadToday()
  } else {
    pastLoading.value = true
    pastSessions.value = await sessionsStore.loadDate(date)
    pastLoading.value = false
  }
})

/* ─── Swipe gesture ──────────────────────────────────────────── */
let touchStart = { x: 0, y: 0 }

function onTouchStart(e: TouchEvent) {
  touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY }
}

function onTouchEnd(e: TouchEvent) {
  const dx = e.changedTouches[0].clientX - touchStart.x
  const dy = e.changedTouches[0].clientY - touchStart.y
  // Require mostly-horizontal movement with at least 60px travel
  if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx) * 0.6) return
  if (dx < 0) goToNextDay()
  else goToPrevDay()
}

/* ─── Face-down / mode watchers ─────────────────────────────── */
const { isFaceDown } = useFaceDownFocus()
watch(isFaceDown, (faceDown) => {
  if (faceDown && timerStore.mode !== 'idle') focusMode.value = true
})

watch(() => timerStore.mode, (mode, prev) => {
  if (mode === 'study' && prev !== 'paused') focusMode.value = true
})

/* ─── Derived data ───────────────────────────────────────────── */
const daySessions = computed(() =>
  isViewingToday.value ? sessionsStore.todaySessions : pastSessions.value,
)

const registeredCategoryIds = computed(() => {
  const ids = new Set<string>()
  for (const session of daySessions.value) {
    if (session.kind !== 'study' || !session.subjectId) continue
    const categoryId = subjectsStore.getSubject(session.subjectId)?.categoryId
    if (categoryId) ids.add(categoryId)
  }
  return ids
})

const availableCategoryFilters = computed(() =>
  subjectsStore.categories.filter(category => registeredCategoryIds.value.has(category.id)),
)

const displayedSessions = computed(() => {
  if (!selectedCategoryFilter.value) return daySessions.value
  return daySessions.value.filter((session) => {
    if (session.kind !== 'study' || !session.subjectId) return false
    return subjectsStore.getSubject(session.subjectId)?.categoryId === selectedCategoryFilter.value
  })
})

const timeline = computed(() => buildTimeline(displayedSessions.value))
const studySessionCount = computed(() => timeline.value.filter(i => i.type === 'study').length)

const headerTitle = computed(() => {
  if (isViewingToday.value) return 'Hoje'
  const d = parseLocalDate(viewDate.value)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (viewDate.value === dateToStr(yesterday)) return 'Ontem'
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
})

const headerMeta = computed(() => {
  const d = isViewingToday.value ? new Date() : parseLocalDate(viewDate.value)
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
})

const sectionTitle = computed(() => {
  if (isViewingToday.value) return 'Sessões de hoje'
  if (headerTitle.value === 'Ontem') return 'Sessões de ontem'
  return `Sessões de ${headerTitle.value}`
})

const activeSubject = computed(() => {
  const id = timerStore.activeSubjectId
  return id ? subjectsStore.getSubject(id) : null
})

const liveExtraSeconds = computed(() =>
  timerStore.mode === 'study' || timerStore.mode === 'paused'
    ? timerStore.studyElapsedSeconds
    : 0,
)

const todayTotalSeconds = computed(() =>
  sessionsStore.todayStudyTotalSeconds + liveExtraSeconds.value,
)

const displayedLiveExtraSeconds = computed(() => {
  if (!isViewingToday.value || !liveExtraSeconds.value) return 0
  if (!selectedCategoryFilter.value) return liveExtraSeconds.value
  return activeSubject.value?.categoryId === selectedCategoryFilter.value
    ? liveExtraSeconds.value
    : 0
})

const displayedTotalSeconds = computed(() => {
  const savedSeconds = displayedSessions.value
    .filter(s => s.kind === 'study')
    .reduce((acc, s) => acc + s.duration, 0)
  return savedSeconds + displayedLiveExtraSeconds.value
})

const studyTotalFormatted = computed(() => formatTimer(displayedTotalSeconds.value))

const progressCaption = computed(() => {
  const n = studySessionCount.value
  const category = selectedCategoryFilter.value
    ? subjectsStore.getCategory(selectedCategoryFilter.value)
    : null
  const categorySuffix = category ? ` · ${category.name}` : ''
  if (isViewingToday.value) {
    if (n === 0) return `ainda sem sessões hoje${categorySuffix}`
    if (n === 1) return `em 1 sessão hoje${categorySuffix}`
    return `em ${n} sessões hoje${categorySuffix}`
  }
  if (n === 0) return `nenhuma sessão neste dia${categorySuffix}`
  if (n === 1) return `1 sessão${categorySuffix}`
  return `${n} sessões${categorySuffix}`
})

watch(
  [availableCategoryFilters, pastLoading],
  ([categories, loading]) => {
    if (loading) return
    if (
      selectedCategoryFilter.value
      && !categories.some(category => category.id === selectedCategoryFilter.value)
    ) {
      selectedCategoryFilter.value = null
    }
  },
)

/* ─── Actions ────────────────────────────────────────────────── */
function handleSheetSelect(id: string) {
  if (timerStore.mode === 'idle') void startSubject(id)
  else void switchSubject(id)
}

async function handleSubjectSelect(id: string) {
  if (timerStore.mode === 'idle') {
    await startSubject(id)
    return
  }
  await switchSubject(id)
}

async function startSubject(id: string) {
  const subject = subjectsStore.getSubject(id)
  if (!subject || subject.archivedAt) {
    toast.error('Matéria arquivada', 'Restaure a matéria para iniciar novas sessões.')
    return
  }
  await timerStore.startStudy(id)
  lastSubjectId.value = id
  await sessionsStore.loadToday()
}

async function handleStop() {
  lastSubjectId.value = timerStore.activeSubjectId ?? lastSubjectId.value
  await timerStore.stop()
  await sessionsStore.loadToday()
}

async function handleFocusStop() {
  await handleStop()
  if (!timerStore.isInBreak) focusMode.value = false
}

async function switchSubject(id: string) {
  if (id === timerStore.activeSubjectId) return
  const nextSubject = subjectsStore.getSubject(id)
  if (!nextSubject || nextSubject.archivedAt) {
    toast.error('Matéria arquivada', 'Restaure a matéria para iniciar novas sessões.')
    return
  }
  lastSubjectId.value = id
  await timerStore.stop()
  await sessionsStore.loadToday()
  await timerStore.startStudy(id)
  toast.success(`Sessão salva · Trocado para ${nextSubject?.name ?? 'nova matéria'}`)
}

async function deleteSession(id: string) {
  const ok = await confirmSheet.ask({
    title: 'Excluir registro',
    message: 'Este registro será removido permanentemente.',
  })
  if (!ok) return
  await sessionsStore.remove(id)
  toast.success('Registro excluído')
  await reloadCurrentDay()
}

async function onSessionSaved() {
  editingSession.value = null
  showAddModal.value = false
  await reloadCurrentDay()
}

async function reloadCurrentDay() {
  if (isViewingToday.value) {
    await sessionsStore.loadToday()
  } else {
    pastSessions.value = await sessionsStore.loadDate(viewDate.value)
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

.section-actions {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.sessions-peek {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--space-3) 0;
  border: 0;
  background: transparent;
  color: var(--text-tertiary);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}

.day-nav {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.home-category-filter {
  border-bottom: 1px solid var(--border);
  overscroll-behavior-x: contain;
  touch-action: pan-x;
}
</style>
