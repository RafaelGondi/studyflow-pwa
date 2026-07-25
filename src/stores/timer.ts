import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useSessionsStore } from './sessions'
import { formatTimer } from '@/types'
import type { StudySegment } from '@/types'

const SESSION_KEY = 'studyflow_timer'
const PREFS_KEY   = 'studyflow_timer_prefs'

type SessionMode = 'idle' | 'study' | 'paused' | 'break'
export type TimerType  = 'counter' | 'pomodoro' | 'flowmodoro'
export type BreakKind  = 'short' | 'long' | 'flow'

export interface PomodoroPrefs {
  workMinutes:        number  // 25
  shortBreakMinutes:  number  // 5
  longBreakMinutes:   number  // 15
  longBreakInterval:  number  // 4  (long break after this many work blocks)
}

export interface TimerPrefs {
  timerType:      TimerType
  pomodoro:       PomodoroPrefs
  flowBreakRatio: number   // break = workTime / ratio  (default 5)
}

const DEFAULT_PREFS: TimerPrefs = {
  timerType: 'counter',
  pomodoro: { workMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15, longBreakInterval: 4 },
  flowBreakRatio: 5,
}

interface TimerState {
  mode:               SessionMode
  subjectId:          string | null
  originalStartedAt:  number
  startedAt:          number
  accumulatedMs:      number
  segments:           StudySegment[]
  // break tracking
  breakStartedAt:  number
  breakDurationMs: number
  breakKind:       BreakKind | null
  // pomodoro series
  pomodoroCount: number
}

const DEFAULT_STATE: TimerState = {
  mode: 'idle', subjectId: null,
  originalStartedAt: 0, startedAt: 0, accumulatedMs: 0, segments: [],
  breakStartedAt: 0, breakDurationMs: 0, breakKind: null,
  pomodoroCount: 0,
}

