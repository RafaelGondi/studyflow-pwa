import type { StudySession } from '@/types'
import { formatDuration, isBreakSession, isStudySession } from '@/types'

export type TimelineItem =
  | { type: 'study'; session: StudySession }
  | { type: 'break'; session: StudySession }
  | { type: 'gap'; label: string; ms: number }

function hasBreakBetween(sessions: StudySession[], from: number, to: number) {
  return sessions.some(s =>
    isBreakSession(s) && s.startTime >= from && s.endTime <= to
  )
}

export function formatSessionTimeRange(
  session: StudySession,
  fmt: (ts: number) => string,
): string {
  const segments = session.segments
  if (!segments || segments.length <= 1) {
    return `${fmt(session.startTime)} – ${fmt(session.endTime)}`
  }

  const parts: string[] = []
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    parts.push(`${fmt(seg.start)} – ${fmt(seg.end)}`)
    if (i < segments.length - 1) {
      const pauseSec = Math.round((segments[i + 1].start - seg.end) / 1000)
      if (pauseSec > 0) parts.push(`⏸ ${formatDuration(pauseSec)}`)
    }
  }
  return parts.join(' · ')
}

export function buildTimeline(sessions: StudySession[]): TimelineItem[] {
  const sorted = [...sessions].sort((a, b) => a.startTime - b.startTime)
  const result: TimelineItem[] = []

  for (let i = 0; i < sorted.length; i++) {
    const session = sorted[i]
    result.push({
      type: isBreakSession(session) ? 'break' : 'study',
      session,
    })

    if (i >= sorted.length - 1) continue

    const curr = sorted[i]
    const next = sorted[i + 1]
    const gapMs = next.startTime - curr.endTime

    if (
      gapMs > 60_000 &&
      isStudySession(curr) &&
      isStudySession(next) &&
      !hasBreakBetween(sorted, curr.endTime, next.startTime)
    ) {
      result.push({
        type: 'gap',
        label: formatDuration(Math.floor(gapMs / 1000)),
        ms: gapMs,
      })
    }
  }

  return result.reverse()
}
