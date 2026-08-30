import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from './auth'
import { useGamificationStore } from './gamification'
import { useSessionsStore } from './sessions'
import { useSubjectsStore } from './subjects'
import { useTimerStore } from './timer'
import * as db from '@/firebase/db'
import { formatDuration, isStudySession, localDateStr } from '@/types'
import type { PetCelebration, PetId, PetMemorial, PetMood, PetProfile, StudySession } from '@/types'
import { ACTIVITIES, DEFAULT_ACTIVITY, activityMultiplier } from '@/utils/coins'

export const PET_DAILY_GOAL_SECONDS = 60 * 60
export const PET_MAX_HEARTS = 5
export const BOND_DAILY_GOAL_BONUS_SECONDS = 10 * 60
export const PET_DEPARTURE_DAYS = 8
export const PET_EGG_COST = 300

export const PET_OPTIONS: ReadonlyArray<{ id: PetId; name: string; description: string }> = [
  { id: 'lumi', name: 'Lumi', description: 'Espírito de foco curioso e brilhante.' },
  { id: 'caju', name: 'Caju', description: 'Panda-vermelho calmo e companheiro.' },
]

function defaultPetName(petId: PetId) {
  return PET_OPTIONS.find(option => option.id === petId)?.name ?? 'Lumi'
}

