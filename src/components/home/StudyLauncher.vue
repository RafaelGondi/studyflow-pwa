<template>
  <section v-if="subjects.length" class="section-block study-launcher">
    <div v-if="timerIdle" class="study-launcher__cta stack">
      <AkButton
        v-if="continueSubject"
        variant="primary"
        size="lg"
        block
        @click="emit('select', continueSubject.id)"
      >
        <template #icon>
          <AkIcon name="play-outline" />
        </template>
        Continuar · {{ continueSubject.icon }} {{ continueSubject.name }}
      </AkButton>

      <AkButton
        :variant="continueSubject ? 'secondary' : 'primary'"
        size="lg"
        block
        @click="emit('browse')"
      >
        <template #icon>
          <AkIcon :name="continueSubject ? 'open-book-outline' : 'play-outline'" />
        </template>
        {{ continueSubject ? 'Escolher outra matéria' : 'Iniciar estudo' }}
      </AkButton>
    </div>

    <template v-if="recentItems.length">
      <AkSectionHeader :title="timerIdle ? 'Recentes' : 'Hoje'" />
      <AkList>
        <AkListRow
          v-for="(item, i) in recentItems"
          :key="item.subjectId"
          interactive
          :divider="i < recentItems.length - 1"
          :class="{ 'study-launcher__row--active': activeId === item.subjectId }"
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
              v-if="timerIdle"
              name="play-outline"
              :size="18"
              class="study-launcher__play"
            />
            <AkBadge v-else-if="activeId === item.subjectId" variant="success" label="●" />
          </template>
        </AkListRow>
      </AkList>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  AkBadge, AkButton, AkIcon, AkList, AkListRow, AkSectionHeader,
} from '@rafael_dias/akoma'
import { useSubjectsStore } from '@/stores/subjects'
import { useSessionsStore } from '@/stores/sessions'
import { formatDuration, isStudySession } from '@/types'
import { subjectBgMix } from '@/utils/colors'
import type { Subject } from '@/types'

const props = defineProps<{
  activeId?: string | null
  lastSubjectId?: string | null
  extraSeconds?: number
  extraSubjectId?: string | null
  timerIdle?: boolean
}>()

const emit = defineEmits<{ select: [id: string]; browse: [] }>()

const subjectsStore = useSubjectsStore()
const sessionsStore = useSessionsStore()

const subjects = computed(() => subjectsStore.subjects)

const continueSubject = computed((): Subject | null => {
  if (!props.timerIdle) return null
  const id = props.lastSubjectId
  if (!id) return null
  return subjectsStore.getSubject(id) ?? null
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
.study-launcher__cta {
  gap: var(--space-3);
}

.study-launcher__play {
  color: var(--accent);
  flex-shrink: 0;
}

.study-launcher__row--active {
  background: color-mix(in srgb, var(--accent) 6%, var(--bg-elevated));
  box-shadow: inset 3px 0 0 var(--accent);
}
</style>
