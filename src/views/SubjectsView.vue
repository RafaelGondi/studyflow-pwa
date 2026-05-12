<template>
  <div class="min-h-screen bg-app-bg flex flex-col">
    <!-- Header -->
    <header class="px-5 pt-safe-top pb-4 pt-6">
      <h1 class="text-2xl font-bold text-primary">Matérias</h1>
      <p class="text-sm text-muted mt-1">{{ subjectsStore.subjects.length }} matérias · {{ subjectsStore.categories.length }} categorias</p>
    </header>

    <!-- Category filter tabs -->
    <div class="px-4 pb-2">
      <div class="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          @click="selectedCategoryFilter = null"
          class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200"
          :class="selectedCategoryFilter === null ? 'bg-accent/20 border-accent/50 text-accent/70' : 'bg-app-card border-app-border text-muted hover:text-primary'"
        >
          Todas
        </button>
        <button
          v-for="cat in subjectsStore.categories"
          :key="cat.id"
          @click="selectedCategoryFilter = cat.id"
          class="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200"
          :class="selectedCategoryFilter === cat.id ? 'border-transparent text-white' : 'bg-app-card border-app-border text-muted hover:text-primary'"
          :style="selectedCategoryFilter === cat.id ? { background: `${cat.color}30`, borderColor: `${cat.color}60`, color: cat.color } : {}"
        >
          <div class="w-1.5 h-1.5 rounded-full" :style="{ background: cat.color }" />
          {{ cat.name }}
        </button>
      </div>
    </div>

    <main class="flex-1 overflow-y-auto px-4 pb-28 space-y-6">
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
          class="flex items-center gap-4 p-4 rounded-sm bg-app-card border border-app-border transition-all duration-200 hover:bg-app-elevated group"
        >
          <div
            class="w-12 h-12 rounded-md flex items-center justify-center text-2xl flex-shrink-0 shadow-sm"
            :style="{ background: `${subject.color}20` }"
          >
            {{ subject.icon }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-primary">{{ subject.name }}</p>
            <div class="flex items-center gap-2 mt-1">
              <div class="w-2 h-2 rounded-full flex-shrink-0" :style="{ background: subject.color }" />
              <span class="text-xs text-muted truncate">
                {{ subjectsStore.getCategory(subject.categoryId ?? '')?.name ?? 'Sem categoria' }}
              </span>
            </div>
          </div>
          <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              @click="openEditSubject(subject)"
              class="w-8 h-8 rounded-sm bg-app-elevated flex items-center justify-center text-muted hover:text-primary transition-colors"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button
              @click="confirmDeleteSubject(subject.id)"
              class="w-8 h-8 rounded-sm bg-app-elevated flex items-center justify-center text-muted hover:text-red-400 transition-colors"
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

        <div v-else class="flex flex-wrap gap-2">
          <div
            v-for="cat in subjectsStore.categories"
            :key="cat.id"
            class="flex items-center gap-2 px-3 py-2 rounded-md border transition-all group"
            :style="{ background: `${cat.color}15`, borderColor: `${cat.color}40` }"
          >
            <div class="w-2 h-2 rounded-full" :style="{ background: cat.color }" />
            <span class="text-sm font-medium" :style="{ color: cat.color }">{{ cat.name }}</span>
            <button
              @click="confirmDeleteCategory(cat.id)"
              class="w-4 h-4 rounded-full flex items-center justify-center text-faint hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 ml-1"
            >
              <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- FAB -->
    <button
      @click="openAddSubject"
      class="fixed right-5 bottom-24 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-200 active:scale-90 z-40"
      style="background: linear-gradient(135deg, var(--accent-color), color-mix(in oklch, var(--accent-color) 60%, black)); box-shadow: 0 8px 24px color-mix(in oklch, var(--accent-color) 40%, transparent)"
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
      @close="showCategoryModal = false"
      @saved="subjectsStore.load()"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSubjectsStore } from '@/stores/subjects'
import SubjectModal from '@/components/subjects/SubjectModal.vue'
import CategoryModal from '@/components/subjects/CategoryModal.vue'
import type { Subject } from '@/types'

const subjectsStore = useSubjectsStore()
const showSubjectModal = ref(false)
const showCategoryModal = ref(false)
const editingSubject = ref<Subject | null>(null)
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

async function confirmDeleteCategory(id: string) {
  if (confirm('Excluir esta categoria? As matérias serão mantidas sem categoria.')) {
    await subjectsStore.removeCategory(id)
  }
}
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
