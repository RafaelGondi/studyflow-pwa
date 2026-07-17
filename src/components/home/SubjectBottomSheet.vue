<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-overlay">
        <div class="modal-backdrop" @click="emit('update:modelValue', false)" />
        <AkCard padding="none" class="modal-sheet">
          <div class="modal-header">
            <h2 class="modal-title">Selecionar matéria</h2>
            <AkIconButton label="Fechar" size="sm" icon="x-outline" @click="emit('update:modelValue', false)" />
          </div>

          <div class="modal-body stack sheet-body">
            <AkEmptyState
              v-if="subjects.length === 0"
              title="Nenhuma matéria"
              description="Cadastre matérias para começar."
            >
              <template #icon>📚</template>
            </AkEmptyState>

            <AkList v-else>
              <AkListRow
                v-for="(subject, i) in subjects"
                :key="subject.id"
                interactive
                :divider="i < subjects.length - 1"
                @click="select(subject.id)"
              >
                <template #leading>
                  <div
                    class="subject-leading subject-leading--sm"
                    :style="{ background: colorMix(subject.color, 14) }"
                  >
                    {{ subject.icon }}
                  </div>
                </template>
                <span class="truncate">{{ subject.name }}</span>
                <template #subtitle>
                  <span class="text-xs text-muted truncate">
                    {{ getCategoryName(subject.categoryId) ?? 'Sem categoria' }}
                    <template v-if="todayTime(subject.id)"> · {{ todayTime(subject.id) }}</template>
                  </span>
                </template>
                <template #trailing>
                  <span class="status-dot" :style="{ background: subject.color }" />
                </template>
              </AkListRow>
            </AkList>
          </div>
        </AkCard>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AkCard, AkEmptyState, AkIconButton, AkList, AkListRow } from '@rafael_dias/akoma'
import { useSubjectsStore } from '@/stores/subjects'
import { useSessionsStore } from '@/stores/sessions'
import { formatDuration } from '@/types'

defineProps<{
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

function colorMix(color: string, pct: number) {
  return `color-mix(in srgb, ${color} ${pct}%, var(--bg-soft))`
}

function getCategoryName(categoryId: string | null) {
  if (!categoryId) return null
  return subjectsStore.getCategory(categoryId)?.name ?? null
}

function todayTime(subjectId: string) {
  const secs = sessionsStore.todayBySubject.get(subjectId) ?? 0
  return secs > 0 ? formatDuration(secs) : ''
}

function select(id: string) {
  emit('select', id)
  emit('update:modelValue', false)
}
</script>

<style scoped>
.sheet-body {
  padding-top: 0;
  max-height: 55dvh;
}
</style>
