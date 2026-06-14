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
