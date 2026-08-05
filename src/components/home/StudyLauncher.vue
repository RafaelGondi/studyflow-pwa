<template>
  <!--
    Lista de acesso rápido. A matéria em andamento não vira um card separado:
    a própria linha dela expande e passa a carregar o timer e os controles.
    Uma entidade, um lugar na tela.
  -->
  <section v-if="recentItems.length" class="section-block study-launcher">
    <AkSectionHeader :title="sectionTitle">
      <template #action>
        <button
          v-if="props.timerIdle"
          type="button"
          class="mode-toggle-btn"
          :class="{ 'mode-toggle-btn--open': modePickerOpen }"
          :aria-expanded="modePickerOpen"
          aria-label="Selecionar modo de estudo"
          @click="modePickerOpen = !modePickerOpen"
        >
          {{ currentModeLabel }}
          <AkIcon name="caret-down-outline" :size="12" class="mode-toggle-caret" />
        </button>
        <span v-else class="mode-badge-label">{{ currentModeLabel }}</span>
      </template>
    </AkSectionHeader>

    <Transition name="mode-picker">
      <div v-if="modePickerOpen && props.timerIdle" class="mode-picker-panel">
        <button
          v-for="opt in timerModes"
          :key="opt.value"
          type="button"
          class="mode-picker-option"
          :class="{ 'mode-picker-option--active': timerStore.timerType === opt.value }"
          @click="selectMode(opt.value)"
        >
          <div class="mode-picker-info">
            <span class="mode-picker-name">{{ opt.label }}</span>
            <span class="mode-picker-desc">{{ opt.desc }}</span>
          </div>
          <AkIcon
            v-if="timerStore.timerType === opt.value"
            name="check-outline"
            :size="16"
            class="mode-picker-check"
          />
        </button>
      </div>
    </Transition>

    <AkList>
      <template v-for="(item, i) in recentItems" :key="item.subjectId">
        <li
          v-if="!timerIdle && activeId === item.subjectId"
          class="launcher-live"
          :class="timerStore.isInBreak && 'launcher-live--break'"
        >
          <button
            type="button"
            class="launcher-live__head"
            aria-label="Abrir modo foco"
            @click="emit('focus')"
          >
            <div
              class="subject-leading"
              :style="{ background: subjectBgMix(item.color, 16) }"
            >
              <SubjectIcon :icon="item.icon" :name="item.name" />
            </div>
            <div class="launcher-live__id">
              <p class="launcher-live__name truncate">{{ item.name }}</p>
              <p class="launcher-live__state">
                <span
                  class="status-dot"
                  :class="timerStore.isInBreak ? 'status-dot--paused' : timerStore.isRunning ? 'status-dot--live' : 'status-dot--paused'"
                />
                {{ liveStateLabel }}
              </p>
              <PomodoroCycle
                v-if="timerStore.timerType === 'pomodoro'"
                size="sm"
                :caption="false"
                class="launcher-live__cycle"
              />
            </div>
            <AkIcon name="arrow-right-outline" :size="18" class="launcher-live__chevron" />
          </button>

          <div class="launcher-live__controls">
            <div class="launcher-live__clock">
              <span class="launcher-live__timer numeric">
                {{ timerStore.displayFormatted }}
              </span>
              <!-- Moedas subindo enquanto estuda: o retorno chega durante o esforço. -->
              <span v-if="showLiveCoins" class="launcher-live__coins">
                <CoinIcon :size="13" />
                <AnimatedNumber :value="Math.floor(liveCoins)" :duration="450" />
              </span>
            </div>

            <!-- Break controls -->
            <div v-if="timerStore.isInBreak" class="launcher-live__actions">
              <button
                type="button"
                class="live-btn live-btn--text"
                @click="timerStore.skipBreak()"
              >
                Pular pausa
              </button>
            </div>

            <!-- Work controls -->
            <div v-else class="launcher-live__actions">
              <button
                type="button"
                class="live-btn"
                :aria-label="timerStore.isRunning ? 'Pausar' : 'Retomar'"
                @click="timerStore.isRunning ? timerStore.pause() : timerStore.resume()"
              >
                <AkIcon :name="timerStore.isRunning ? 'pause-outline' : 'play-outline'" :size="16" />
              </button>
              <button
                type="button"
                class="live-btn live-btn--text"
                @click="emit('stop')"
              >
                Parar
              </button>
            </div>
          </div>
        </li>

        <AkListRow
          v-else
          interactive
          @click="emit('select', item.subjectId)"
        >
          <template #leading>
            <div
              class="subject-leading"
              :style="{ background: subjectBgMix(item.color, 16) }"
            >
              <SubjectIcon :icon="item.icon" :name="item.name" />
            </div>
          </template>

          <span class="truncate">{{ item.name }}</span>

          <template #subtitle>
            <span class="text-xs text-muted truncate">{{ item.subtitle }}</span>
          </template>

          <template #trailing>
            <span v-if="item.seconds > 0" class="numeric text-sm text-secondary shrink-0">
              {{ formatDuration(item.seconds) }}
            </span>
            <AkIcon
              name="play-outline"
              :size="18"
              class="study-launcher__play"
            />
          </template>
        </AkListRow>
      </template>

      <!--
        Caminho para "estudar outra coisa". Fica no fim da própria lista, ao
        alcance do polegar e com rótulo — não como ícone solto no topo da página.
      -->
      <AkListRow
        interactive
        :divider="false"
        @click="emit('browse')"
      >
        <template #leading>
          <div class="subject-leading subject-leading--sm study-launcher__all">
            <AkIcon name="open-book-outline" :size="18" />
          </div>
        </template>

        <span>Ver todas as matérias</span>

        <template #trailing>
          <AkIcon name="arrow-right-outline" :size="18" class="study-launcher__chevron" />
        </template>
      </AkListRow>
    </AkList>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  AkIcon, AkList, AkListRow, AkSectionHeader,
} from '@rafael_dias/akoma'
import { useSubjectsStore } from '@/stores/subjects'
import { useSessionsStore } from '@/stores/sessions'
import { useTimerStore } from '@/stores/timer'
import type { TimerType } from '@/stores/timer'
import { formatDuration, isStudySession } from '@/types'
import { subjectBgMix } from '@/utils/colors'
import SubjectIcon from '@/components/ui/SubjectIcon.vue'
import PomodoroCycle from '@/components/home/PomodoroCycle.vue'
import CoinIcon from '@/components/ui/CoinIcon.vue'
import AnimatedNumber from '@/components/ui/AnimatedNumber.vue'
import { useLiveCoins } from '@/composables/useLiveCoins'

