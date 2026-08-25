import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from './auth'
import { useGamificationStore } from './gamification'
import { useSessionsStore } from './sessions'
import { useSubjectsStore } from './subjects'
import { useTimerStore } from './timer'
import * as db from '@/firebase/db'
import { isStudySession, localDateStr } from '@/types'
import type { PetMemorial, PetMood, PetProfile, StudySession } from '@/types'
import { ACTIVITIES, DEFAULT_ACTIVITY, activityMultiplier } from '@/utils/coins'

export const PET_DAILY_GOAL_SECONDS = 60 * 60
export const PET_MAX_HEARTS = 5
export const BOND_DAILY_GOAL_BONUS_SECONDS = 10 * 60
export const PET_DEPARTURE_DAYS = 8
export const PET_EGG_COST = 300

export const BOND_LEVELS = [
  { level: 0, seconds: 0, reward: 'Companheira recém-chegada' },
  { level: 1, seconds: 2 * 3600, reward: 'Nova animação: alongamento' },
  { level: 2, seconds: 5 * 3600, reward: 'Nova animação: pulinhos' },
  { level: 3, seconds: 12 * 3600, reward: 'Nova animação: celebração' },
  { level: 4, seconds: 25 * 3600, reward: 'Brilho especial de vínculo' },
  { level: 5, seconds: 50 * 3600, reward: 'Cenário: noite estrelada' },
  { level: 6, seconds: 90 * 3600, reward: 'Animação rara da Lumi' },
  { level: 7, seconds: 150 * 3600, reward: 'Aura estelar' },
  { level: 8, seconds: 240 * 3600, reward: 'Cenário: aurora' },
  { level: 9, seconds: 365 * 3600, reward: 'Cenário: constelação' },
  { level: 10, seconds: 500 * 3600, reward: 'Evolução visual da Lumi' },
] as const

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