export const useTimerStore = defineStore('timer', () => {
  const sessions = useSessionsStore()

  /* ─── Preferences ───────────────────────────────────────────── */
  const prefs = ref<TimerPrefs>({ ...DEFAULT_PREFS, pomodoro: { ...DEFAULT_PREFS.pomodoro } })

  function loadPrefs() {
    try {
      const raw = localStorage.getItem(PREFS_KEY)
      if (!raw) return
      const p = JSON.parse(raw)
      prefs.value = { ...DEFAULT_PREFS, ...p, pomodoro: { ...DEFAULT_PREFS.pomodoro, ...(p.pomodoro ?? {}) } }
    } catch {}
  }

  function updatePrefs(partial: Partial<Omit<TimerPrefs, 'pomodoro'>> & { pomodoro?: Partial<PomodoroPrefs> }) {
    prefs.value = {
      ...prefs.value,
      ...partial,
      pomodoro: partial.pomodoro
        ? { ...prefs.value.pomodoro, ...partial.pomodoro }
        : prefs.value.pomodoro,
    }
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs.value))
  }

  /* ─── Session state ──────────────────────────────────────────── */
  const state = ref<TimerState>({ ...DEFAULT_STATE })
  const now = ref(Date.now())
  let tick: ReturnType<typeof setInterval> | null = null

  function load() {
    loadPrefs()
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw)
      if (parsed.mode === 'break') parsed.mode = 'idle'   // breaks don't survive reload
      state.value = { ...DEFAULT_STATE, ...parsed }
      if (state.value.mode === 'study') startTick()
    } catch {}
  }

  function save() { localStorage.setItem(SESSION_KEY, JSON.stringify(state.value)) }

  function startTick() { if (!tick) tick = setInterval(() => { now.value = Date.now() }, 1000) }
  function stopTick()  { if (tick) { clearInterval(tick); tick = null } }

  /* ─── Study elapsed (counts up) ─────────────────────────────── */
  const studyElapsedMs = computed(() => {
    if (state.value.mode === 'idle' || state.value.mode === 'break') return 0
    if (state.value.mode === 'paused') return state.value.accumulatedMs
    return state.value.accumulatedMs + Math.max(0, now.value - state.value.startedAt)
  })
  const studyElapsedSeconds = computed(() => Math.floor(studyElapsedMs.value / 1000))
  const studyFormatted = computed(() => formatTimer(studyElapsedSeconds.value))

  /* ─── Break remaining (counts down) ─────────────────────────── */
  const breakRemainingMs = computed(() => {
    if (state.value.mode !== 'break') return 0
    return Math.max(0, state.value.breakDurationMs - (now.value - state.value.breakStartedAt))
  })
  const breakRemainingSeconds = computed(() => Math.ceil(breakRemainingMs.value / 1000))
  const breakFormatted = computed(() => formatTimer(breakRemainingSeconds.value))

  /* ─── Pomodoro work remaining (counts down) ──────────────────── */
  const workDurationMs = computed(() => prefs.value.pomodoro.workMinutes * 60_000)
  const workRemainingMs = computed(() => {
    if (prefs.value.timerType !== 'pomodoro') return 0
    if (state.value.mode === 'idle') return workDurationMs.value
    return Math.max(0, workDurationMs.value - studyElapsedMs.value)
  })
  const workRemainingFormatted = computed(() => formatTimer(Math.ceil(workRemainingMs.value / 1000)))

  /* ─── Unified display (what to show on the primary clock) ───── */
  const displayFormatted = computed(() => {
    if (state.value.mode === 'break')      return breakFormatted.value
    if (prefs.value.timerType === 'pomodoro') return workRemainingFormatted.value
    return studyFormatted.value
  })
  const displayIsCountdown = computed(() =>
    state.value.mode === 'break' || prefs.value.timerType === 'pomodoro'
  )

  /* ─── Derived flags ──────────────────────────────────────────── */
  const mode            = computed(() => state.value.mode)
  const activeSubjectId = computed(() => state.value.subjectId)
  const isRunning       = computed(() => state.value.mode === 'study')
  const isPaused        = computed(() => state.value.mode === 'paused')
  const isInBreak       = computed(() => state.value.mode === 'break')
  const pomodoroCount   = computed(() => state.value.pomodoroCount)
  const breakKind       = computed(() => state.value.breakKind)
  const timerType       = computed(() => prefs.value.timerType)

  /* ─── Helpers ────────────────────────────────────────────────── */
  function buildSegments(): StudySegment[] {
    if (state.value.mode === 'study') {
      return [...state.value.segments, { start: state.value.startedAt, end: Date.now() }]
    }
    return state.value.segments
  }

  function vibrate(pattern: number[]) {
    try { navigator.vibrate?.(pattern) } catch {}
  }

  function enterBreak(durationMs: number, kind: BreakKind) {
    stopTick()
    state.value.mode            = 'break'
    state.value.breakStartedAt  = Date.now()
    state.value.breakDurationMs = durationMs
    state.value.breakKind       = kind
    state.value.accumulatedMs   = 0
    state.value.segments        = []
    startTick()
    save()
    vibrate([200, 100, 200])
  }

  function endBreak() {
    stopTick()
    const afterLong = state.value.breakKind === 'long'
    state.value = {
      ...DEFAULT_STATE,
      subjectId:     state.value.subjectId,   // keep subject for next start
      pomodoroCount: afterLong ? 0 : state.value.pomodoroCount,
    }
    localStorage.removeItem(SESSION_KEY)
    vibrate([100, 50, 100, 50, 100])
  }

  /* ─── Auto-advance: Pomodoro work → break ────────────────────── */
  watch(studyElapsedMs, async (ms) => {
    if (prefs.value.timerType !== 'pomodoro') return
    if (state.value.mode !== 'study')         return
    if (ms < workDurationMs.value)            return
    await completePomodoro()
  })

  async function completePomodoro() {
    const ms        = studyElapsedMs.value
    const subjectId = state.value.subjectId
    const startTime = state.value.originalStartedAt || Date.now() - ms
    const segments  = buildSegments()
    const count     = state.value.pomodoroCount + 1
    const isLong    = count % prefs.value.pomodoro.longBreakInterval === 0
    const breakMs   = (isLong
      ? prefs.value.pomodoro.longBreakMinutes
      : prefs.value.pomodoro.shortBreakMinutes) * 60_000

    // Transition first (prevents re-entry from watcher)
    state.value.pomodoroCount = count
    enterBreak(breakMs, isLong ? 'long' : 'short')

    if (subjectId && ms >= 5000) {
      await sessions.saveStudy({
        subjectId, startTime, endTime: Date.now(),
        duration: Math.floor(ms / 1000), segments,
      })
    }
  }

  /* ─── Auto-end break ─────────────────────────────────────────── */
  watch(breakRemainingMs, (ms) => {
    if (state.value.mode === 'break' && ms === 0) endBreak()
  })

  /* ─── Public actions ─────────────────────────────────────────── */
  async function startStudy(subjectId: string) {
    const now_ = Date.now()
    now.value = now_
    state.value.mode               = 'study'
    state.value.subjectId          = subjectId
    state.value.originalStartedAt  = now_
    state.value.startedAt          = now_
    state.value.accumulatedMs      = 0
    state.value.segments           = []
    startTick()
    save()
  }

  function pause() {
    if (state.value.mode !== 'study') return
    const now_ = Date.now()
    state.value.segments.push({ start: state.value.startedAt, end: now_ })
    state.value.accumulatedMs += now_ - state.value.startedAt
    state.value.mode = 'paused'
    stopTick()
    save()
  }

  function resume() {
    if (state.value.mode !== 'paused') return
    const now_ = Date.now()
    now.value = now_
    state.value.startedAt = now_
    state.value.mode = 'study'
    startTick()
    save()
  }

  async function stop() {
    if (state.value.mode === 'idle') return

    // In break: skip it
    if (state.value.mode === 'break') {
      endBreak()
      return
    }

    const ms        = studyElapsedMs.value
    const subjectId = state.value.subjectId
    const startTime = state.value.originalStartedAt || Date.now() - ms
    const segments  = buildSegments()

    // Flowmodoro: save session then enforce a proportional break
    if (prefs.value.timerType === 'flowmodoro' && ms >= 5000) {
      const breakMs = Math.max(60_000, Math.floor(ms / prefs.value.flowBreakRatio))
      if (subjectId) {
        await sessions.saveStudy({
          subjectId, startTime, endTime: Date.now(),
          duration: Math.floor(ms / 1000), segments,
        })
      }
      enterBreak(breakMs, 'flow')
      return
    }

    // Counter or Pomodoro early exit
    reset()
    if (subjectId && ms >= 5000) {
      await sessions.saveStudy({
        subjectId, startTime, endTime: Date.now(),
        duration: Math.floor(ms / 1000), segments,
      })
    }
  }

  function skipBreak() {
    if (state.value.mode === 'break') endBreak()
  }

  function reset() {
    stopTick()
    state.value = { ...DEFAULT_STATE }
    localStorage.removeItem(SESSION_KEY)
  }

  return {
    state, mode, activeSubjectId,
    isRunning, isPaused, isInBreak,
    studyElapsedMs, studyElapsedSeconds, studyFormatted,
    breakRemainingMs, breakRemainingSeconds, breakFormatted,
    workRemainingMs, workRemainingFormatted,
    displayFormatted, displayIsCountdown,
    timerType, pomodoroCount, breakKind,
    prefs, updatePrefs,
    load, startStudy, pause, resume, stop, skipBreak, reset,
  }
})
