import { defineStore } from 'pinia'
import { DEFAULT_ACTIVITY, activityMultiplier } from '@/utils/coins'
import { computed, ref } from 'vue'
import { useAuthStore } from './auth'
import * as db from '@/firebase/db'
import type { ActivityKind, Subject, Category } from '@/types'
import { normalizeAkomaColor } from '@/utils/colors'

function withAkomaColor<T extends { color: string }>(item: T): T {
  return { ...item, color: normalizeAkomaColor(item.color) }
}

export const useSubjectsStore = defineStore('subjects', () => {
  const auth = useAuthStore()
  const subjects = ref<Subject[]>([])
  const categories = ref<Category[]>([])
  const loading = ref(false)
  const activeSubjects = computed(() => subjects.value.filter(s => !s.archivedAt))
  const archivedSubjects = computed(() => subjects.value.filter(s => !!s.archivedAt))

  async function load() {
    if (!auth.uid) return
    loading.value = true
    try {
      const [rawSubjects, rawCategories] = await Promise.all([
        db.fetchSubjects(auth.uid),
        db.fetchCategories(auth.uid),
      ])
      subjects.value = rawSubjects.map(withAkomaColor)
      categories.value = rawCategories.map(withAkomaColor)
    } catch (e) {
      console.error('[StudyFlow] Erro ao carregar matérias/categorias:', e)
    } finally {
      loading.value = false
    }
  }

  async function addSubject(data: Omit<Subject, 'id' | 'userId' | 'createdAt'>) {
    if (!auth.uid) return
    const payload = { ...data, color: normalizeAkomaColor(data.color) }
    const s = await db.addSubject(auth.uid, payload)
    subjects.value.push(s)
    return s
  }

  async function updateSubject(id: string, data: Partial<Subject>) {
    if (!auth.uid) return
    const patch = data.color != null
      ? { ...data, color: normalizeAkomaColor(data.color) }
      : data
    await db.updateSubject(auth.uid, id, patch)
    const idx = subjects.value.findIndex(s => s.id === id)
    if (idx !== -1) subjects.value[idx] = { ...subjects.value[idx], ...patch }
  }

  async function removeSubject(id: string) {
    if (!auth.uid) return
    await db.deleteSubject(auth.uid, id)
    subjects.value = subjects.value.filter(s => s.id !== id)
  }

  async function archiveSubject(id: string) {
    await updateSubject(id, { archivedAt: Date.now() })
  }

  async function restoreSubject(id: string) {
    await updateSubject(id, { archivedAt: null })
  }

  async function addCategory(data: Omit<Category, 'id' | 'userId' | 'createdAt'>) {
    if (!auth.uid) return
    const payload = { ...data, color: normalizeAkomaColor(data.color) }
    const c = await db.addCategory(auth.uid, payload)
    categories.value.push(c)
    return c
  }

  async function updateCategory(id: string, data: Partial<Category>) {
    if (!auth.uid) return
    const patch = data.color != null
      ? { ...data, color: normalizeAkomaColor(data.color) }
      : data
    await db.updateCategory(auth.uid, id, patch)
    const idx = categories.value.findIndex(c => c.id === id)
    if (idx !== -1) categories.value[idx] = { ...categories.value[idx], ...patch }
  }

  async function moveCategory(id: string, direction: -1 | 1) {
    if (!auth.uid) return
    const currentIndex = categories.value.findIndex(c => c.id === id)
    const targetIndex = currentIndex + direction
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= categories.value.length) return

    const previous = categories.value
    const reordered = [...categories.value]
    const [category] = reordered.splice(currentIndex, 1)
    reordered.splice(targetIndex, 0, category)
    categories.value = reordered.map((item, order) => ({ ...item, order }))

    try {
      await db.reorderCategories(auth.uid, categories.value.map(c => c.id))
    } catch (error) {
      categories.value = previous
      throw error
    }
  }

  async function removeCategory(id: string) {
    if (!auth.uid) return
    await db.deleteCategory(auth.uid, id)
    categories.value = categories.value.filter(c => c.id !== id)
    subjects.value.forEach(s => {
      if (s.categoryId === id) s.categoryId = null
    })
  }

  function getSubject(id: string) {
    return subjects.value.find(s => s.id === id)
  }
  /** Tipo da matéria. Ausente = estudo, para não mexer no que já existe. */
  function subjectActivityKind(id: string): ActivityKind {
    return getSubject(id)?.activityKind ?? DEFAULT_ACTIVITY
  }

  /** Peso da hora dessa matéria: 1x estudo, 0,25x leitura, 0,1x trabalho. */
  function subjectCoinMultiplier(id: string): number {
    return activityMultiplier(subjectActivityKind(id))
  }

  function subjectEarnsCoins(id: string): boolean {
    const subject = getSubject(id)
    if (!subject) return false
    if (subject.earnsCoins != null) return subject.earnsCoins
    if (!subject.categoryId) return true
    return getCategory(subject.categoryId)?.earnsCoins !== false
  }


  function getCategory(id: string) {
    return categories.value.find(c => c.id === id)
  }

  return {
    subjects, activeSubjects, archivedSubjects, categories, loading,
    load, addSubject, updateSubject, removeSubject, archiveSubject, restoreSubject,
    addCategory, updateCategory, moveCategory, removeCategory,
    getSubject, getCategory, subjectEarnsCoins, subjectActivityKind, subjectCoinMultiplier,
  }
})