function eligibleSessionSeconds(session: StudySession, startedAt?: number) {
  if (!startedAt || session.startTime >= startedAt) return session.duration
  if (session.endTime < startedAt) return 0
  return Math.min(session.duration, Math.max(0, (session.endTime - startedAt) / 1000))
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
  const lifecycleState = computed(() => profile.value?.lifecycleState ?? 'active')
  const isDeparted = computed(() => lifecycleState.value === 'departed')
  const hasEgg = computed(() => lifecycleState.value === 'egg')
  const isActive = computed(() => lifecycleState.value === 'active')
  const generation = computed(() => profile.value?.generation ?? 1)
  const memorials = computed(() => profile.value?.memorials ?? [])
  const bondProgress = computed(() => {
    const startedAt = profile.value?.bondStartedAt
    if (!startedAt || !isActive.value) return { focusSeconds: 0, bonusDays: 0, totalSeconds: 0 }
    const today = localDateStr()
    const dailyBondTotals = new Map<string, number>()
    let focusSeconds = 0
    for (const session of [
      ...careSessions.value.filter(session => session.date !== today),
      ...sessions.todayStudySessions,
    ]) {
      if (!isStudySession(session) || session.endTime < startedAt) continue
      const eligibleSeconds = eligibleSessionSeconds(session, startedAt)
      const equivalent = eligibleSeconds * sessionCareMultiplier(session)
      focusSeconds += equivalent
      dailyBondTotals.set(session.date, (dailyBondTotals.get(session.date) ?? 0) + equivalent)
    }
    if (timer.activeSubjectId && !timer.isInBreak) {
      const eligibleLiveSeconds = Math.min(
        timer.studyElapsedSeconds,
        Math.max(0, (Date.now() - startedAt) / 1000),
      )
      const liveEquivalent = eligibleLiveSeconds * subjects.subjectCoinMultiplier(timer.activeSubjectId)
      focusSeconds += liveEquivalent
      dailyBondTotals.set(today, (dailyBondTotals.get(today) ?? 0) + liveEquivalent)
    }
    const bonusDays = [...dailyBondTotals.values()].filter(total => total >= PET_DAILY_GOAL_SECONDS).length
    return {
      focusSeconds,
      bonusDays,
      totalSeconds: focusSeconds + bonusDays * BOND_DAILY_GOAL_BONUS_SECONDS,
    }
  })
  const bondSeconds = computed(() => bondProgress.value.totalSeconds)
  const currentBondLevel = computed(() => [...BOND_LEVELS]
    .reverse()
    .find(milestone => bondSeconds.value >= milestone.seconds) ?? BOND_LEVELS[0])
  const level = computed(() => currentBondLevel.value.level)
  const nextBondReward = computed(() => BOND_LEVELS.find(milestone => milestone.level === level.value + 1) ?? null)
  const bondLevelStartSeconds = computed(() => currentBondLevel.value.seconds)
  const bondLevelEndSeconds = computed(() => nextBondReward.value?.seconds ?? currentBondLevel.value.seconds)
  const bondLevelSeconds = computed(() => Math.max(0, bondSeconds.value - bondLevelStartSeconds.value))
  const bondLevelTargetSeconds = computed(() => Math.max(0, bondLevelEndSeconds.value - bondLevelStartSeconds.value))
  const levelProgress = computed(() => nextBondReward.value && bondLevelTargetSeconds.value
    ? Math.min(100, bondLevelSeconds.value / bondLevelTargetSeconds.value * 100)
    : 100)
  const bondRemainingSeconds = computed(() => Math.max(0, bondLevelEndSeconds.value - bondSeconds.value))
  const todaySeconds = computed(() => sessions.todayStudyTotalSeconds + timer.studyElapsedSeconds)
  const liveCareSeconds = computed(() => {
    if (!timer.activeSubjectId || timer.isInBreak) return 0
    return timer.studyElapsedSeconds * subjects.subjectCoinMultiplier(timer.activeSubjectId)
  })
  const todayCareSeconds = computed(() =>
    sessions.todayStudySessions.reduce((total, session) =>
      total + eligibleSessionSeconds(session, profile.value?.careStartedAt) * sessionCareMultiplier(session), 0) + liveCareSeconds.value,
  )
  const todayCareBreakdown = computed(() => ACTIVITIES.map(activity => {
    let actualSeconds = sessions.todayStudySessions.reduce((total, session) =>
      (session.activityKind ?? DEFAULT_ACTIVITY) === activity.id
        ? total + eligibleSessionSeconds(session, profile.value?.careStartedAt)
        : total, 0)
    let equivalentSeconds = sessions.todayStudySessions.reduce((total, session) =>
      (session.activityKind ?? DEFAULT_ACTIVITY) === activity.id
        ? total + eligibleSessionSeconds(session, profile.value?.careStartedAt) * sessionCareMultiplier(session)
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
    if (!profile.value?.careStartedDate || !isActive.value) return 0
    let cursor = previousDate(localDateStr())
    let missed = 0
    while (cursor >= profile.value.careStartedDate) {
      if ((dailyTotals.value.get(cursor) ?? 0) >= PET_DAILY_GOAL_SECONDS) break
      missed += 1
      cursor = previousDate(cursor)
    }
    return missed
  })
  const hearts = computed(() => !isActive.value
    ? 0
    : todayGoalMet.value
    ? PET_MAX_HEARTS
    : Math.max(0, PET_MAX_HEARTS - missedDays.value))
  const isAway = computed(() => isActive.value && hearts.value === 0)
  const rescueDaysRemaining = computed(() => isAway.value
    ? Math.max(0, PET_DEPARTURE_DAYS - missedDays.value)
    : 0)

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
    if (isDeparted.value) return 'Virou estrela · um novo ovo está disponível'
    if (hasEgg.value) return 'O novo ovo está esperando para eclodir'
    if (isAway.value) return 'Complete 1h hoje para trazê-la de volta'
    if (todayGoalMet.value) return `${streak.value} ${streak.value === 1 ? 'dia' : 'dias'} de sequência · bem alimentada`
    if (missedDays.value > 0) return `${hearts.value}/${PET_MAX_HEARTS} corações · sequência em risco`
    return `Meta diária: ${Math.floor(todayCareSeconds.value / 60)}/60 min equivalentes`
  })
  const mood = computed<PetMood>(() => {
    if (isAway.value || isDeparted.value || hasEgg.value) return 'away'
    if (todaySeconds.value >= 3600) return 'proud'
    if (todaySeconds.value >= 1500) return 'happy'
    if (todaySeconds.value > 0) return 'curious'
    if (missedDays.value > 0) return 'hungry'
    return 'sleepy'
  })
  const moodLabel = computed(() => moodMeta[mood.value].label)
  const message = computed(() => moodMeta[mood.value].message)

  function createMemorial(now: number): PetMemorial {
    return {
      id: `${generation.value}-${now}`,
      petId: 'lumi',
      name: name.value,
      generation: generation.value,
      bornAt: profile.value?.createdAt ?? now,
      departedAt: now,
      maxBondLevel: level.value,
      bondSeconds: bondSeconds.value,
    }
  }

  async function markDeparted() {
    if (!auth.uid || !profile.value || !isActive.value) return
    const now = Date.now()
    const next: PetProfile = {
      ...profile.value,
      lifecycleState: 'departed',
      departedAt: now,
      memorials: [...memorials.value, createMemorial(now)],
      updatedAt: now,
    }
    await db.savePetProfile(auth.uid, next)
    profile.value = next
  }

  async function load() {
    if (!auth.uid) return
    loading.value = true
    try {
      const saved = await db.fetchPetProfile(auth.uid)
      const now = Date.now()
      const careStartedDate = saved?.careStartedDate ?? localDateStr()
      const careStartedAt = saved?.careStartedAt ?? parseDate(careStartedDate).getTime()
      const bondStartedAt = saved?.bondStartedAt ?? now
      profile.value = saved ?? {
        petId: 'lumi', name: 'Lumi', careStartedDate, careStartedAt, bondStartedAt,
        lifecycleState: 'active', generation: 1, memorials: [], createdAt: now, updatedAt: now,
      }
      if (!saved?.careStartedDate || !saved?.careStartedAt || !saved?.bondStartedAt || !saved?.lifecycleState || !saved?.generation) {
        profile.value = {
          ...profile.value,
          careStartedDate,
          careStartedAt,
          bondStartedAt,
          lifecycleState: saved?.lifecycleState ?? 'active',
          generation: saved?.generation ?? 1,
          memorials: saved?.memorials ?? [],
          updatedAt: now,
        }
        await db.savePetProfile(auth.uid, profile.value)
      }
      careSessions.value = await db.fetchSessionsByDateRange(auth.uid, careStartedDate, localDateStr())
      if (isActive.value && missedDays.value >= PET_DEPARTURE_DAYS) await markDeparted()
    } catch (error) {
      console.error('[StudyFlow] Erro ao carregar mascote:', error)
    } finally {
      loading.value = false
    }
  }

  async function rename(value: string) {
    if (!auth.uid || !isActive.value) return
    const trimmed = value.trim().slice(0, 20)
    if (!trimmed) return
    const now = Date.now()
    const next: PetProfile = {
      ...(profile.value ?? { petId: 'lumi', createdAt: now, updatedAt: now }),
      name: trimmed,
      careStartedDate: profile.value?.careStartedDate ?? localDateStr(),
      bondStartedAt: profile.value?.bondStartedAt ?? now,
      updatedAt: now,
    }
    profile.value = next
    await db.savePetProfile(auth.uid, next)
  }

  async function purchaseEgg() {
    if (!auth.uid || !profile.value || !isDeparted.value) return
    await gamification.refreshWallet()
    if (gamification.balance < PET_EGG_COST) throw new Error('insufficient-balance')
    const now = Date.now()
    const next: PetProfile = {
      ...profile.value,
      lifecycleState: 'egg',
      eggPurchasedAt: now,
      updatedAt: now,
    }
    const redemption = await db.purchasePetEgg(auth.uid, next, PET_EGG_COST)
    gamification.trackRedemption(redemption)
    profile.value = next
  }

  async function hatchEgg() {
    if (!auth.uid || !profile.value || !hasEgg.value) return
    const now = Date.now()
    const next: PetProfile = {
      ...profile.value,
      name: 'Lumi',
      lifecycleState: 'active',
      generation: generation.value + 1,
      careStartedDate: localDateStr(),
      careStartedAt: now,
      bondStartedAt: now,
      departedAt: null,
      eggPurchasedAt: null,
      createdAt: now,
      updatedAt: now,
    }
    await db.savePetProfile(auth.uid, next)
    profile.value = next
    careSessions.value = []
  }

  return {
    profile, loading, name, lifecycleState, isActive, isDeparted, hasEgg, generation, memorials,
    bondSeconds, bondBonusDays: computed(() => bondProgress.value.bonusDays),
    level, levelProgress, bondLevelSeconds, bondLevelTargetSeconds,
    bondRemainingSeconds, nextBondReward, todaySeconds, todayCareSeconds, todayCareBreakdown,
    dailyGoalSeconds: PET_DAILY_GOAL_SECONDS, maxHearts: PET_MAX_HEARTS,
    todayGoalMet, careProgress, missedDays, hearts, isAway, rescueDaysRemaining, streak, streakAtRisk, careSummary,
    mood, moodLabel, message, load, rename, purchaseEgg, hatchEgg,
    eggCost: PET_EGG_COST, departureDays: PET_DEPARTURE_DAYS,
  }
})