const props = defineProps<{
  activeId?: string | null
  lastSubjectId?: string | null
  extraSeconds?: number
  extraSubjectId?: string | null
  timerIdle?: boolean
}>()

const emit = defineEmits<{
  select: [id: string]
  browse: []
  stop: []
  focus: []
}>()

const subjectsStore = useSubjectsStore()
const sessionsStore = useSessionsStore()
const timerStore = useTimerStore()

const modePickerOpen = ref(false)

const { liveCoins } = useLiveCoins()
/* Abaixo de 1 moeda o contador ficaria parado no zero — pior que não aparecer. */
const showLiveCoins = computed(() => liveCoins.value >= 1)

const timerModes = computed(() => [
  { value: 'counter'    as TimerType, label: 'Contador',    desc: 'Cronômetro livre, registra ao parar' },
  { value: 'pomodoro'   as TimerType, label: 'Pomodoro',    desc: `${timerStore.prefs.pomodoro.workMinutes} min de foco + pausa automática` },
  { value: 'flowmodoro' as TimerType, label: 'Flowmodoro',  desc: 'Foco livre, pausa proporcional ao parar' },
])

const currentModeLabel = computed(() => {
  const m = timerStore.timerType
  if (m === 'pomodoro')   return 'Pomodoro'
  if (m === 'flowmodoro') return 'Flowmodoro'
  return 'Contador'
})

function selectMode(value: TimerType) {
  timerStore.updatePrefs({ timerType: value })
  modePickerOpen.value = false
}

const liveStateLabel = computed(() => {
  if (timerStore.isInBreak) {
    const kind = timerStore.breakKind
    if (kind === 'long')  return 'Pausa longa'
    if (kind === 'flow')  return 'Pausa proporcional'
    return 'Pausa curta'
  }
  // No Pomodoro a posição no ciclo fica na trilha logo abaixo, não no rótulo.
  return timerStore.isRunning ? 'Estudando agora' : 'Pausado'
})

const secondsBySubject = computed(() => {
  const map = new Map(sessionsStore.todayBySubject)
  if (props.extraSubjectId && props.extraSeconds) {
    map.set(
      props.extraSubjectId,
      (map.get(props.extraSubjectId) ?? 0) + props.extraSeconds,
    )
  }
  return map
})

/** Subjects touched today (by session order) + last subject, capped. */
const hasHistory = computed(() =>
  Boolean(props.activeId || props.lastSubjectId || sessionsStore.todaySessions.some(isStudySession)),
)

const sectionTitle = computed(() => {
  if (!props.timerIdle) return 'Hoje'
  return hasHistory.value ? 'Recentes' : 'Matérias'
})

