import { isStudySession, localDateStr } from '@/types'
import type { StudySession } from '@/types'

export type StudyPeriod = 'week' | 'month' | 'quarter'

const PERIOD_DAYS: Record<StudyPeriod, number> = {
  week: 7,
  month: 30,
  quarter: 90,
}

export interface PeriodMeta {
  label: string
  /** Título da seção do gráfico — descreve como as barras são agrupadas. */
  chartTitle: string
  meta: string
  /** Nome do período anterior + preposição/artigo, para texto em pt-BR. */
  prevName: string
  prevPrep: string
  prevArticle: string
}

export const PERIOD_META: Record<StudyPeriod, PeriodMeta> = {
  week: {
    label: 'Semana',
    chartTitle: 'Por dia',
    meta: 'Últimos 7 dias',
    prevName: 'semana anterior',
    prevPrep: 'na',
    prevArticle: 'à',
  },
  month: {
    label: 'Mês',
    chartTitle: 'Por semana',
    meta: 'Últimos 30 dias',
    prevName: 'mês anterior',
    prevPrep: 'no',
    prevArticle: 'ao',
  },
  quarter: {
    label: '90 dias',
    chartTitle: 'Por mês',
    meta: 'Últimos 90 dias',
    prevName: 'trimestre anterior',
    prevPrep: 'no',
    prevArticle: 'ao',
  },
}

export const PERIOD_ORDER: StudyPeriod[] = ['week', 'month', 'quarter']

export function getPeriodRange(period: StudyPeriod): { from: string; to: string; dayCount: number } {
  const days = PERIOD_DAYS[period]
  const now = new Date()
  const start = new Date(now)
  start.setDate(now.getDate() - (days - 1))
  return { from: localDateStr(start), to: localDateStr(now), dayCount: days }
}

/**
 * Janela imediatamente anterior, do mesmo tamanho — a base de comparação do
 * herói. Substitui a divisão do período atual em metades, que além de estranha
 * estatisticamente estava com os rótulos invertidos.
 */
export function getPreviousPeriodRange(period: StudyPeriod): { from: string; to: string; dayCount: number } {
  const days = PERIOD_DAYS[period]
  const now = new Date()
  const end = new Date(now)
  end.setDate(now.getDate() - days)
  const start = new Date(end)
  start.setDate(end.getDate() - (days - 1))
  return { from: localDateStr(start), to: localDateStr(end), dayCount: days }
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

export function totalStudySeconds(sessions: StudySession[]): number {
  return sessions.reduce((acc, s) => (isStudySession(s) ? acc + s.duration : acc), 0)
}

export interface PeriodComparison {
  currentSeconds: number
  previousSeconds: number
  deltaSeconds: number
  /** 'flat' quando a variação é menor que 3% — ruído, não tendência. */
  direction: 'up' | 'down' | 'flat'
  hasBaseline: boolean
}

export function comparePeriods(currentSeconds: number, previousSeconds: number): PeriodComparison {
  const deltaSeconds = currentSeconds - previousSeconds
  const hasBaseline = previousSeconds > 0

  let direction: PeriodComparison['direction'] = 'flat'
  if (hasBaseline) {
    const ratio = Math.abs(deltaSeconds) / previousSeconds
    if (ratio >= 0.03) direction = deltaSeconds > 0 ? 'up' : 'down'
  } else if (currentSeconds > 0) {
    direction = 'up'
  }

  return { currentSeconds, previousSeconds, deltaSeconds, direction, hasBaseline }
}

export interface PeriodBucket {
  key: string
  label: string
  seconds: number
  isCurrent: boolean
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function parseDate(date: string): Date {
  return new Date(date + 'T12:00:00')
}

/** Segunda-feira da semana daquela data — chave de agrupamento semanal. */
function weekStart(date: string): string {
  const d = parseDate(date)
  const offset = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - offset)
  return localDateStr(d)
}

/**
 * Agrupa os dias do período em barras legíveis num celular.
 * 30 barras diárias não cabem em 375px — por isso mês agrupa por semana
 * (de calendário, para o título "Por semana" ser verdadeiro) e 90 dias por mês.
 */
export function buildPeriodBuckets(
  period: StudyPeriod,
  dates: string[],
  sessions: StudySession[],
): PeriodBucket[] {
  const secondsByDate = new Map<string, number>()
  for (const s of sessions) {
    if (!isStudySession(s)) continue
    secondsByDate.set(s.date, (secondsByDate.get(s.date) ?? 0) + s.duration)
  }

  const keyOf = (date: string): string => {
    if (period === 'week') return date
    if (period === 'month') return weekStart(date)
    return date.slice(0, 7)
  }

  const labelOf = (key: string): string => {
    if (period === 'week') return WEEKDAYS[parseDate(key).getDay()]
    if (period === 'month') {
      const d = parseDate(key)
      return `${d.getDate()}/${d.getMonth() + 1}`
    }
    return MONTHS[Number(key.slice(5, 7)) - 1]
  }

  const buckets: PeriodBucket[] = []
  const index = new Map<string, PeriodBucket>()

  for (const date of dates) {
    const key = keyOf(date)
    let bucket = index.get(key)
    if (!bucket) {
      bucket = { key, label: labelOf(key), seconds: 0, isCurrent: false }
      index.set(key, bucket)
      buckets.push(bucket)
    }
    bucket.seconds += secondsByDate.get(date) ?? 0
  }

  const last = buckets[buckets.length - 1]
  if (last) {
    last.isCurrent = true
    if (period === 'week') last.label = 'Hoje'
  }

  return buckets
}

export interface SubjectTotal {
  subjectId: string
  seconds: number
}

export function totalsBySubject(sessions: StudySession[]): SubjectTotal[] {
  const map = new Map<string, number>()
  for (const s of sessions) {
    if (!isStudySession(s) || !s.subjectId) continue
    map.set(s.subjectId, (map.get(s.subjectId) ?? 0) + s.duration)
  }
  return [...map.entries()]
    .map(([subjectId, seconds]) => ({ subjectId, seconds }))
    .sort((a, b) => b.seconds - a.seconds)
}
