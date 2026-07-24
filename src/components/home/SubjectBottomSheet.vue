<template>
  <AkSheet
    :open="modelValue"
    title="Selecionar matéria"
    close-label="Fechar"
    @update:open="(open) => emit('update:modelValue', open)"
  >
    <div class="sheet-picker__scroll">
      <p v-if="subjects.length" class="sheet-picker__meta">
        {{ subjects.length }} {{ subjects.length === 1 ? 'matéria' : 'matérias' }}
      </p>
      <AkEmptyState
        v-if="subjects.length === 0"
        title="Nenhuma matéria"
        description="Cadastre matérias para começar."
      >
        <template #icon>📚</template>
      </AkEmptyState>

      <ul v-else class="sheet-picker__list">
        <li v-for="subject in subjects" :key="subject.id">
          <button
            type="button"
            class="sheet-picker__item tap-scale"
            :class="{ 'sheet-picker__item--active': activeId === subject.id }"
            @click="select(subject.id)"
          >
            <div
              class="subject-leading subject-leading--sm"
              :style="{ background: subjectBgMix(subject.color, 14) }"
            >
              {{ subject.icon }}
            </div>
            <div class="sheet-picker__content">
              <span class="sheet-picker__name truncate">{{ subject.name }}</span>
              <span class="sheet-picker__meta-line truncate">
                {{ getCategoryName(subject.categoryId) ?? 'Sem categoria' }}
              </span>
            </div>
            <span class="status-dot shrink-0" :style="{ background: subject.color }" />
          </button>
        </li>
      </ul>
    </div>
  </AkSheet>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AkEmptyState, AkSheet } from '@rafael_dias/akoma'
import { useSubjectsStore } from '@/stores/subjects'
import { subjectBgMix } from '@/utils/colors'

defineProps<{
  modelValue: boolean
  activeId?: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  select: [id: string]
}>()

const subjectsStore = useSubjectsStore()

const subjects = computed(() => subjectsStore.subjects)

function getCategoryName(categoryId: string | null) {
  if (!categoryId) return null
  return subjectsStore.getCategory(categoryId)?.name ?? null
}

function select(id: string) {
  emit('select', id)
  emit('update:modelValue', false)
}
</script>

<style scoped>
.sheet-picker__meta {
  margin: 0 0 var(--space-3);
  font-size: 12px;
  color: var(--text-tertiary);
}

.sheet-picker__scroll {
  padding: 0 var(--space-4) var(--space-5);
}

.sheet-picker__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.sheet-picker__item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color var(--transition), border-color var(--transition);
}

.sheet-picker__item:hover {
  background: var(--bg-soft);
}

.sheet-picker__item--active {
  background: var(--accent-soft);
  border-color: color-mix(in srgb, var(--accent) 20%, transparent);
}

.sheet-picker__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sheet-picker__name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}

.sheet-picker__meta-line {
  font-size: 12px;
  color: var(--text-tertiary);
}
</style>
