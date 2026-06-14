<template>
  <div class="space-y-2">
    <div class="flex items-center justify-between px-1">
      <h2 class="text-xs font-bold text-muted uppercase tracking-wider">Matérias</h2>
      <RouterLink
        v-if="subjects.length === 0"
        to="/subjects"
        class="text-xs text-accent"
      >
        Adicionar →
      </RouterLink>
    </div>

    <div v-if="subjects.length === 0" class="card p-6 text-center text-faint text-sm">
      Cadastre matérias para começar a registrar
    </div>

    <div v-else class="space-y-1.5">
      <button
        v-for="item in items"
        :key="item.subjectId"
        @click="emit('select', item.subjectId)"
        class="w-full list-row text-left transition-all tap-scale"
        :class="activeId === item.subjectId ? 'ring-2 ring-accent/40 bg-accent/5' : ''"
      >
        <div
          class="w-9 h-9 rounded-akoma flex items-center justify-center text-lg flex-shrink-0"
          :style="{ background: `${item.color}20` }"
        >
          {{ item.icon }}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between mb-1 gap-2">
            <span class="text-sm font-medium text-primary truncate">{{ item.name }}</span>
            <span class="text-xs font-semibold text-secondary flex-shrink-0 tabular-nums">
              {{ item.seconds > 0 ? formatDuration(item.seconds) : '—' }}
            </span>
          </div>
          <div class="h-1.5 rounded-full btn-icon overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500"
              :style="{ width: `${item.pct}%`, background: item.color }"
            />
          </div>
        </div>
        <div
          v-if="activeId === item.subjectId"
          class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"
        />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
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
