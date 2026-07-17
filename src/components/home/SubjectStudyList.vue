<template>
  <div class="stack-xs">
    <div class="flex-between" style="padding: 0 var(--space-1)">
      <h2 class="section-title">Matérias</h2>
      <RouterLink v-if="subjects.length === 0" to="/subjects" class="text-xs text-accent">
        Adicionar →
      </RouterLink>
    </div>

    <AkEmptyState
      v-if="subjects.length === 0"
      title="Sem matérias"
      description="Cadastre matérias para começar a registrar."
    />

    <button
      v-for="item in items"
      :key="item.subjectId"
      @click="emit('select', item.subjectId)"
      class="list-row list-row--interactive"
      :class="{ 'list-row--active': activeId === item.subjectId }"
    >
      <div
        class="subject-avatar"
        :style="{ background: colorMix(item.color, 12) }"
      >
        {{ item.icon }}
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex-between" style="margin-bottom: var(--space-1)">
          <span class="text-sm font-medium text-primary truncate">{{ item.name }}</span>
          <span class="text-xs font-semibold text-secondary numeric shrink-0">
            {{ item.seconds > 0 ? formatDuration(item.seconds) : '—' }}
          </span>
        </div>
        <div class="progress-track">
          <div
            class="progress-fill"
            :style="{ width: `${item.pct}%`, background: item.color }"
          />
        </div>
      </div>
      <AkBadge v-if="activeId === item.subjectId" variant="success" label="●" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AkBadge, AkEmptyState } from '@rafael_dias/akoma'
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
  return `color-mix(in srgb, ${color} ${pct}%, var(--bg-elevated))`
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
