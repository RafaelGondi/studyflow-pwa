import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import * as db from '@/firebase/db'
import type { StudySession } from '@/types'
import { todayDateString, localDateStr, isStudySession, isBreakSession } from '@/types'

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

  async function fetchRange(from: string, to: string): Promise<StudySession[]> {
    if (!auth.uid) return []
    return db.fetchSessionsByDateRange(auth.uid, from, to)
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

  async function saveBreak(data: { startTime: number; endTime: number; duration: number }) {
    return save({
      kind: 'break',
      startTime: data.startTime,
      endTime: data.endTime,
      duration: data.duration,
    })
  }

  async function saveStudy(data: {
    subjectId: string
    startTime: number
    endTime: number
    duration: number
    segments?: StudySession['segments']
  }) {
    return save({ kind: 'study', ...data })
  }

  async function update(id: string, data: Partial<StudySession>) {
    if (!auth.uid) return
    await db.updateSession(auth.uid, id, data)
    const patch = (list: StudySession[]) => {
      const idx = list.findIndex(s => s.id === id)
      if (idx !== -1) list[idx] = { ...list[idx], ...data }
    }
    patch(todaySessions.value)
    patch(rangeSessions.value)
  }

  async function remove(id: string) {
    if (!auth.uid) return
    await db.deleteSession(auth.uid, id)
    todaySessions.value = todaySessions.value.filter(s => s.id !== id)
    rangeSessions.value = rangeSessions.value.filter(s => s.id !== id)
  }

  const todayStudySessions = computed(() => todaySessions.value.filter(isStudySession))
  const todayBreakSessions = computed(() => todaySessions.value.filter(isBreakSession))

  const todayStudyTotalSeconds = computed(() =>
    todayStudySessions.value.reduce((acc, s) => acc + s.duration, 0)
  )

  const todayBreakTotalSeconds = computed(() =>
    todayBreakSessions.value.reduce((acc, s) => acc + s.duration, 0)
  )

  const todayBySubject = computed(() => {
    const map = new Map<string, number>()
    for (const s of todayStudySessions.value) {
      if (!s.subjectId) continue
      map.set(s.subjectId, (map.get(s.subjectId) ?? 0) + s.duration)
    }
    return map
  })

  /** @deprecated use todayStudyTotalSeconds */
  const todayTotalSeconds = todayStudyTotalSeconds

  return {
    todaySessions, rangeSessions,
    todayStudySessions, todayBreakSessions,
    todayStudyTotalSeconds, todayBreakTotalSeconds,
    todayTotalSeconds, todayBySubject,
    loadToday, loadRange, fetchRange, loadDate,
    save, saveStudy, saveBreak, update, remove,
  }
})
