import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import * as db from '@/firebase/db'
import type { StudySession } from '@/types'
import { todayDateString, localDateStr } from '@/types'

export const useSessionsStore = defineStore('sessions', () => {
  const auth = useAuthStore()
  const todaySessions = ref<StudySession[]>([])
  const rangeSessions = ref<StudySession[]>([])

  async function loadToday() {
    if (!auth.uid) return
    todaySessions.value = await db.fetchSessionsByDate(auth.uid, todayDateString())
  }

  async function loadRange(from: string, to: string) {
    if (!auth.uid) return
    rangeSessions.value = await db.fetchSessionsByDateRange(auth.uid, from, to)
  }

  async function loadDate(date: string): Promise<StudySession[]> {
    if (!auth.uid) return []
    return db.fetchSessionsByDate(auth.uid, date)
  }

  async function save(data: Omit<StudySession, 'id' | 'userId' | 'date'>) {
    if (!auth.uid) return
    const date = localDateStr(new Date(data.startTime))
    const session = await db.saveSession(auth.uid, { ...data, date })
    if (date === todayDateString()) todaySessions.value.unshift(session)
    return session
  }

  async function remove(id: string) {
    if (!auth.uid) return
    await db.deleteSession(auth.uid, id)
    todaySessions.value = todaySessions.value.filter(s => s.id !== id)
    rangeSessions.value = rangeSessions.value.filter(s => s.id !== id)
  }

  const todayTotalSeconds = computed(() =>
    todaySessions.value.reduce((acc, s) => acc + s.duration, 0)
  )

  const todayBySubject = computed(() => {
    const map = new Map<string, number>()
    for (const s of todaySessions.value) {
      map.set(s.subjectId, (map.get(s.subjectId) ?? 0) + s.duration)
    }
    return map
  })

  return {
    todaySessions, rangeSessions,
    todayTotalSeconds, todayBySubject,
    loadToday, loadRange, loadDate, save, remove,
  }
})
