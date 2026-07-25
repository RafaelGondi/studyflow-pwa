<template>
  <!--
    Lista de acesso rápido. A matéria em andamento não vira um card separado:
    a própria linha dela expande e passa a carregar o timer e os controles.
    Uma entidade, um lugar na tela.
  -->
  <section v-if="recentItems.length" class="section-block study-launcher">
    <AkSectionHeader :title="sectionTitle" />
    <AkList>
      <template v-for="(item, i) in recentItems" :key="item.subjectId">
        <li
          v-if="!timerIdle && activeId === item.subjectId"
          class="launcher-live"
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
              {{ item.icon }}
            </div>
            <div class="launcher-live__id">
              <p class="launcher-live__name truncate">{{ item.name }}</p>
              <p class="launcher-live__state">
                <span
                  class="status-dot"
                  :class="timerStore.isRunning ? 'status-dot--live' : 'status-dot--paused'"
                />
                {{ timerStore.isRunning ? 'Estudando agora' : 'Pausado' }}
              </p>
            </div>
            <AkIcon name="arrow-right-outline" :size="18" class="launcher-live__chevron" />
          </button>

          <div class="launcher-live__controls">
            <span class="launcher-live__timer numeric">
              {{ timerStore.studyFormatted }}
            </span>

            <div class="launcher-live__actions">
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
              {{ item.icon }}
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
import { computed } from 'vue'
import {
  AkIcon, AkList, AkListRow, AkSectionHeader,
} from '@rafael_dias/akoma'
import { useSubjectsStore } from '@/stores/subjects'
import { useSessionsStore } from '@/stores/sessions'
import { useTimerStore } from '@/stores/timer'
import { formatDuration, isStudySession } from '@/types'
import { subjectBgMix } from '@/utils/colors'

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
    for (const s of subjectsStore.subjects) {
      if (seen.has(s.id)) continue
      seen.add(s.id)
      orderedIds.push(s.id)
    }
  }

  return orderedIds
    .slice(0, 5)
    .map((subjectId) => {
      const subject = subjectsStore.getSubject(subjectId)
      if (!subject) return null
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

.launcher-live__controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-top: var(--space-3);
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
</style>
