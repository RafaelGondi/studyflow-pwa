import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useAuthStore } from './auth'
import * as db from '@/firebase/db'
import type { Subject, Category } from '@/types'
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

  function getCategory(id: string) {
    return categories.value.find(c => c.id === id)
  }

  return {
    subjects, activeSubjects, archivedSubjects, categories, loading,
    load, addSubject, updateSubject, removeSubject, archiveSubject, restoreSubject,
    addCategory, updateCategory, removeCategory,
    getSubject, getCategory,
  }
})
