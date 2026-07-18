import { isStudySession, localDateStr } from '@/types'
import type { StudySession } from '@/types'

export type StudyPeriod = 'today' | 'week' | 'month'

export function getPeriodRange(period: StudyPeriod): { from: string; to: string; dayCount: number } {
  const now = new Date()
  const to = localDateStr(now)
  if (period === 'today') {
    return { from: to, to, dayCount: 1 }
  }
  if (period === 'week') {
    const d = new Date(now)
    d.setDate(now.getDate() - 6)
    return { from: localDateStr(d), to, dayCount: 7 }
  }
  const d = new Date(now)
  d.setDate(now.getDate() - 29)
  return { from: localDateStr(d), to, dayCount: 30 }
}

export function enumerateDates(from: string, to: string): string[] {
  const dates: string[] = []
  const cursor = new Date(from + 'T12:00:00')
  const end = new Date(to + 'T12:00:00')
  while (cursor <= end) {
    dates.push(localDateStr(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return dates
}

export function getActiveStudyDays(sessions: StudySession[]): Set<string> {
  const days = new Set<string>()
  for (const session of sessions) {
    if (isStudySession(session)) days.add(session.date)
  }
  return days
}

export function activeDayRate(sessions: StudySession[], dates: string[]): number {
  if (dates.length === 0) return 0
  const active = getActiveStudyDays(sessions)
  const count = dates.filter(date => active.has(date)).length
  return Math.round((count / dates.length) * 100)
}

export function countPerfectStudyDays(
  sessions: StudySession[],
  dates: string[],
  subjectCount: number,
): number {
  if (subjectCount === 0) return 0
  let perfect = 0
  for (const date of dates) {
    const daySubjects = new Set(
      sessions
        .filter(s => isStudySession(s) && s.date === date)
        .map(s => s.subjectId)
        .filter(Boolean),
    )
    if (daySubjects.size >= subjectCount) perfect++
  }
  return perfect
}

export function computeStudyTrend(
  sessions: StudySession[],
  dates: string[],
): { delta: number; hasBaseline: boolean; message: string; label: string } {
  const half = Math.floor(dates.length / 2)
  if (half < 2) {
    return {
      delta: 0,
      hasBaseline: false,
      message: 'Continue registrando para enxergar sua tendência.',
      label: 'Nova jornada',
    }
  }
  const recent = dates.slice(0, half)
  const older = dates.slice(half, half * 2)
  const recentRate = activeDayRate(sessions, recent)
  const olderRate = activeDayRate(sessions, older)
  const delta = recentRate - olderRate

  let message = 'Seu ritmo está estável neste período.'
  if (delta >= 8) message = 'Você ganhou ritmo na parte mais recente deste período.'
  else if (delta <= -8) message = 'Retomar com uma sessão curta já conta.'

  const label = delta === 0 ? 'Estável' : `${delta > 0 ? '+' : ''}${delta} p.p.`

  return { delta, hasBaseline: true, message, label }
}