const recentItems = computed(() => {
  const seen = new Set<string>()
  const orderedIds: string[] = []

  const todayStudy = sessionsStore.todaySessions
    .filter(isStudySession)
    .slice()
    .sort((a, b) => b.endTime - a.endTime)

  for (const session of todayStudy) {
    if (!session.subjectId || seen.has(session.subjectId)) continue
    seen.add(session.subjectId)
    orderedIds.push(session.subjectId)
  }

  if (props.lastSubjectId && !seen.has(props.lastSubjectId)) {
    orderedIds.unshift(props.lastSubjectId)
    seen.add(props.lastSubjectId)
  }

  if (props.activeId && !seen.has(props.activeId)) {
    orderedIds.unshift(props.activeId)
  }

  /*
   * Dia sem nenhuma sessão ainda: sem isso a lista fica vazia e some (o
   * `v-if` da seção é sobre este array), levando a "Ver todas as matérias"
   * junto — sem nenhum jeito de começar a estudar. Cai pro catálogo inteiro.
   */
  if (orderedIds.length === 0) {
    for (const s of subjectsStore.activeSubjects) {
      if (seen.has(s.id)) continue
      seen.add(s.id)
      orderedIds.push(s.id)
    }
  }

  return orderedIds
    .slice(0, 5)
    .map((subjectId) => {
      const subject = subjectsStore.getSubject(subjectId)
      if (!subject || (subject.archivedAt && props.timerIdle)) return null
      const seconds = secondsBySubject.value.get(subjectId) ?? 0
      const cat = subject.categoryId
        ? subjectsStore.getCategory(subject.categoryId)?.name
        : null
      return {
        subjectId,
        name: subject.name,
        icon: subject.icon,
        color: subject.color,
        seconds,
        subtitle: seconds > 0
          ? formatDuration(seconds)
          : (cat ?? 'Sem categoria'),
      }
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
})
</script>

<style scoped>
.study-launcher__play {
  color: var(--accent-ink);
  flex-shrink: 0;
}

.study-launcher__all {
  color: var(--text-secondary);
}

.study-launcher__chevron {
  color: var(--text-tertiary);
  flex-shrink: 0;
}

/*
 * Linha em andamento — mesma lista, estado expandido. O wash de fundo
 * (--bg-tinted, já usado pelo Akoma pra estados "ligados") + o status-dot
 * já dizem "essa é a ativa" — sem precisar de uma barra de cor lateral,
 * que não é um padrão que existe em nenhum outro componente do DS.
 */
.launcher-live {
  list-style: none;
  padding: var(--space-4);
  background: var(--bg-soft);
  border-top: 2px solid color-mix(in srgb, var(--accent-ink) 20%, transparent);
  border-bottom: 1px solid var(--border);
}

.launcher-live--break {
  border-top-color: color-mix(in srgb, var(--text-secondary) 25%, transparent);
}

.launcher-live__head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.launcher-live__head:focus-visible {
  outline: 2px solid var(--accent-ink);
  outline-offset: 3px;
  border-radius: var(--radius-sm);
}

.launcher-live__chevron {
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.launcher-live__id {
  flex: 1;
  min-width: 0;
}

.launcher-live__name {
  font-size: var(--text-base);
  font-weight: 650;
  letter-spacing: -0.01em;
  color: var(--text);
  margin: 0;
}

.launcher-live__state {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 2px 0 0;
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.launcher-live__cycle {
  margin-top: 6px;
  color: var(--text);
}

.launcher-live__controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-top: var(--space-3);
}

.launcher-live__clock {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
}

.launcher-live__coins {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px var(--space-2);
  border-radius: var(--radius-full);
  background: var(--coin-soft);
  color: var(--coin-text);
  font-size: var(--text-xs);
  font-weight: 500;
}

.launcher-live__timer {
  color: var(--text);
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 650;
  letter-spacing: -0.02em;
  line-height: 1;
}

.launcher-live__actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
}

.live-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  min-width: 32px;
  padding: 0 var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  background: var(--bg);
  color: var(--text);
  font: inherit;
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.live-btn:hover {
  background: var(--bg-tinted);
}

.live-btn:focus-visible {
  outline: 2px solid var(--accent-ink);
  outline-offset: 2px;
}

.live-btn:not(.live-btn--text) {
  padding: 0;
  width: 32px;
}

/* ── Mode toggle (section header action) ─────────────────────── */
.mode-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px var(--space-2) 3px var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--text-secondary);
  font: inherit;
  font-size: var(--text-xs);
  font-weight: 500;
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}

.mode-toggle-btn:hover,
.mode-toggle-btn--open {
  background: var(--bg-soft);
  color: var(--text);
}

.mode-toggle-caret {
  transition: transform 0.2s var(--ease-smooth);
  flex-shrink: 0;
}

.mode-toggle-btn--open .mode-toggle-caret {
  transform: rotate(180deg);
}

.mode-badge-label {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  font-weight: 500;
}

/* ── Mode picker panel ───────────────────────────────────────── */
.mode-picker-panel {
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  background: var(--bg-soft);
  overflow: hidden;
}

.mode-picker-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: none;
  border-top: 1px solid var(--border);
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.1s;
}

.mode-picker-option:first-child {
  border-top: none;
}

.mode-picker-option:active {
  background: var(--bg-tinted);
}

.mode-picker-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mode-picker-name {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text);
}

.mode-picker-option--active .mode-picker-name {
  color: var(--accent-ink);
}

.mode-picker-desc {
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.mode-picker-check {
  color: var(--accent-ink);
  flex-shrink: 0;
}

.mode-picker-enter-active,
.mode-picker-leave-active {
  transition: opacity 0.15s ease, transform 0.18s var(--ease-smooth);
  transform-origin: top;
}

.mode-picker-enter-from,
.mode-picker-leave-to {
  opacity: 0;
  transform: scaleY(0.94);
}
</style>
