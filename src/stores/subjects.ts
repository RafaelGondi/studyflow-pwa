import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import * as db from '@/firebase/db'
import type { Subject, Category } from '@/types'

export const useSubjectsStore = defineStore('subjects', () => {
  const auth = useAuthStore()
  const subjects = ref<Subject[]>([])
  const categories = ref<Category[]>([])
  const loading = ref(false)

  async function load() {
    if (!auth.uid) return
    loading.value = true
    ;[subjects.value, categories.value] = await Promise.all([
      db.fetchSubjects(auth.uid),
      db.fetchCategories(auth.uid),
    ])
    loading.value = false
  }

  async function addSubject(data: Omit<Subject, 'id' | 'userId' | 'createdAt'>) {
    if (!auth.uid) return
    const s = await db.addSubject(auth.uid, data)
    subjects.value.push(s)
    return s
  }

  async function updateSubject(id: string, data: Partial<Subject>) {
    if (!auth.uid) return
    await db.updateSubject(auth.uid, id, data)
    const idx = subjects.value.findIndex(s => s.id === id)
    if (idx !== -1) subjects.value[idx] = { ...subjects.value[idx], ...data }
  }

  async function removeSubject(id: string) {
    if (!auth.uid) return
    await db.deleteSubject(auth.uid, id)
    subjects.value = subjects.value.filter(s => s.id !== id)
  }

  async function addCategory(data: Omit<Category, 'id' | 'userId' | 'createdAt'>) {
    if (!auth.uid) return
    const c = await db.addCategory(auth.uid, data)
    categories.value.push(c)
    return c
  }

  async function updateCategory(id: string, data: Partial<Category>) {
    if (!auth.uid) return
    await db.updateCategory(auth.uid, id, data)
    const idx = categories.value.findIndex(c => c.id === id)
    if (idx !== -1) categories.value[idx] = { ...categories.value[idx], ...data }
  }

  async function removeCategory(id: string) {
    if (!auth.uid) return
    await db.deleteCategory(auth.uid, id)
    categories.value = categories.value.filter(c => c.id !== id)
    // unlink subjects that used this category
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
    subjects, categories, loading,
    load, addSubject, updateSubject, removeSubject,
    addCategory, updateCategory, removeCategory,
    getSubject, getCategory,
  }
})
