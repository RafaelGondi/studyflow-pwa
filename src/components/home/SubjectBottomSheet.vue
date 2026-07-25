<template>
  <AkSheet
    :open="modelValue"
    title="Selecionar matéria"
    close-label="Fechar"
    class="subject-picker-sheet"
    @update:open="(open) => emit('update:modelValue', open)"
  >
    <div class="sheet-picker">
      <div class="sheet-picker__chrome">
        <div
          v-if="categories.length > 0 && subjects.length > 0"
          class="chip-scroll chip-scroll--sheet"
        >
          <AkChip :active="filterId === null" @click="filterId = null">
            Todas
          </AkChip>
          <AkChip
            v-for="cat in categories"
            :key="cat.id"
            :active="filterId === cat.id"
            :color="cat.color"
            @click="filterId = cat.id"
          >
            {{ cat.name }}
          </AkChip>
        </div>

        <p v-if="subjects.length" class="sheet-picker__meta">
          {{ filteredSubjects.length }}
          {{ filteredSubjects.length === 1 ? 'matéria' : 'matérias' }}
          <template v-if="filterId"> nesta categoria</template>
        </p>
      </div>

      <div class="sheet-picker__list-wrap">
        <AkEmptyState
          v-if="subjects.length === 0"
          title="Nenhuma matéria"
          description="Cadastre matérias para começar."
        >
          <template #icon>📚</template>
        </AkEmptyState>

        <AkEmptyState
          v-else-if="filteredSubjects.length === 0"
          title="Nada nesta categoria"
          description="Troque o filtro ou cadastre uma matéria neste grupo."
        />

        <ul v-else class="sheet-picker__list">
          <li v-for="subject in filteredSubjects" :key="subject.id">
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
                <SubjectIcon :icon="subject.icon" :name="subject.name" />
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
    </div>
  </AkSheet>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { AkChip, AkEmptyState, AkSheet } from '@rafael_dias/akoma'
import { useSubjectsStore } from '@/stores/subjects'
import { subjectBgMix } from '@/utils/colors'
import SubjectIcon from '@/components/ui/SubjectIcon.vue'

const props = defineProps<{
  modelValue: boolean
  activeId?: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  select: [id: string]
}>()

const subjectsStore = useSubjectsStore()
const filterId = ref<string | null>(null)

const subjects = computed(() => subjectsStore.subjects)
const categories = computed(() => subjectsStore.categories)

const filteredSubjects = computed(() => {
  if (!filterId.value) return subjects.value
  return subjects.value.filter(s => s.categoryId === filterId.value)
})

watch(
  () => props.modelValue,
  (open) => {
    if (open) filterId.value = null
  },
)

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
.sheet-picker {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  padding: 0 var(--space-4) var(--space-5);
}

.sheet-picker__chrome {
  flex-shrink: 0;
}

.chip-scroll--sheet {
  margin: 0 0 var(--space-3);
  padding: 0 0 var(--space-1);
  background: transparent;
}

.sheet-picker__meta {
  margin: 0 0 var(--space-3);
  font-size: 12px;
  color: var(--text-tertiary);
}

.sheet-picker__list-wrap {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
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

<style>
/* Unscoped: AkSheet teleports to body — parent :deep() cannot reach it. */
.ak-sheet:has(.sheet-picker) {
  height: min(72dvh, 640px);
  max-height: 92dvh;
  min-height: 0;
}

.ak-sheet:has(.sheet-picker) .ak-sheet__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}
</style>
