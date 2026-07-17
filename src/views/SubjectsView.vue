<template>
  <div class="page akoma-page">
    <header class="page-header reveal">
      <span class="page-label">Organização</span>
      <h1 class="page-title">Matérias</h1>
      <p class="page-subtitle">{{ subjectsStore.subjects.length }} matérias · {{ subjectsStore.categories.length }} categorias</p>
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

    <main class="scroll-main stack reveal reveal-d2">
      <AkEmptyState
        v-if="filteredSubjects.length === 0"
        title="Nenhuma matéria encontrada"
        description="Toque no + para adicionar sua primeira matéria."
      />

      <div v-else class="stack-sm">
        <AkCard
          v-for="subject in filteredSubjects"
          :key="subject.id"
          padding="md"
          class="subject-card"
        >
          <div class="flex-row" style="gap: var(--space-4)">
            <div
              class="subject-avatar subject-avatar--lg"
              :style="{ background: colorMix(subject.color, 12) }"
            >
              {{ subject.icon }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-primary">{{ subject.name }}</p>
              <div class="flex-row" style="gap: var(--space-2); margin-top: var(--space-1)">
                <div
                  class="status-dot"
                  :style="{ background: getSubjectCategory(subject)?.color ?? subject.color }"
                />
                <span class="text-xs text-muted truncate">
                  {{ getSubjectCategory(subject)?.name ?? 'Sem categoria' }}
                </span>
              </div>
              <p v-if="todayTime(subject.id)" class="text-xs text-secondary numeric" style="margin-top: var(--space-1)">
                Hoje: {{ todayTime(subject.id) }}
              </p>
            </div>
            <div class="flex-row" style="gap: var(--space-2)">
              <AkButton
                size="sm"
                variant="secondary"
                :style="{ '--ak-chip-active-bg': colorMix(subject.color, 12), color: subject.color }"
                @click="startStudying(subject.id)"
              >
                <template #icon>
                  <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
                </template>
              </AkButton>
              <AkButton size="sm" variant="ghost" @click="openEditSubject(subject)">
                <template #icon>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </template>
              </AkButton>
              <AkButton size="sm" variant="ghost" @click="confirmDeleteSubject(subject.id)">
                <template #icon>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                </template>
              </AkButton>
            </div>
          </div>
        </AkCard>
      </div>

      <div class="stack-sm">
        <div class="flex-between" style="padding: 0 var(--space-1)">
          <h2 class="section-title">Categorias</h2>
          <AkButton size="sm" variant="ghost" @click="showCategoryModal = true">+ Adicionar</AkButton>
        </div>

        <AkEmptyState
          v-if="subjectsStore.categories.length === 0"
          title="Nenhuma categoria"
          description="Organize suas matérias em categorias."
        />

        <AkCard
          v-for="cat in subjectsStore.categories"
          :key="cat.id"
          padding="sm"
        >
          <div class="flex-row" style="gap: var(--space-3)">
            <div class="timeline-bar" :style="{ background: cat.color, width: '4px' }" />
            <span class="text-sm font-semibold flex-1 min-w-0 truncate text-primary">{{ cat.name }}</span>
            <AkBadge variant="neutral" :label="countInCategory(cat.id)" />
            <AkButton size="sm" variant="ghost" @click="openEditCategory(cat)">
              <template #icon>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </template>
            </AkButton>
            <AkButton size="sm" variant="ghost" @click="confirmDeleteCategory(cat.id)">
              <template #icon>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </template>
            </AkButton>
          </div>
        </AkCard>
      </div>
    </main>

    <AkButton class="fab" variant="primary" @click="openAddSubject">
      <template #icon>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </template>
    </AkButton>

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
import { AkBadge, AkButton, AkCard, AkChip, AkEmptyState } from '@rafael_dias/akoma'
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
  return `color-mix(in srgb, ${color} ${pct}%, var(--bg-elevated))`
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
  return n === 1 ? '1 matéria' : `${n} matérias`
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
