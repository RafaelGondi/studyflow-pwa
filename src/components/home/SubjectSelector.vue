<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between px-1">
      <h2 class="text-sm font-semibold text-muted uppercase tracking-wider">Selecionar matéria</h2>
      <span class="text-xs text-faint">{{ subjects.length }} matérias</span>
    </div>

    <div v-if="subjects.length === 0" class="flex flex-col items-center justify-center py-10 text-center">
      <span class="text-4xl mb-3">📚</span>
      <p class="text-muted font-medium">Nenhuma matéria cadastrada</p>
      <RouterLink to="/subjects" class="mt-2 text-sm text-blue-500 hover:text-blue-400 transition-colors">
        Adicionar matéria →
      </RouterLink>
    </div>

    <div v-else class="grid grid-cols-2 gap-3">
      <button
        v-for="subject in subjects"
        :key="subject.id"
        @click="emit('select', subject.id)"
        class="relative flex flex-col items-start gap-2 p-4 rounded-2xl border transition-all duration-200 active:scale-95 text-left"
        :class="[
          selected === subject.id
            ? 'border-transparent scale-[1.02] shadow-lg'
            : 'border-app-border bg-app-card hover:bg-app-elevated',
        ]"
        :style="selected === subject.id ? {
          background: `linear-gradient(135deg, ${subject.color}22, ${subject.color}0a)`,
          boxShadow: `0 0 20px ${subject.color}30`,
          outline: `2px solid ${subject.color}`,
          outlineOffset: '-2px',
        } : {}"
      >
        <div
          class="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm"
          :style="{ background: `${subject.color}25` }"
        >
          {{ subject.icon }}
        </div>

        <div class="w-full min-w-0">
          <p class="font-semibold text-primary truncate text-sm leading-tight">{{ subject.name }}</p>
          <p v-if="getCategoryName(subject.categoryId)" class="text-xs text-muted mt-0.5 truncate">
            {{ getCategoryName(subject.categoryId) }}
          </p>
        </div>

        <div class="flex items-center gap-1.5 w-full">
          <div class="w-1.5 h-1.5 rounded-full flex-shrink-0" :style="{ background: subject.color }" />
          <span class="text-xs text-muted">
            {{ formatDuration(todayBySubject.get(subject.id) ?? 0) || 'Não estudado hoje' }}
          </span>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSubjectsStore } from '@/stores/subjects'
import { useSessionsStore } from '@/stores/sessions'
import { formatDuration } from '@/types'

const props = defineProps<{ selected: string | null }>()
const emit = defineEmits<{ select: [id: string] }>()

const subjectsStore = useSubjectsStore()
const sessionsStore = useSessionsStore()

const subjects = computed(() => subjectsStore.subjects)
const todayBySubject = computed(() => sessionsStore.todayBySubject)

function getCategoryName(id: string | null) {
  if (!id) return null
  return subjectsStore.getCategory(id)?.name ?? null
}
</script>
