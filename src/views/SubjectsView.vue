<template>
  <div class="min-h-screen flex flex-col akoma-page">
    <header class="mb-5 reveal">
      <span class="page-label">Organização</span>
      <h1 class="page-title">Matérias</h1>
      <p class="text-sm text-muted mt-2">{{ subjectsStore.subjects.length }} matérias · {{ subjectsStore.categories.length }} categorias</p>
    </header>

    <div class="pb-3 reveal reveal-d1">
      <div class="filter-scroll">
        <CategoryChip
          accent
          :active="selectedCategoryFilter === null"
          @click="selectedCategoryFilter = null"
        >
          Todas
        </CategoryChip>
        <CategoryChip
          v-for="cat in subjectsStore.categories"
          :key="cat.id"
          :active="selectedCategoryFilter === cat.id"
          :color="cat.color"
          @click="selectedCategoryFilter = cat.id"
        >
          {{ cat.name }}
        </CategoryChip>
      </div>
    </div>

    <main class="flex-1 overflow-y-auto pb-4 space-y-6 reveal reveal-d2">
      <!-- Subjects grid -->
      <div v-if="filteredSubjects.length === 0" class="flex flex-col items-center justify-center py-16 text-center">
        <span class="text-5xl mb-4">📚</span>
        <p class="text-muted font-medium">Nenhuma matéria encontrada</p>
        <p class="text-faint text-sm mt-1">Toque no + para adicionar</p>
      </div>

      <div v-else class="grid grid-cols-1 gap-3">
        <div
          v-for="subject in filteredSubjects"
          :key="subject.id"
          class="flex items-center gap-4 p-4 card tap-scale group"
        >
          <div
            class="w-12 h-12 rounded-akoma flex items-center justify-center text-2xl flex-shrink-0"
            :style="{ background: `${subject.color}20` }"
          >
            {{ subject.icon }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-primary">{{ subject.name }}</p>
            <div class="flex items-center gap-2 mt-1">
              <div
                class="w-2 h-2 rounded-full flex-shrink-0"
                :style="{ background: getSubjectCategory(subject)?.color ?? subject.color }"
              />
              <span class="text-xs text-muted truncate">
                {{ getSubjectCategory(subject)?.name ?? 'Sem categoria' }}
              </span>
            </div>
          </div>
          <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              @click="openEditSubject(subject)"
              class="w-8 h-8 btn-icon tap-scale"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button
              @click="confirmDeleteSubject(subject.id)"
              class="w-8 h-8 btn-icon tap-scale hover:text-red-400"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Categories section -->
      <div class="space-y-3">
        <div class="flex items-center justify-between px-1">
          <h2 class="text-sm font-semibold text-muted uppercase tracking-wider">Categorias</h2>
          <button
            @click="showCategoryModal = true"
            class="text-xs text-accent/80 hover:text-accent/70 transition-colors font-medium"
          >
            + Adicionar
          </button>
        </div>

        <div v-if="subjectsStore.categories.length === 0" class="py-4 text-center text-faint text-sm">
          Nenhuma categoria criada
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="cat in subjectsStore.categories"
            :key="cat.id"
            class="card flex items-center gap-3 px-3 py-3 transition-all group"
          >
            <div
              class="w-1 self-stretch rounded-full flex-shrink-0 min-h-[28px]"
              :style="{ background: cat.color }"
            />
            <span class="text-sm font-semibold flex-1 min-w-0 truncate text-primary">{{ cat.name }}</span>
            <span
              class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm text-white flex-shrink-0"
              :style="{ background: cat.color }"
            >
              {{ countInCategory(cat.id) }}
            </span>
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                @click="openEditCategory(cat)"
                class="w-7 h-7 rounded-sm flex items-center justify-center text-muted hover:text-primary transition-colors"
                :style="{ background: `${cat.color}20` }"
              >
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button
                @click="confirmDeleteCategory(cat.id)"
                class="w-7 h-7 rounded-sm flex items-center justify-center text-muted hover:text-red-400 transition-colors"
                :style="{ background: `${cat.color}20` }"
              >
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- FAB -->
    <button
      @click="openAddSubject"
      class="fixed right-5 bottom-24 w-14 h-14 rounded-full btn-primary shadow-akoma-md flex items-center justify-center z-40 tap-scale"
    >
      <svg class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    </button>

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
import { useSubjectsStore } from '@/stores/subjects'
import SubjectModal from '@/components/subjects/SubjectModal.vue'
import CategoryModal from '@/components/subjects/CategoryModal.vue'
import CategoryChip from '@/components/ui/CategoryChip.vue'
import type { Subject, Category } from '@/types'

const subjectsStore = useSubjectsStore()
const showSubjectModal = ref(false)
const showCategoryModal = ref(false)
const editingSubject = ref<Subject | null>(null)
const editingCategory = ref<Category | null>(null)
const selectedCategoryFilter = ref<string | null>(null)

const filteredSubjects = computed(() => {
  if (!selectedCategoryFilter.value) return subjectsStore.subjects
  return subjectsStore.subjects.filter(s => s.categoryId === selectedCategoryFilter.value)
})

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
  return n === 1 ? '1 matéria' : `${n} matérias`
}

async function confirmDeleteCategory(id: string) {
  if (confirm('Excluir esta categoria? As matérias serão mantidas sem categoria.')) {
    await subjectsStore.removeCategory(id)
  }
}
</script>

<style scoped>
.filter-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  overflow-y: visible;
  margin: 0 calc(-1 * var(--page-pad-x)) 14px;
  padding: 6px var(--page-pad-x);
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.filter-scroll::-webkit-scrollbar {
  display: none;
}
</style>
