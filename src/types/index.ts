export interface Category {
  id: string
  name: string
  color: string
  userId: string
  createdAt: number
}

export interface Subject {
  id: string
  name: string
  color: string
  icon: string
  categoryId: string | null
  userId: string
  createdAt: number
}

export interface StudySegment {
  start: number
  end: number
}

export interface StudySession {
  id: string
  subjectId: string
  startTime: number
  endTime: number
  duration: number // seconds
  date: string    // YYYY-MM-DD
  userId: string
  segments?: StudySegment[]
}

export interface ActiveTimer {
  subjectId: string
  startedAt: number
  isPaused: boolean
  pausedAt: number | null
  accumulatedMs: number
}

export const SUBJECT_COLORS = [
  // Linha 1
  { name: 'red',     value: '#ef4444' },
  { name: 'rose',    value: '#f43f5e' },
  { name: 'pink',    value: '#ec4899' },
  { name: 'fuchsia', value: '#d946ef' },
  { name: 'purple',  value: '#a855f7' },
  { name: 'violet',  value: '#8b5cf6' },
  { name: 'indigo',  value: '#6366f1' },
  { name: 'blue',    value: '#3b82f6' },
  // Linha 2
  { name: 'sky',     value: '#0ea5e9' },
  { name: 'cyan',    value: '#06b6d4' },
  { name: 'teal',    value: '#14b8a6' },
  { name: 'emerald', value: '#10b981' },
  { name: 'lime',    value: '#84cc16' },
  { name: 'amber',   value: '#f59e0b' },
  { name: 'orange',  value: '#f97316' },
  { name: 'stone',   value: '#78716c' },
]

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
