<template>
  <div class="page akoma-page">
    <header class="page-hero reveal">
      <span class="page-label">Organização</span>
      <h1 class="page-hero__title">Matérias</h1>
      <p class="page-hero__subtitle">
        {{ subjectsStore.subjects.length }} matérias · {{ subjectsStore.categories.length }} categorias
      </p>
    </header>

    <div class="chip-scroll reveal reveal-d1">
      <AkChip :active="selectedCategoryFilter === null" @click="selectedCategoryFilter = null">
        Todas
      </AkChip>
      <AkChip
        v-for="cat in subjectsStore.categories"
        :key="cat.id"
        :active="selectedCategoryFilter === cat.id"
        :color="cat.color"
        @click="selectedCategoryFilter = cat.id"
      >
        {{ cat.name }}
      </AkChip>
    </div>

    <div class="page-body reveal reveal-d2">
      <section class="section-block">
        <AkSectionHeader title="Matérias" />

        <AkEmptyState
          v-if="filteredSubjects.length === 0"
          title="Nenhuma matéria"
          description="Toque no + para adicionar."
        />

        <AkList v-else>
          <AkListRow
            v-for="(subject, i) in filteredSubjects"
            :key="subject.id"
            interactive
            :divider="i < filteredSubjects.length - 1"
          >
            <template #leading>
              <div class="subject-leading" :style="{ background: colorMix(subject.color, 12) }">
                {{ subject.icon }}
              </div>
            </template>

            <span class="truncate">{{ subject.name }}</span>

            <template #subtitle>
              <span class="text-xs text-muted truncate">
                {{ getSubjectCategory(subject)?.name ?? 'Sem categoria' }}
                <template v-if="todayTime(subject.id)"> · {{ todayTime(subject.id) }}</template>
              </span>
            </template>

            <template #trailing>
              <AkIconButton label="Iniciar estudo" size="sm" icon="play-outline" @click="startStudying(subject.id)" />
              <AkIconButton label="Editar" size="sm" icon="edit-outline" @click="openEditSubject(subject)" />
              <AkIconButton label="Excluir" size="sm" icon="trash-outline" @click="confirmDeleteSubject(subject.id)" />
            </template>
          </AkListRow>
        </AkList>
      </section>

      <section class="section-block">
        <AkSectionHeader title="Categorias">
          <template #action>
            <AkButton size="sm" variant="ghost" @click="showCategoryModal = true">+ Nova</AkButton>
          </template>
        </AkSectionHeader>

        <AkEmptyState
          v-if="subjectsStore.categories.length === 0"
          title="Sem categorias"
          description="Organize suas matérias em grupos."
        />

        <AkList v-else>
          <AkListRow
            v-for="(cat, i) in subjectsStore.categories"
            :key="cat.id"
            :divider="i < subjectsStore.categories.length - 1"
          >
            <template #leading>
              <div class="subject-leading subject-leading--sm" :style="{ background: colorMix(cat.color, 15) }">
                <span class="status-dot" :style="{ background: cat.color, width: '8px', height: '8px' }" />
              </div>
            </template>

            <span class="truncate">{{ cat.name }}</span>

            <template #trailing>
              <AkBadge variant="neutral" :label="countInCategory(cat.id)" />
              <AkIconButton label="Editar" size="sm" icon="edit-outline" @click="openEditCategory(cat)" />
              <AkIconButton label="Excluir" size="sm" icon="trash-outline" @click="confirmDeleteCategory(cat.id)" />
            </template>
          </AkListRow>
        </AkList>
      </section>
    </div>

    <AkIconButton class="fab" label="Nova matéria" size="lg" icon="plus-outline" @click="openAddSubject" />

    <SubjectModal
      :show="showSubjectModal"
      :subject="editingSubject"
      @close="showSubjectModal = false; editingSubject = null"
      @saved="subjectsStore.load()"
    />

    <CategoryModal
      :show="showCategoryModal"
      :category="editingCategory"
      @close="showCategoryModal = false; editingCategory = null"
      @saved="subjectsStore.load()"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  AkBadge, AkButton, AkChip, AkEmptyState, AkIconButton, AkList, AkListRow, AkSectionHeader,
} from '@rafael_dias/akoma'
import { useSubjectsStore } from '@/stores/subjects'
import { useSessionsStore } from '@/stores/sessions'
import { useTimerStore } from '@/stores/timer'
import SubjectModal from '@/components/subjects/SubjectModal.vue'
import CategoryModal from '@/components/subjects/CategoryModal.vue'
import { formatDuration } from '@/types'
import type { Subject, Category } from '@/types'

const router = useRouter()
const subjectsStore = useSubjectsStore()
const sessionsStore = useSessionsStore()
const timerStore = useTimerStore()
const showSubjectModal = ref(false)
const showCategoryModal = ref(false)
const editingSubject = ref<Subject | null>(null)
const editingCategory = ref<Category | null>(null)
const selectedCategoryFilter = ref<string | null>(null)

const filteredSubjects = computed(() => {
  if (!selectedCategoryFilter.value) return subjectsStore.subjects
  return subjectsStore.subjects.filter(s => s.categoryId === selectedCategoryFilter.value)
})

function colorMix(color: string, pct: number) {
  return `color-mix(in srgb, ${color} ${pct}%, var(--bg))`
}

function openAddSubject() {
  editingSubject.value = null
  showSubjectModal.value = true
}

function openEditSubject(subject: Subject) {
  editingSubject.value = subject
  showSubjectModal.value = true
}

async function confirmDeleteSubject(id: string) {
  if (confirm('Excluir esta matéria? O histórico de sessões será mantido.')) {
    await subjectsStore.removeSubject(id)
  }
}

function openEditCategory(cat: Category) {
  editingCategory.value = cat
  showCategoryModal.value = true
}

function getSubjectCategory(subject: Subject) {
  return subject.categoryId ? subjectsStore.getCategory(subject.categoryId) : null
}

function countInCategory(catId: string) {
  const n = subjectsStore.subjects.filter(s => s.categoryId === catId).length
  return n === 1 ? '1' : String(n)
}

function todayTime(subjectId: string) {
  const secs = sessionsStore.todayBySubject.get(subjectId) ?? 0
  return secs > 0 ? formatDuration(secs) : ''
}

async function startStudying(subjectId: string) {
  if (timerStore.mode !== 'idle' && timerStore.activeSubjectId !== subjectId) {
    await timerStore.stop()
    await sessionsStore.loadToday()
  }
  if (timerStore.mode === 'idle' || timerStore.mode === 'break') {
    await timerStore.startStudy(subjectId)
    await sessionsStore.loadToday()
  }
  router.push('/')
}

async function confirmDeleteCategory(id: string) {
  if (confirm('Excluir esta categoria? As matérias serão mantidas sem categoria.')) {
    await subjectsStore.removeCategory(id)
  }
}

onMounted(() => sessionsStore.loadToday())
</script>

<style scoped>
:deep(.ak-list-row__trailing) {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  flex-shrink: 0;
}
.fab {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-full);
}
</style>
