<template>
  <div class="ak-app-page">
    <AkPageHeader
      label="Catálogo"
      title="Matérias"
      :meta="`${activeSubjects.length} ativas · ${archivedSubjects.length} arquivadas · ${subjectsStore.categories.length} categorias`"
      size="md"
    />

    <div class="chip-scroll reveal reveal-d1">
      <AkChip :active="listMode === 'active' && selectedCategoryFilter === null" @click="showActive(null)">
        Todas
      </AkChip>
      <AkChip
        v-for="cat in visibleCategories"
        :key="cat.id"
        :active="listMode === 'active' && selectedCategoryFilter === cat.id"
        :color="cat.color"
        @click="showActive(cat.id)"
      >
        {{ cat.name }}
      </AkChip>
      <AkChip v-if="archivedSubjects.length > 0" :active="listMode === 'archived'" @click="showArchived">
        Arquivadas
      </AkChip>
    </div>

    <div class="ak-app-scroll page-body ak-page-body--with-fab reveal reveal-d2">
      <section class="section-block">
        <AkSectionHeader title="Matérias" />

        <AkEmptyState
          v-if="filteredSubjects.length === 0"
          :title="listMode === 'archived' ? 'Nenhuma matéria arquivada' : 'Nenhuma matéria'"
          :description="listMode === 'archived' ? 'Quando você arquivar algo, ele aparece aqui.' : 'Toque no + para adicionar.'"
        />

        <AkList v-else>
          <AkListRow
            v-for="(subject, i) in filteredSubjects"
            :key="subject.id"
            interactive
            :divider="i < filteredSubjects.length - 1"
            @click="openSubjectStats(subject.id)"
          >
            <template #leading>
              <div class="subject-leading"><SubjectIcon :icon="subject.icon" :name="subject.name" /></div>
            </template>

            <span class="truncate">{{ subject.name }}</span>

            <template #subtitle>
              <span class="text-xs text-muted truncate">
                {{ subject.archivedAt ? 'Arquivada · ' : '' }}{{ getSubjectCategory(subject)?.name ?? 'Sem categoria' }}
              </span>
            </template>

            <template #trailing>
              <AkBadge v-if="subject.archivedAt" variant="neutral" label="Arquivada" />
              <AkIconButton label="Editar" size="sm" icon="edit-outline" @click.stop="openEditSubject(subject)" />
              <AkIconButton
                v-if="subject.archivedAt"
                label="Restaurar"
                size="sm"
                icon="refresh-outline"
                @click.stop="restoreSubject(subject.id)"
              />
              <AkIconButton
                v-else
                label="Arquivar"
                size="sm"
                icon="archive-outline"
                @click.stop="confirmArchiveSubject(subject)"
              />
              <AkIconButton label="Excluir" size="sm" icon="trash-outline" @click.stop="confirmDeleteSubject(subject.id)" />
            </template>
          </AkListRow>
        </AkList>
      </section>

      <section class="section-block">
        <AkSectionHeader title="Categorias">
          <template #action>
        <AkButton size="sm" variant="ghost" @click="showCategoryModal = true">Nova categoria</AkButton>
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
              <div class="subject-leading subject-leading--sm">
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

    <AkFab>
      <AkButton size="lg" aria-label="Nova matéria" @click="openAddSubject">
        <template #icon>
          <AkIcon name="plus-outline" />
        </template>
        Nova
      </AkButton>
    </AkFab>

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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  AkBadge, AkButton, AkChip, AkEmptyState, AkFab, AkIcon, AkIconButton, AkList, AkListRow, AkPageHeader, AkSectionHeader,
} from '@rafael_dias/akoma'
import { useSubjectsStore } from '@/stores/subjects'
import SubjectModal from '@/components/subjects/SubjectModal.vue'
import SubjectIcon from '@/components/ui/SubjectIcon.vue'
import CategoryModal from '@/components/subjects/CategoryModal.vue'
import { useAppToast } from '@/composables/useAppToast'
import { useConfirmSheet } from '@/composables/useConfirmSheet'
import type { Subject, Category } from '@/types'

const router = useRouter()
const subjectsStore = useSubjectsStore()
const toast = useAppToast()
const confirmSheet = useConfirmSheet()
const showSubjectModal = ref(false)
const showCategoryModal = ref(false)
const editingSubject = ref<Subject | null>(null)
const editingCategory = ref<Category | null>(null)
const selectedCategoryFilter = ref<string | null>(null)
const listMode = ref<'active' | 'archived'>('active')

const activeSubjects = computed(() => subjectsStore.activeSubjects)
const archivedSubjects = computed(() => subjectsStore.archivedSubjects)

const filteredSubjects = computed(() => {
  if (listMode.value === 'archived') return archivedSubjects.value
  if (!selectedCategoryFilter.value) return activeSubjects.value
  return activeSubjects.value.filter(s => s.categoryId === selectedCategoryFilter.value)
})

const visibleCategories = computed(() =>
  subjectsStore.categories.filter(cat => activeSubjects.value.some(s => s.categoryId === cat.id)),
)

function showActive(categoryId: string | null) {
  listMode.value = 'active'
  selectedCategoryFilter.value = categoryId
}

function showArchived() {
  listMode.value = 'archived'
}

function openSubjectStats(id: string) {
  router.push(`/subjects/${id}`)
}

function openAddSubject() {
  editingSubject.value = null
  showSubjectModal.value = true
}

function openEditSubject(subject: Subject) {
  editingSubject.value = subject
  showSubjectModal.value = true
}

async function confirmArchiveSubject(subject: Subject) {
  const ok = await confirmSheet.ask({
    title: 'Arquivar matéria',
    message: `${subject.name} não aparecerá mais para iniciar novas sessões. O histórico será mantido.`,
  })
  if (!ok) return
  await subjectsStore.archiveSubject(subject.id)
  toast.success('Matéria arquivada')
}

async function restoreSubject(id: string) {
  await subjectsStore.restoreSubject(id)
  toast.success('Matéria restaurada')
  listMode.value = 'active'
}

async function confirmDeleteSubject(id: string) {
  const ok = await confirmSheet.ask({
    title: 'Excluir matéria',
    message: 'O histórico de sessões será mantido.',
  })
  if (!ok) return
  await subjectsStore.removeSubject(id)
  toast.success('Matéria excluída')
}

function openEditCategory(cat: Category) {
  editingCategory.value = cat
  showCategoryModal.value = true
}

function getSubjectCategory(subject: Subject) {
  return subject.categoryId ? subjectsStore.getCategory(subject.categoryId) : null
}

function countInCategory(catId: string) {
  const n = activeSubjects.value.filter(s => s.categoryId === catId).length
  return n === 1 ? '1' : String(n)
}

async function confirmDeleteCategory(id: string) {
  const ok = await confirmSheet.ask({
    title: 'Excluir categoria',
    message: 'As matérias serão mantidas sem categoria.',
  })
  if (!ok) return
  await subjectsStore.removeCategory(id)
  toast.success('Categoria excluída')
}
</script>
