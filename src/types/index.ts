export interface Category {
  id: string
  name: string
  color: string
  userId: string
  createdAt: number
  order?: number
}

export interface Subject {
  id: string
  name: string
  color: string
  icon: string
  categoryId: string | null
  userId: string
  createdAt: number
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
  kind?: SessionKind // ausente = estudo (retrocompatível)
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
