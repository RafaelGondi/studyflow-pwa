<template>
  <div class="ak-app-page">
    <AkPageHeader
      label="Estudo"
      :title="pageTitle"
      :meta="headerMeta"
      size="md"
    >
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
      class="ak-app-scroll page-body"
      :class="{ 'ak-page-body--with-fab': subjectsStore.subjects.length > 0 }"
    >
      <div class="day-panel reveal reveal-d2">
        <ActiveTimerBar
          v-if="timerStore.mode !== 'idle'"
          @stop="handleStop"
          @change-subject="sheetOpen = true"
        />

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
          v-else
          :active-id="timerStore.activeSubjectId"
          :last-subject-id="lastSubjectId"
          :extra-seconds="liveExtraSeconds"
          :extra-subject-id="timerStore.activeSubjectId"
          :timer-idle="timerStore.mode === 'idle'"
          @select="handleSubjectSelect"
          @browse="sheetOpen = true"
        />

        <section class="section-block">
          <AkSectionHeader title="Sessões de hoje">
            <template #action>
              <AkButton
                v-if="subjectsStore.subjects.length"
                size="sm"
                variant="ghost"
                @click="showAddModal = true"
              >
                <template #icon>
                  <AkIcon name="plus-outline" :size="16" />
                </template>
                Manual
              </AkButton>
            </template>
          </AkSectionHeader>

          <div class="collapsible-section__body">
            <AkEmptyState
              v-if="timeline.length === 0"
              title="Nenhuma sessão ainda"
              description="Inicie o timer ou adicione um registro manual."
            />

            <AkList v-else>
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
      </div>
    </div>

    <AkFab v-if="subjectsStore.subjects.length > 0">
      <AkButton size="lg" aria-label="Adicionar registro" @click="showAddModal = true">
        <template #icon>
          <AkIcon name="plus-outline" />
        </template>
        Manual
      </AkButton>
    </AkFab>

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
      :date="todayStr"
      @close="showAddModal = false"
      @saved="onSessionSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  AkButton, AkEmptyState, AkFab, AkIcon, AkIconButton, AkList, AkListRow,
  AkPageHeader, AkSectionHeader,
} from '@rafael_dias/akoma'
import { useTimerStore } from '@/stores/timer'
import { useSessionsStore } from '@/stores/sessions'
import { useSubjectsStore } from '@/stores/subjects'
import ActiveTimerBar from '@/components/home/ActiveTimerBar.vue'
import FocusMode from '@/components/home/FocusMode.vue'
import SubjectBottomSheet from '@/components/home/SubjectBottomSheet.vue'
import StudyLauncher from '@/components/home/StudyLauncher.vue'
import SessionEditModal from '@/components/sessions/SessionEditModal.vue'
import SessionAddModal from '@/components/sessions/SessionAddModal.vue'
import { useFaceDownFocus } from '@/composables/useFaceDownFocus'
import { useAppToast } from '@/composables/useAppToast'
import { useConfirmSheet } from '@/composables/useConfirmSheet'
import { formatDuration, formatTimer, todayDateString } from '@/types'
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

const { isFaceDown } = useFaceDownFocus()
watch(isFaceDown, (faceDown) => {
  if (faceDown && timerStore.mode !== 'idle') focusMode.value = true
})

const todayStr = todayDateString()
const timeline = computed(() => buildTimeline(sessionsStore.todaySessions))

const pageTitle = computed(() => {
  if (timerStore.mode === 'study') return 'Em foco'
  if (timerStore.mode === 'paused') return 'Pausado'
  return 'Pronto'
})

const headerMeta = computed(() =>
  new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }),
)

const activeSubject = computed(() => {
  const id = timerStore.activeSubjectId
  return id ? subjectsStore.getSubject(id) : null
})

const liveExtraSeconds = computed(() =>
  timerStore.mode === 'study' || timerStore.mode === 'paused'
    ? timerStore.studyElapsedSeconds
    : 0,
)

const studyTotalFormatted = computed(() =>
  formatTimer(sessionsStore.todayStudyTotalSeconds + liveExtraSeconds.value),
)

const progressCaption = computed(() => {
  const n = timeline.value.filter(i => i.type === 'study').length
  if (n === 0) return 'ainda sem sessões hoje'
  if (n === 1) return 'em 1 sessão hoje'
  return `em ${n} sessões hoje`
})

function handleSheetSelect(id: string) {
  if (timerStore.mode === 'idle') {
    void startSubject(id)
  } else {
    void switchSubject(id)
  }
}

async function handleSubjectSelect(id: string) {
  if (timerStore.mode === 'idle') {
    await startSubject(id)
    return
  }
  await switchSubject(id)
}

async function startSubject(id: string) {
  await timerStore.startStudy(id)
  lastSubjectId.value = id
  await sessionsStore.loadToday()
}

async function handleStop() {
  lastSubjectId.value = timerStore.activeSubjectId ?? lastSubjectId.value
  await timerStore.stop()
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
  const ok = await confirmSheet.ask({
    title: 'Excluir registro',
    message: 'Este registro será removido permanentemente.',
  })
  if (!ok) return
  await sessionsStore.remove(id)
  toast.success('Registro excluído')
  await sessionsStore.loadToday()
}

async function onSessionSaved() {
  editingSession.value = null
  showAddModal.value = false
  await sessionsStore.loadToday()
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
