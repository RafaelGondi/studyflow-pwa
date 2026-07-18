<template>
  <section class="section-block">
    <AkSectionHeader title="Matérias de hoje" />

    <AkEmptyState
      v-if="subjects.length === 0"
      title="Sem matérias"
      description="Cadastre matérias para começar a registrar."
    />

    <AkList v-else>
      <AkListRow
        v-for="item in items"
        :key="item.subjectId"
        interactive
        :divider="item !== items[items.length - 1]"
        @click="emit('select', item.subjectId)"
      >
        <template #leading>
          <div
            class="subject-leading"
            :style="{ background: colorMix(item.color, 16) }"
          >
            {{ item.icon }}
          </div>
        </template>

        <span class="truncate">{{ item.name }}</span>

        <template #subtitle>
          <AkProgress
            :value="item.pct"
            size="sm"
            :color="item.color"
          />
        </template>

        <template #trailing>
          <span class="numeric text-sm text-secondary shrink-0">
            {{ item.seconds > 0 ? formatDuration(item.seconds) : '—' }}
          </span>
          <AkBadge v-if="activeId === item.subjectId" variant="success" label="●" />
        </template>
      </AkListRow>
    </AkList>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AkBadge, AkEmptyState, AkList, AkListRow, AkProgress, AkSectionHeader } from '@rafael_dias/akoma'
import { useSubjectsStore } from '@/stores/subjects'
import { useSessionsStore } from '@/stores/sessions'
import { formatDuration } from '@/types'

const props = defineProps<{
  activeId?: string | null
  extraSeconds?: number
  extraSubjectId?: string | null
}>()

const emit = defineEmits<{ select: [id: string] }>()

const subjectsStore = useSubjectsStore()
const sessionsStore = useSessionsStore()

const subjects = computed(() => subjectsStore.subjects)

function colorMix(color: string, pct: number) {
  return `color-mix(in srgb, ${color} ${pct}%, var(--bg-soft))`
}

const items = computed(() => {
  const bySubject = new Map(sessionsStore.todayBySubject)
  if (props.extraSubjectId && props.extraSeconds) {
    bySubject.set(
      props.extraSubjectId,
      (bySubject.get(props.extraSubjectId) ?? 0) + props.extraSeconds
    )
  }

  const total = [...bySubject.values()].reduce((a, v) => a + v, 0) || 1

  return subjects.value
    .map(subject => {
      const seconds = bySubject.get(subject.id) ?? 0
      return {
        subjectId: subject.id,
        name: subject.name,
        color: subject.color,
        icon: subject.icon,
        seconds,
        pct: Math.round((seconds / total) * 100),
      }
    })
    .sort((a, b) => b.seconds - a.seconds || a.name.localeCompare(b.name))
})
</script>
