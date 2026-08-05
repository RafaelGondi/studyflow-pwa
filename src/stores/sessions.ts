import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import { useGamificationStore } from './gamification'
import { useSubjectsStore } from './subjects'
import * as db from '@/firebase/db'
import type { StudySession } from '@/types'
import { todayDateString, localDateStr, isStudySession, isBreakSession } from '@/types'

export const useSessionsStore = defineStore('sessions', () => {
  const auth = useAuthStore()
  const gamification = useGamificationStore()
  const subjects = useSubjectsStore()
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
    gamification.trackSession(session)
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
    const coinRatePerHour = gamification.settings.coinsPerHour
    const coinsEligible = subjects.subjectEarnsCoins(data.subjectId)
    const activityKind = subjects.subjectActivityKind(data.subjectId)
    const coinMultiplier = subjects.subjectCoinMultiplier(data.subjectId)
    return save({
      kind: 'study',
      ...data,
      coinRatePerHour,
      coinsEligible,
      activityKind,
      coinMultiplier,
      coinsEarned: coinsEligible
        ? gamification.calculateCoins(data.duration, coinRatePerHour, coinMultiplier)
        : 0,
    })
  }

  async function update(id: string, data: Partial<StudySession>) {
    if (!auth.uid) return
    let current = [...todaySessions.value, ...rangeSessions.value].find(s => s.id === id)
    if (!current) {
      current = await db.fetchSession(auth.uid, id) ?? undefined
    }
    const patchData = { ...data }
    if (current && isStudySession(current) && current.coinsEarned != null && data.duration != null) {
      const rate = current.coinRatePerHour ?? gamification.settings.coinsPerHour
      const multiplier = current.coinMultiplier ?? 1
      patchData.coinRatePerHour = rate
      patchData.coinMultiplier = multiplier
      patchData.coinsEarned = current.coinsEligible === false
        ? 0
        : gamification.calculateCoins(data.duration, rate, multiplier)
    }
    await db.updateSession(auth.uid, id, patchData)
    const patch = (list: StudySession[]) => {
      const idx = list.findIndex(s => s.id === id)
      if (idx !== -1) list[idx] = { ...list[idx], ...patchData }
    }
    patch(todaySessions.value)
    patch(rangeSessions.value)
    const updated = current ? { ...current, ...patchData } : undefined
    gamification.trackSession(updated)
  }

  async function fetchBySubject(subjectId: string): Promise<StudySession[]> {
    if (!auth.uid) return []
    return db.fetchSessionsBySubject(auth.uid, subjectId)
  }

  async function remove(id: string) {
    if (!auth.uid) return
    await db.deleteSession(auth.uid, id)
    todaySessions.value = todaySessions.value.filter(s => s.id !== id)
    gamification.forgetSession(id)
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
    loadToday, loadRange, fetchRange, fetchBySubject, loadDate,
    save, saveStudy, saveBreak, update, remove,
  }
})
