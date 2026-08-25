import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from './auth'
import { useGamificationStore } from './gamification'
import { useSessionsStore } from './sessions'
import { useSubjectsStore } from './subjects'
import { useTimerStore } from './timer'
import * as db from '@/firebase/db'
import { isStudySession, localDateStr } from '@/types'
import type { PetMood, PetProfile, StudySession } from '@/types'
import { ACTIVITIES, DEFAULT_ACTIVITY, activityMultiplier } from '@/utils/coins'

const LEVEL_SIZE = 100
export const PET_DAILY_GOAL_SECONDS = 60 * 60
export const PET_MAX_HEARTS = 5

const moodMeta: Record<PetMood, { label: string; message: string }> = {
  sleepy: { label: 'Sonolenta', message: 'Estou esperando nosso primeiro foco de hoje.' },
  hungry: { label: 'Com fome', message: 'Senti sua falta ontem. Um pouco de foco hoje vai me fazer bem.' },
  curious: { label: 'Curiosa', message: 'Eu vi você começar. Vamos só mais um pouquinho?' },
  happy: { label: 'Animada', message: 'Seu ritmo de hoje já deixou minha estrela brilhando!' },
  proud: { label: 'Orgulhosa', message: 'Que dia bonito de dedicação. Eu sabia que você conseguia.' },
  away: { label: 'Foi embora', message: 'Fiquei muito tempo sozinha. Complete a meta de hoje para eu encontrar o caminho de volta.' },
}

function parseDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function previousDate(value: string) {
  const date = parseDate(value)
  date.setDate(date.getDate() - 1)
  return localDateStr(date)
}

function sessionCareMultiplier(session: StudySession) {
  if (Number.isFinite(session.coinMultiplier) && session.coinMultiplier! > 0) {
    return session.coinMultiplier!
  }
  return activityMultiplier(session.activityKind)
}