export interface PetMemory {
  id: string
  icon: string
  title: string
  text: string
  subjectName?: string
}

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
  bored: { label: 'Entediada', message: 'O dia está passando devagar… será que cabe um foco curtinho?' },
  hungry: { label: 'Com fome', message: 'Senti sua falta ontem. Um pouco de foco hoje vai me fazer bem.' },
  nostalgic: { label: 'Com saudade', message: 'Estive lembrando dos nossos momentos de foco. Ainda dá tempo de voltarmos ao ritmo.' },
  curious: { label: 'Curiosa', message: 'Eu vi você começar. Vamos só mais um pouquinho?' },
  focused: { label: 'Concentrada', message: 'Estou aqui com você. Uma coisa de cada vez.' },
  happy: { label: 'Animada', message: 'Seu ritmo de hoje já deixou minha estrela brilhando!' },
  excited: { label: 'Empolgada', message: 'Nossa sequência está ganhando força! Quero ver até onde vamos juntos.' },
  tired: { label: 'Cansada', message: 'Foi um foco bem longo. Que tal respirar, beber água e descansar um pouco?' },
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

  const petId = computed<PetId>(() => profile.value?.petId ?? 'lumi')
  const name = computed(() => profile.value?.name || defaultPetName(petId.value))
  const lifecycleState = computed(() => profile.value?.lifecycleState ?? 'active')
  const isDeparted = computed(() => lifecycleState.value === 'departed')
  const hasEgg = computed(() => lifecycleState.value === 'egg')
  const isActive = computed(() => lifecycleState.value === 'active')
  const generation = computed(() => profile.value?.generation ?? 1)
  const memorials = computed(() => profile.value?.memorials ?? [])
  const celebrations = computed(() => profile.value?.celebrations ?? [])
  const generationSessions = computed(() => {
    if (!isActive.value) return []
    const bornAt = profile.value?.createdAt ?? 0
    const today = localDateStr()
    return [
      ...careSessions.value.filter(session => session.date !== today),
      ...sessions.todayStudySessions,
    ]
      .filter(session => isStudySession(session) && session.endTime >= bornAt)
      .sort((a, b) => a.endTime - b.endTime)
  })
  const lastCompletedSession = computed(() => {
    const list = generationSessions.value
    return list[list.length - 1] ?? null
  })
  const favoriteSubject = computed(() => {
    const totals = new Map<string, { seconds: number; sessions: number }>()
    for (const session of generationSessions.value) {
      if (!session.subjectId) continue
      const current = totals.get(session.subjectId) ?? { seconds: 0, sessions: 0 }
      current.seconds += session.duration
      current.sessions += 1
      totals.set(session.subjectId, current)
    }
    const favorite = [...totals.entries()].sort((a, b) => b[1].seconds - a[1].seconds)[0]
    if (!favorite || favorite[1].sessions < 2) return null
    return { subject: subjects.getSubject(favorite[0]), ...favorite[1] }
  })
  const favoriteActivity = computed(() => {
    const totals = new Map<string, number>()
    for (const session of generationSessions.value) {
      const kind = session.activityKind ?? DEFAULT_ACTIVITY
      totals.set(kind, (totals.get(kind) ?? 0) + session.duration)
    }
    const favorite = [...totals.entries()].sort((a, b) => b[1] - a[1])[0]
    if (!favorite || favorite[1] < 3600) return null
    const activity = ACTIVITIES.find(item => item.id === favorite[0])
    return activity ? { ...activity, seconds: favorite[1] } : null
  })
  const favoritePeriod = computed(() => {
    const periods = [
      { id: 'morning', label: 'pela manhã', icon: '☀️', sessions: 0 },
      { id: 'afternoon', label: 'durante a tarde', icon: '🌤️', sessions: 0 },
      { id: 'night', label: 'à noite', icon: '🌙', sessions: 0 },
    ]
    for (const session of generationSessions.value) {
      const hour = new Date(session.startTime).getHours()
      const index = hour < 12 ? 0 : hour < 18 ? 1 : 2
      periods[index].sessions += 1
    }
    const favorite = periods.sort((a, b) => b.sessions - a.sessions)[0]
    return favorite.sessions >= 3 ? favorite : null
  })
  const longestSession = computed(() => generationSessions.value
    .reduce<StudySession | null>((longest, session) =>
      !longest || session.duration > longest.duration ? session : longest, null))
  const isLatestSessionRecord = computed(() => {
    const latest = lastCompletedSession.value
    if (!latest || latest.duration < 30 * 60) return false
    return generationSessions.value
      .filter(session => session.id !== latest.id)
      .every(session => session.duration < latest.duration)
  })
  const lastReturnGapDays = computed(() => {
    const list = generationSessions.value
    if (list.length < 2) return 0
    const latest = list[list.length - 1]
    const previous = [...list].reverse().find(session => session.date !== latest.date)
    if (!previous) return 0
    return Math.max(0, Math.floor((parseDate(latest.date).getTime() - parseDate(previous.date).getTime()) / 86400000))
  })
  const memories = computed<PetMemory[]>(() => {
    const result: PetMemory[] = []
    if (lastReturnGapDays.value >= 3) result.push({
      id: 'comeback', icon: '🌱', title: 'Você sempre pode voltar',
      text: `Depois de ${lastReturnGapDays.value} dias, você voltou e focamos juntos de novo.`,
    })
    if (favoriteSubject.value?.subject) result.push({
      id: 'subject', icon: favoriteSubject.value.subject.icon || '📚',
      subjectName: favoriteSubject.value.subject.name,
      title: `${favoriteSubject.value.subject.name} faz parte da nossa história`,
      text: `Já passamos ${formatDuration(favoriteSubject.value.seconds)} juntos nessa matéria.`,
    })
    if (favoritePeriod.value) result.push({
      id: 'period', icon: favoritePeriod.value.icon, title: `Nosso horário é ${favoritePeriod.value.label}`,
      text: `${favoritePeriod.value.sessions} das nossas sessões começaram nesse período.`,
    })
    if (favoriteActivity.value) result.push({
      id: 'activity', icon: favoriteActivity.value.id === 'leitura' ? '📖' : favoriteActivity.value.id === 'trabalho' ? '💼' : '✦',
      title: `${favoriteActivity.value.label} é o que mais fazemos`,
      text: `${formatDuration(favoriteActivity.value.seconds)} do nosso tempo real foi dedicado a isso.`,
    })
    if (longestSession.value && longestSession.value.duration >= 15 * 60) {
      const subject = longestSession.value.subjectId ? subjects.getSubject(longestSession.value.subjectId) : null
      result.push({
        id: 'record', icon: '🏅', title: 'Nossa maior aventura de foco',
        text: `${formatDuration(longestSession.value.duration)}${subject ? ` com ${subject.name}` : ''}. Eu ainda lembro desse dia.`,
      })
    }
    if (!result.length) result.push({
      id: 'beginning', icon: '✨', title: 'Nossa história está começando',
      text: 'Conforme focarmos juntos, vou lembrar dos nossos horários, matérias e momentos especiais.',
    })
    return result.slice(0, 4)
  })
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

  const isDailyRecord = computed(() => {
    if (todaySeconds.value < 30 * 60) return false
    const today = localDateStr()
    const pastTotals = new Map<string, number>()
    for (const session of generationSessions.value) {
      if (session.date === today) continue
      pastTotals.set(session.date, (pastTotals.get(session.date) ?? 0) + session.duration)
    }
    const previousRecord = Math.max(0, ...pastTotals.values())
    return previousRecord > 0 && todaySeconds.value > previousRecord
  })

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
    if (timer.activeSubjectId && !timer.isInBreak) {
      return timer.studyElapsedSeconds >= 90 * 60 ? 'tired' : 'focused'
    }
    const latest = lastCompletedSession.value
    if (latest && latest.duration >= 90 * 60 && Date.now() - latest.endTime < 30 * 60 * 1000) return 'tired'
    if (isDailyRecord.value || todayGoalMet.value) return 'proud'
    if (streak.value >= 3 && todaySeconds.value > 0) return 'excited'
    if (todaySeconds.value >= 1500) return 'happy'
    if (todaySeconds.value > 0) return 'curious'
    if (missedDays.value >= 2) return 'nostalgic'
    if (missedDays.value > 0) return 'hungry'
    const hour = new Date().getHours()
    return hour >= 16 && hour < 22 ? 'bored' : 'sleepy'
  })
  const moodLabel = computed(() => moodMeta[mood.value].label)
  const message = computed(() => {
    if (!isActive.value || isAway.value || missedDays.value > 0 || mood.value === 'tired') return moodMeta[mood.value].message
    if (timer.activeSubjectId && !timer.isInBreak) {
      const subject = subjects.getSubject(timer.activeSubjectId)
      return `Estou aqui com você${subject ? ` em ${subject.name}` : ''}. Vamos no nosso ritmo.`
    }
    const latest = lastCompletedSession.value
    if (latest && Date.now() - latest.endTime < 2 * 3600 * 1000) {
      const subject = latest.subjectId ? subjects.getSubject(latest.subjectId) : null
      return `Ainda estou pensando nos ${formatDuration(latest.duration)} que passamos${subject ? ` com ${subject.name}` : ' em foco'}.`
    }
    if (isDailyRecord.value) return 'Hoje já é nosso melhor dia de foco desta geração. Estou muito orgulhosa!'
    if (todayGoalMet.value) return moodMeta.proud.message
    if (mood.value === 'excited') return moodMeta.excited.message
    if (!todaySeconds.value && favoritePeriod.value) {
      const hour = new Date().getHours()
      const currentPeriod = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'night'
      if (favoritePeriod.value.id === currentPeriod) return `Chegou nosso horário favorito. Geralmente focamos ${favoritePeriod.value.label}.`
    }
    return moodMeta[mood.value].message
  })
  const reactionMessages = computed(() => {
    const reactions = [
      'Hehe! Isso faz cócegas.',
      'Eu gosto quando você vem me ver.',
    ]
    if (mood.value === 'tired') reactions.push('O carinho ajuda, mas uma pausinha e água ajudariam ainda mais.')
    if (isDailyRecord.value) reactions.push('Você percebeu? Hoje já é nosso melhor dia desta geração!')
    else if (mood.value === 'excited') reactions.push('Nossa sequência está me deixando cheia de energia!')
    if (favoriteSubject.value?.subject) reactions.push(`Será que hoje vamos passar um tempo com ${favoriteSubject.value.subject.name}?`)
    if (favoritePeriod.value) reactions.push(`Já percebi que nosso foco costuma render ${favoritePeriod.value.label}.`)
    if (lastReturnGapDays.value >= 3) reactions.push('Mesmo depois de uma pausa, eu fico feliz quando você volta.')
    if (streak.value >= 2) reactions.push(`Nossa sequência de ${streak.value} dias está ficando bonita!`)
    return reactions
  })

  const celebrationCandidates = computed<PetCelebration[]>(() => {
    if (!isActive.value || !profile.value) return []
    const bornAt = profile.value.createdAt
    const now = Date.now()
    const togetherDays = Math.max(0, Math.floor((now - bornAt) / 86400000))
    const result: PetCelebration[] = []
    const add = (event: Omit<PetCelebration, 'generation'>) => result.push({ ...event, generation: generation.value })
    for (const days of [7, 30, 100, 365]) {
      if (togetherDays < days) continue
      add({
        id: `g${generation.value}-together-${days}`,
        kind: 'together', icon: days >= 365 ? '🎂' : '💫',
        title: days === 7 ? 'Uma semana juntos' : `${days} dias juntos`,
        message: `${name.value} está com você há ${days} dias. Essa história já ganhou um capítulo especial.`,
        unlockedAt: now,
      })
    }
    for (const hours of [10, 50, 100, 250, 500]) {
      if (bondSeconds.value < hours * 3600) continue
      add({
        id: `g${generation.value}-bond-${hours}`,
        kind: 'bond', icon: '✨', title: `${hours}h de vínculo`,
        message: `Vocês já construíram o equivalente a ${hours} horas de foco juntos.`,
        unlockedAt: now,
      })
    }
    if (streak.value >= 7) {
      const streakStart = new Date()
      streakStart.setDate(streakStart.getDate() - streak.value + 1)
      add({
      id: `g${generation.value}-perfect-week-${localDateStr(streakStart)}`,
      kind: 'perfect-week', icon: '🔥', title: 'Semana perfeita',
      message: 'Sete dias seguidos cuidando da Lumi e da sua própria constância.',
      unlockedAt: now,
      })
    }
    const latest = lastCompletedSession.value
    if (latest && isLatestSessionRecord.value) add({
      id: `g${generation.value}-record-${latest.id}`,
      kind: 'record', icon: '🏆', title: 'Novo recorde de sessão',
      message: `${formatDuration(latest.duration)} em uma única sessão. É a maior desta geração até agora.`,
      unlockedAt: latest.endTime,
    })
    if (latest && lastReturnGapDays.value >= 3) add({
      id: `g${generation.value}-comeback-${latest.date}`,
      kind: 'comeback', icon: '🌱', title: 'O retorno também conta',
      message: `Depois de ${lastReturnGapDays.value} dias, vocês encontraram o caminho de volta ao foco.`,
      unlockedAt: latest.endTime,
    })
    return result
  })
  const unseenCelebrations = computed(() => {
    const seenAt = profile.value?.lastCelebrationSeenAt ?? 0
    return celebrations.value.filter(event => event.unlockedAt > seenAt)
  })
  let syncingCelebrations = false

  async function syncCelebrations() {
    if (!auth.uid || !profile.value || syncingCelebrations || !isActive.value) return
    const known = new Set(celebrations.value.map(event => event.id))
    const discovered = celebrationCandidates.value.filter(event => !known.has(event.id))
    if (!discovered.length) return
    syncingCelebrations = true
    try {
      const next: PetProfile = {
        ...profile.value,
        celebrations: [...celebrations.value, ...discovered].sort((a, b) => a.unlockedAt - b.unlockedAt),
        updatedAt: Date.now(),
      }
      await db.savePetProfile(auth.uid, next)
      profile.value = next
    } finally {
      syncingCelebrations = false
    }
  }

  async function markCelebrationsSeen() {
    if (!auth.uid || !profile.value || !unseenCelebrations.value.length) return
    const next: PetProfile = {
      ...profile.value,
      lastCelebrationSeenAt: Math.max(...celebrations.value.map(event => event.unlockedAt), Date.now()),
      updatedAt: Date.now(),
    }
    await db.savePetProfile(auth.uid, next)
    profile.value = next
  }

  function createMemorial(now: number): PetMemorial {
    return {
      id: `${generation.value}-${now}`,
      petId: petId.value,
      name: name.value,
      generation: generation.value,
      bornAt: profile.value?.createdAt ?? now,
      departedAt: now,
      maxBondLevel: level.value,
      bondSeconds: bondSeconds.value,
      celebrationCount: celebrations.value.length,
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
      const savedPetId: PetId = saved?.petId === 'caju' ? 'caju' : 'lumi'
      const petNames = saved?.petNames ?? { [savedPetId]: saved?.name ?? defaultPetName(savedPetId) }
      profile.value = saved ?? {
        petId: 'lumi', name: 'Lumi', petNames: { lumi: 'Lumi' }, careStartedDate, careStartedAt, bondStartedAt,
        lifecycleState: 'active', generation: 1, memorials: [], celebrations: [], createdAt: now, updatedAt: now,
      }
      if (!saved?.careStartedDate || !saved?.careStartedAt || !saved?.bondStartedAt || !saved?.lifecycleState || !saved?.generation || !saved?.petNames) {
        profile.value = {
          ...profile.value,
          petId: savedPetId,
          name: saved?.name ?? defaultPetName(savedPetId),
          petNames,
          careStartedDate,
          careStartedAt,
          bondStartedAt,
          lifecycleState: saved?.lifecycleState ?? 'active',
          generation: saved?.generation ?? 1,
          memorials: saved?.memorials ?? [],
          celebrations: saved?.celebrations ?? [],
          updatedAt: now,
        }
        await db.savePetProfile(auth.uid, profile.value)
      }
      careSessions.value = await db.fetchSessionsByDateRange(auth.uid, careStartedDate, localDateStr())
      if (isActive.value && missedDays.value >= PET_DEPARTURE_DAYS) await markDeparted()
      else await syncCelebrations()
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
      petNames: { ...(profile.value?.petNames ?? {}), [petId.value]: trimmed },
      careStartedDate: profile.value?.careStartedDate ?? localDateStr(),
      bondStartedAt: profile.value?.bondStartedAt ?? now,
      updatedAt: now,
    }
    profile.value = next
    await db.savePetProfile(auth.uid, next)
  }

  async function choosePet(nextPetId: PetId) {
    if (!auth.uid || !profile.value || !isActive.value || nextPetId === petId.value) return
    const now = Date.now()
    const names = { ...(profile.value.petNames ?? {}), [petId.value]: name.value }
    const nextName = names[nextPetId] ?? defaultPetName(nextPetId)
    const next: PetProfile = {
      ...profile.value,
      petId: nextPetId,
      name: nextName,
      petNames: { ...names, [nextPetId]: nextName },
      updatedAt: now,
    }
    await db.savePetProfile(auth.uid, next)
    profile.value = next
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
      name: profile.value.petNames?.[petId.value] ?? defaultPetName(petId.value),
      lifecycleState: 'active',
      generation: generation.value + 1,
      careStartedDate: localDateStr(),
      careStartedAt: now,
      bondStartedAt: now,
      departedAt: null,
      eggPurchasedAt: null,
      createdAt: now,
      celebrations: [],
      lastCelebrationSeenAt: 0,
      updatedAt: now,
    }
    await db.savePetProfile(auth.uid, next)
    profile.value = next
    careSessions.value = []
  }

  watch(
    () => celebrationCandidates.value.map(event => event.id).join('|'),
    () => { void syncCelebrations() },
  )

  return {
    profile, loading, petId, name, lifecycleState, isActive, isDeparted, hasEgg, generation, memorials,
    celebrations, unseenCelebrations,
    memories, reactionMessages, lastCompletedSession, isDailyRecord,
    bondSeconds, bondBonusDays: computed(() => bondProgress.value.bonusDays),
    level, levelProgress, bondLevelSeconds, bondLevelTargetSeconds,
    bondRemainingSeconds, nextBondReward, todaySeconds, todayCareSeconds, todayCareBreakdown,
    dailyGoalSeconds: PET_DAILY_GOAL_SECONDS, maxHearts: PET_MAX_HEARTS,
    todayGoalMet, careProgress, missedDays, hearts, isAway, rescueDaysRemaining, streak, streakAtRisk, careSummary,
    mood, moodLabel, message, load, rename, choosePet, purchaseEgg, hatchEgg, markCelebrationsSeen,
    eggCost: PET_EGG_COST, departureDays: PET_DEPARTURE_DAYS,
  }
})
