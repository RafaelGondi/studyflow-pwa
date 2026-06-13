<template>
  <Teleport to="body">
    <Transition name="backdrop">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-40 bg-black/40"
        @click="emit('update:modelValue', false)"
      />
    </Transition>

    <Transition name="sheet">
      <div
        v-if="modelValue"
        class="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto rounded-t-3xl modal-panel flex flex-col"
        style="max-height: 80dvh"
      >
        <!-- Handle -->
        <div class="flex justify-center pt-3 pb-2 flex-shrink-0">
          <div class="w-10 h-1 rounded-full" style="background: var(--border-strong)" />
        </div>

        <!-- Title -->
        <div class="flex items-center justify-between px-4 pb-3 flex-shrink-0">
          <h2 class="font-display text-sm font-semibold text-primary">Selecionar matéria</h2>
          <button
            @click="emit('update:modelValue', false)"
            class="w-7 h-7 btn-icon rounded-full tap-scale"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Empty state -->
        <div v-if="subjects.length === 0" class="flex flex-col items-center justify-center py-12 px-4 text-center">
          <span class="text-4xl mb-3">📚</span>
          <p class="text-muted font-medium text-sm">Nenhuma matéria cadastrada</p>
          <RouterLink
            to="/subjects"
            class="mt-2 text-sm text-accent"
            @click="emit('update:modelValue', false)"
          >
            Adicionar matéria →
          </RouterLink>
        </div>

        <!-- Subject list -->
        <div v-else class="overflow-y-auto px-3 pb-6 space-y-1">
          <button
            v-for="subject in subjects"
            :key="subject.id"
            @click="select(subject.id)"
            class="w-full flex items-center gap-3 px-3 py-3 rounded-akoma transition-all tap-scale"
            :class="activeId === subject.id ? 'bg-accent/15' : 'hover:bg-app-elevated'"
          >
            <div
              class="w-10 h-10 rounded-akoma flex items-center justify-center text-xl flex-shrink-0"
              :style="{ background: `${subject.color}20` }"
            >
              {{ subject.icon }}
            </div>
            <div class="flex-1 min-w-0 text-left">
              <p class="font-semibold text-primary text-sm truncate">{{ subject.name }}</p>
              <p class="text-[11px] text-muted truncate">
                {{ getCategoryName(subject.categoryId) ?? 'Sem categoria' }}
              </p>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <span class="text-xs text-muted">{{ todayTime(subject.id) }}</span>
              <div class="w-2 h-2 rounded-full" :style="{ background: subject.color }" />
            </div>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSubjectsStore } from '@/stores/subjects'
import { useSessionsStore } from '@/stores/sessions'
import { formatDuration } from '@/types'

const props = defineProps<{
  modelValue: boolean
  activeId?: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  select: [id: string]
}>()

const subjectsStore = useSubjectsStore()
const sessionsStore = useSessionsStore()

const subjects = computed(() => subjectsStore.subjects)

function getCategoryName(id: string | null) {
  if (!id) return null
  return subjectsStore.getCategory(id)?.name ?? null
}

function todayTime(id: string) {
  const secs = sessionsStore.todayBySubject.get(id) ?? 0
  return secs > 0 ? formatDuration(secs) : '—'
}

function select(id: string) {
  emit('select', id)
  emit('update:modelValue', false)
}
</script>

<style scoped>
.backdrop-enter-active, .backdrop-leave-active { transition: opacity 0.25s ease; }
.backdrop-enter-from, .backdrop-leave-to { opacity: 0; }

.sheet-enter-active { transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1); }
.sheet-leave-active { transition: transform 0.25s ease-in; }
.sheet-enter-from, .sheet-leave-to { transform: translateY(100%); }
</style>
