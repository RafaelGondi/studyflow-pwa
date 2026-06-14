import type { StudySession } from '@/types'
import { formatDuration } from '@/types'

export interface DayStats {
  totalSeconds: number
  maxFocusSeconds: number
  startTime: number | null
  endTime: number | null
  sessionCount: number
}

export type TimelineEntry =
  | { type: 'session'; session: StudySession }
  | { type: 'gap'; startTime: number; endTime: number; duration: number }

/** Heat levels inspired by YPT, scaled for typical study sessions (hours). */
const HEAT_THRESHOLDS = [0, 3600, 7200, 14400, 21600] // 0, 1h, 2h, 4h, 6h

export function getHeatLevel(seconds: number): number {
  for (let i = HEAT_THRESHOLDS.length - 1; i >= 0; i--) {
    if (seconds >= HEAT_THRESHOLDS[i]) return i
  }
  return 0
}

export function heatLevelLabel(level: number): string {
  const labels = ['0+', '1h+', '2h+', '4h+', '6h+']
  return labels[level] ?? '0+'
}

export function getDayStats(sessions: StudySession[]): DayStats {
  if (sessions.length === 0) {
    return { totalSeconds: 0, maxFocusSeconds: 0, startTime: null, endTime: null, sessionCount: 0 }
  }
  const sorted = [...sessions].sort((a, b) => a.startTime - b.startTime)
  return {
    totalSeconds: sessions.reduce((a, s) => a + s.duration, 0),
    maxFocusSeconds: Math.max(...sessions.map(s => s.duration)),
    startTime: sorted[0].startTime,
    endTime: sorted[sorted.length - 1].endTime,
    sessionCount: sessions.length,
  }
}

export function buildStatsTimeline(sessions: StudySession[]): TimelineEntry[] {
  const sorted = [...sessions].sort((a, b) => a.startTime - b.startTime)
  const result: TimelineEntry[] = []

  for (let i = 0; i < sorted.length; i++) {
    const session = sorted[i]
    if (i > 0) {
      const prev = sorted[i - 1]
      const gapMs = session.startTime - prev.endTime
      if (gapMs > 60_000) {
        result.push({
          type: 'gap',
          startTime: prev.endTime,
          endTime: session.startTime,
          duration: Math.floor(gapMs / 1000),
        })
      }
    }
    result.push({ type: 'session', session })
  }

  return result
}

export function formatClockTime(ts: number, withSeconds = false): string {
  const d = new Date(ts)
  const h = d.getHours()
  const m = d.getMinutes()
  const s = d.getSeconds()
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  if (withSeconds) {
    return `${period} ${h12}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${period} ${h12}:${String(m).padStart(2, '0')}`
}

export function formatStudyClock(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function formatShortDayTotal(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}H ${String(m).padStart(2, '0')}M`
  return `${m}M`
}

export function aggregateByDate(sessions: StudySession[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const s of sessions) {
    map.set(s.date, (map.get(s.date) ?? 0) + s.duration)
  }
  return map
}

/** Cumulative study seconds at each session end time for line chart. */
export function getCumulativeChartPoints(sessions: StudySession[]): { label: string; value: number; ts: number }[] {
  const sorted = [...sessions].sort((a, b) => a.startTime - b.startTime)
  let cumulative = 0
  const points: { label: string; value: number; ts: number }[] = []

  if (sorted.length === 0) return points

  points.push({ label: formatClockTime(sorted[0].startTime), value: 0, ts: sorted[0].startTime })

  for (const s of sorted) {
    cumulative += s.duration
    points.push({
      label: formatClockTime(s.endTime),
      value: cumulative,
      ts: s.endTime,
    })
  }

  return points
}

/** 144 slots (24h × 6 blocks of 10 min). Returns active slot indices. */
export function getActivitySlots(sessions: StudySession[]): Set<number> {
  const active = new Set<number>()
  for (const s of sessions) {
    const start = new Date(s.startTime)
    const end = new Date(s.endTime)
    let cursor = new Date(start)
    cursor.setSeconds(0, 0)
    cursor.setMinutes(Math.floor(cursor.getMinutes() / 10) * 10)

    while (cursor.getTime() < end.getTime()) {
      const hour = cursor.getHours()
      const slot = Math.floor(cursor.getMinutes() / 10)
      active.add(hour * 6 + slot)
      cursor = new Date(cursor.getTime() + 10 * 60_000)
    }
  }
  return active
}

export function monthLabel(year: number, month: number): string {
  const d = new Date(year, month, 1)
  return d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
}

export function dayHeaderLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function gapLabel(start: number, end: number): string {
  return `${formatClockTime(start)} ~ ${formatClockTime(end)} ${formatDuration(Math.floor((end - start) / 1000))}`
}
