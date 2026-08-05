export interface Category {
  id: string
  name: string
  color: string
  userId: string
  createdAt: number
  order?: number
  earnsCoins?: boolean
}

/**
 * O que uma matéria é. Define o metal que ela rende e o peso da hora:
 * estudo vale 1x, leitura 1/4 e trabalho 1/10 — a mesma escada de
 * 1 ouro = 4 prata = 10 cobre. Ausente = estudo (retrocompatível).
 */
export type ActivityKind = 'estudo' | 'leitura' | 'trabalho'

export interface Subject {
  id: string
  name: string
  color: string
  icon: string
  categoryId: string | null
  userId: string
  createdAt: number
  earnsCoins?: boolean | null
  activityKind?: ActivityKind
  archivedAt?: number | null
}

export interface StudySegment {
  start: number
  end: number
}

export type SessionKind = 'study' | 'break'

export interface StudySession {
  id: string
  subjectId?: string
  startTime: number
  endTime: number
  duration: number // seconds
  date: string    // YYYY-MM-DD
  userId: string
  segments?: StudySegment[]
  coinsEarned?: number
  coinRatePerHour?: number
  kind?: SessionKind // ausente = estudo (retrocompatível)
  coinsEligible?: boolean
  /* Congelados no momento em que a sessão foi salva, como coinRatePerHour:
     mudar o tipo de uma matéria não deve reescrever o que já foi ganho. */
  activityKind?: ActivityKind
  coinMultiplier?: number
}

export interface GamificationSettings {
  coinsPerHour: number
  updatedAt: number
}

export interface Reward {
  id: string
  name: string
  description?: string
  cost: number
  icon: string
  color: string
  repeatable: boolean
  archivedAt?: number | null
  userId: string
  createdAt: number
  updatedAt: number
}

export interface RewardRedemption {
  id: string
  rewardId: string
  rewardName: string
  rewardIcon: string
  cost: number
  userId: string
  createdAt: number
  undoneAt?: number | null
}


export function isStudySession(s: StudySession): boolean {
  return s.kind !== 'break'
}

export function isBreakSession(s: StudySession): boolean {
  return s.kind === 'break'
}

export interface ActiveTimer {
  subjectId: string
  startedAt: number
  isPaused: boolean
  pausedAt: number | null
  accumulatedMs: number
}

/** Paleta de matérias alinhada aos tokens --cat-* do Akoma */
export { AKOMA_CAT_COLORS, SUBJECT_COLORS, DEFAULT_SUBJECT_COLOR } from '@/utils/colors'

export const INITIAL_ICON = '__initial__'

export const SUBJECT_ICONS = [
  '📚', '🔬', '🧮', '🌍', '💻', '🎨', '🎵', '⚽', '🏛️', '🧬',
  '📝', '🔭', '🧪', '📐', '🗣️', '📖', '🏋️', '🧠', '✏️', '🎯',
]

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`
  if (m > 0) return `${m}m ${s.toString().padStart(2, '0')}s`
  return `${s}s`
}

export function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function localDateStr(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayDateString(): string {
  return localDateStr()
}
