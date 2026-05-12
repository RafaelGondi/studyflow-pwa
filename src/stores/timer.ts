import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSessionsStore } from './sessions'
import { formatTimer } from '@/types'
import type { StudySegment } from '@/types'

const KEY = 'studyflow_timer'

type Mode = 'idle' | 'study' | 'paused' | 'break'

interface TimerState {
  mode: Mode
  subjectId: string | null
  originalStartedAt: number
  startedAt: number
  accumulatedMs: number
  segments: StudySegment[]
  breakStartedAt: number | null
  breakAccumulatedMs: number
}

export const useTimerStore = defineStore('timer', () => {
  const sessions = useSessionsStore()

  const state = ref<TimerState>({
    mode: 'idle',
    subjectId: null,
    originalStartedAt: 0,
    startedAt: 0,
    accumulatedMs: 0,
    segments: [],
    breakStartedAt: null,
    breakAccumulatedMs: 0,
  })
  const now = ref(Date.now())
  let tick: ReturnType<typeof setInterval> | null = null

  function load() {
    const raw = localStorage.getItem(KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    state.value = { segments: [], ...parsed }
    if (state.value.mode === 'study' || state.value.mode === 'break') startTick()
  }

  function save() { localStorage.setItem(KEY, JSON.stringify(state.value)) }

  function startTick() {
    if (tick) return
    tick = setInterval(() => { now.value = Date.now() }, 1000)
  }
  function stopTick() { if (tick) { clearInterval(tick); tick = null } }

  // ── Study elapsed ──────────────────────────────────────────────────────────
  const studyElapsedMs = computed(() => {
    if (state.value.mode === 'idle' || state.value.mode === 'break') return 0
    if (state.value.mode === 'paused') return state.value.accumulatedMs
    return state.value.accumulatedMs + Math.max(0, now.value - state.value.startedAt)
  })
  const studyElapsedSeconds = computed(() => Math.floor(studyElapsedMs.value / 1000))
  const studyFormatted = computed(() => formatTimer(studyElapsedSeconds.value))

  // ── Break elapsed ──────────────────────────────────────────────────────────
  const breakElapsedMs = computed(() => {
    if (state.value.mode !== 'break' || !state.value.breakStartedAt) return 0
    return now.value - state.value.breakStartedAt
  })
  const breakTotalMs = computed(() => state.value.breakAccumulatedMs + breakElapsedMs.value)
  const breakFormatted = computed(() => formatTimer(Math.floor(breakTotalMs.value / 1000)))

  const mode = computed(() => state.value.mode)
  const activeSubjectId = computed(() => state.value.subjectId)
  const isRunning = computed(() => state.value.mode === 'study')
  const isPaused  = computed(() => state.value.mode === 'paused')
  const isBreak   = computed(() => state.value.mode === 'break')

  // ── Actions ────────────────────────────────────────────────────────────────

  function startStudy(subjectId: string) {
    if (state.value.mode === 'break' && state.value.breakStartedAt) {
      state.value.breakAccumulatedMs += Date.now() - state.value.breakStartedAt
      state.value.breakStartedAt = null
    }
    const now_ = Date.now()
    now.value = now_
    state.value.mode = 'study'
    state.value.subjectId = subjectId
    state.value.originalStartedAt = now_
    state.value.startedAt = now_
    state.value.accumulatedMs = 0
    state.value.segments = []
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

  function buildSegments(): StudySegment[] {
    if (state.value.mode === 'study') {
      return [...state.value.segments, { start: state.value.startedAt, end: Date.now() }]
    }
    return state.value.segments
  }

  async function stop() {
    if (state.value.mode === 'idle') return
    const ms = studyElapsedMs.value
    const subjectId = state.value.subjectId
    const startTime = state.value.originalStartedAt || Date.now() - ms
    const segments = buildSegments()

    if (state.value.mode === 'break' && state.value.breakStartedAt) {
      state.value.breakAccumulatedMs += Date.now() - state.value.breakStartedAt
    }

    reset()
    if (subjectId && ms >= 5000) {
      await sessions.save({ subjectId, startTime, endTime: Date.now(), duration: Math.floor(ms / 1000), segments })
    }
  }

  async function startBreak() {
    if (state.value.mode === 'idle') return
    const ms = studyElapsedMs.value
    const subjectId = state.value.subjectId
    const startTime = state.value.originalStartedAt || Date.now() - ms
    const segments = buildSegments()

    if (subjectId && ms >= 5000) {
      await sessions.save({ subjectId, startTime, endTime: Date.now(), duration: Math.floor(ms / 1000), segments })
    }

    state.value.mode = 'break'
    state.value.subjectId = null
    state.value.accumulatedMs = 0
    state.value.segments = []
    state.value.breakStartedAt = Date.now()
    startTick()
    save()
  }

  function reset() {
    stopTick()
    state.value = {
      mode: 'idle',
      subjectId: null,
      originalStartedAt: 0,
      startedAt: 0,
      accumulatedMs: 0,
      segments: [],
      breakStartedAt: null,
      breakAccumulatedMs: state.value.breakAccumulatedMs,
    }
    localStorage.removeItem(KEY)
  }

  function resetBreakTime() {
    state.value.breakAccumulatedMs = 0
    save()
  }

  return {
    state, mode, activeSubjectId,
    isRunning, isPaused, isBreak,
    studyElapsedMs, studyElapsedSeconds, studyFormatted,
    breakElapsedMs, breakTotalMs, breakFormatted,
    load, startStudy, pause, resume, stop, startBreak, reset, resetBreakTime,
  }
})