export const usePetStore = defineStore('pet', () => {
  const auth = useAuthStore()
  const gamification = useGamificationStore()
  const sessions = useSessionsStore()
  const subjects = useSubjectsStore()
  const timer = useTimerStore()
  const profile = ref<PetProfile | null>(null)
  const careSessions = ref<StudySession[]>([])
  const loading = ref(false)

  const name = computed(() => profile.value?.name || 'Lumi')
  const bondPoints = computed(() => Math.max(0, Math.floor(gamification.earnedCoins)))
  const level = computed(() => Math.floor(bondPoints.value / LEVEL_SIZE) + 1)
  const levelProgress = computed(() => bondPoints.value % LEVEL_SIZE)
  const todaySeconds = computed(() => sessions.todayStudyTotalSeconds + timer.studyElapsedSeconds)
  const liveCareSeconds = computed(() => {
    if (!timer.activeSubjectId || timer.isInBreak) return 0
    return timer.studyElapsedSeconds * subjects.subjectCoinMultiplier(timer.activeSubjectId)
  })
  const todayCareSeconds = computed(() =>
    sessions.todayStudySessions.reduce((total, session) =>
      total + session.duration * sessionCareMultiplier(session), 0) + liveCareSeconds.value,
  )
  const todayCareBreakdown = computed(() => ACTIVITIES.map(activity => {
    let actualSeconds = sessions.todayStudySessions.reduce((total, session) =>
      (session.activityKind ?? DEFAULT_ACTIVITY) === activity.id ? total + session.duration : total, 0)
    let equivalentSeconds = sessions.todayStudySessions.reduce((total, session) =>
      (session.activityKind ?? DEFAULT_ACTIVITY) === activity.id
        ? total + session.duration * sessionCareMultiplier(session)
        : total, 0)
    if (timer.activeSubjectId && !timer.isInBreak && subjects.subjectActivityKind(timer.activeSubjectId) === activity.id) {
      actualSeconds += timer.studyElapsedSeconds
      equivalentSeconds += timer.studyElapsedSeconds * subjects.subjectCoinMultiplier(timer.activeSubjectId)
    }
    return { ...activity, actualSeconds, equivalentSeconds }
  }).filter(part => part.actualSeconds > 0))
  const dailyTotals = computed(() => {
    const totals = new Map<string, number>()
    const today = localDateStr()
    for (const session of careSessions.value) {
      if (!isStudySession(session) || session.date === today) continue
      totals.set(session.date, (totals.get(session.date) ?? 0) + session.duration * sessionCareMultiplier(session))
    }
    totals.set(today, todayCareSeconds.value)
    return totals
  })
  const todayGoalMet = computed(() => todayCareSeconds.value >= PET_DAILY_GOAL_SECONDS)
  const careProgress = computed(() => Math.min(100, todayCareSeconds.value / PET_DAILY_GOAL_SECONDS * 100))

  /** Dias completos sem meta, contados até ontem. O dia atual só pode recuperar, nunca punir antes de acabar. */
  const missedDays = computed(() => {
    if (!profile.value?.careStartedDate || todayGoalMet.value) return 0
    let cursor = previousDate(localDateStr())
    let missed = 0
    while (cursor >= profile.value.careStartedDate) {
      if ((dailyTotals.value.get(cursor) ?? 0) >= PET_DAILY_GOAL_SECONDS) break
      missed += 1
      cursor = previousDate(cursor)
    }
    return missed
  })
  const hearts = computed(() => todayGoalMet.value
    ? PET_MAX_HEARTS
    : Math.max(0, PET_MAX_HEARTS - missedDays.value))
  const isAway = computed(() => hearts.value === 0)

  /** A sequência de ontem continua em risco durante hoje; atingir a meta confirma mais um dia. */
  const streak = computed(() => {
    if (!profile.value?.careStartedDate) return 0
    let cursor = todayGoalMet.value ? localDateStr() : previousDate(localDateStr())
    let count = 0
    while (cursor >= profile.value.careStartedDate) {
      if ((dailyTotals.value.get(cursor) ?? 0) < PET_DAILY_GOAL_SECONDS) break
      count += 1
      cursor = previousDate(cursor)
    }
    return count
  })
  const streakAtRisk = computed(() => streak.value > 0 && !todayGoalMet.value)
  const careSummary = computed(() => {
    if (isAway.value) return 'Complete 1h hoje para trazê-la de volta'
    if (todayGoalMet.value) return `${streak.value} ${streak.value === 1 ? 'dia' : 'dias'} de sequência · bem alimentada`
    if (missedDays.value > 0) return `${hearts.value}/${PET_MAX_HEARTS} corações · sequência em risco`
    return `Meta diária: ${Math.floor(todayCareSeconds.value / 60)}/60 min equivalentes`
  })
  const mood = computed<PetMood>(() => {
    if (isAway.value) return 'away'
    if (todaySeconds.value >= 3600) return 'proud'
    if (todaySeconds.value >= 1500) return 'happy'
    if (todaySeconds.value > 0) return 'curious'
    if (missedDays.value > 0) return 'hungry'
    return 'sleepy'
  })
  const moodLabel = computed(() => moodMeta[mood.value].label)
  const message = computed(() => moodMeta[mood.value].message)

  async function load() {
    if (!auth.uid) return
    loading.value = true
    try {
      const saved = await db.fetchPetProfile(auth.uid)
      const now = Date.now()
      const careStartedDate = saved?.careStartedDate ?? localDateStr()
      profile.value = saved ?? {
        petId: 'lumi', name: 'Lumi', careStartedDate, createdAt: now, updatedAt: now,
      }
      if (!saved?.careStartedDate) {
        profile.value = { ...profile.value, careStartedDate, updatedAt: now }
        await db.savePetProfile(auth.uid, profile.value)
      }
      careSessions.value = await db.fetchSessionsByDateRange(auth.uid, careStartedDate, localDateStr())
    } catch (error) {
      console.error('[StudyFlow] Erro ao carregar mascote:', error)
    } finally {
      loading.value = false
    }
  }

  async function rename(value: string) {
    if (!auth.uid) return
    const trimmed = value.trim().slice(0, 20)
    if (!trimmed) return
    const now = Date.now()
    const next: PetProfile = {
      petId: 'lumi',
      name: trimmed,
      careStartedDate: profile.value?.careStartedDate ?? localDateStr(),
      createdAt: profile.value?.createdAt ?? now,
      updatedAt: now,
    }
    profile.value = next
    await db.savePetProfile(auth.uid, next)
  }

  return {
    profile, loading, name, bondPoints, level, levelProgress, todaySeconds, todayCareSeconds, todayCareBreakdown,
    dailyGoalSeconds: PET_DAILY_GOAL_SECONDS, maxHearts: PET_MAX_HEARTS,
    todayGoalMet, careProgress, missedDays, hearts, isAway, streak, streakAtRisk, careSummary,
    mood, moodLabel, message, load, rename,
  }
})
