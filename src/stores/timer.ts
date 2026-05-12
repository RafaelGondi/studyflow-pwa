import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSessionsStore } from './sessions'
import { formatTimer } from '@/types'

const KEY = 'studyflow_timer'

type Mode = 'idle' | 'study' | 'paused' | 'break'

interface TimerState {
  mode: Mode
  subjectId: string | null
  originalStartedAt: number  // wall-clock start of the session (never changes on pause/resume)
  startedAt: number
  accumulatedMs: number
  breakStartedAt: number | null
  breakAccumulatedMs: number // total break ms today (persisted across sessions)
}

export const useTimerStore = defineStore('timer', () => {
  const sessions = useSessionsStore()

  const state = ref<TimerState>({
    mode: 'idle',
    subjectId: null,
    originalStartedAt: 0,
    startedAt: 0,
    accumulatedMs: 0,
    breakStartedAt: null,
    breakAccumulatedMs: 0,
  })
  const now = ref(Date.now())
  let tick: ReturnType<typeof setInterval> | null = null

  function load() {
    const raw = localStorage.getItem(KEY)
    if (!raw) return
    state.value = JSON.parse(raw)
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
    return state.value.accumulatedMs + (now.value - state.value.startedAt)
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
    // if coming from break, save break duration
    if (state.value.mode === 'break' && state.value.breakStartedAt) {
      state.value.breakAccumulatedMs += Date.now() - state.value.breakStartedAt
      state.value.breakStartedAt = null
    }
    state.value.mode = 'study'
    state.value.subjectId = subjectId
    state.value.originalStartedAt = Date.now()
    state.value.startedAt = Date.now()
    state.value.accumulatedMs = 0
    startTick()
    save()
  }

  function pause() {
    if (state.value.mode !== 'study') return
    state.value.accumulatedMs += Date.now() - state.value.startedAt
    state.value.mode = 'paused'
    stopTick()
    save()
  }

  function resume() {
    if (state.value.mode !== 'paused') return
    state.value.startedAt = Date.now()
    state.value.mode = 'study'
    startTick()
    save()
  }

  async function stop() {
    if (state.value.mode === 'idle') return
    const ms = studyElapsedMs.value
    const subjectId = state.value.subjectId
    const startTime = state.value.originalStartedAt || Date.now() - ms

    // save break if stopping from break
    if (state.value.mode === 'break' && state.value.breakStartedAt) {
      state.value.breakAccumulatedMs += Date.now() - state.value.breakStartedAt
    }

    reset()
    if (subjectId && ms >= 5000) {
      await sessions.save({ subjectId, startTime, endTime: Date.now(), duration: Math.floor(ms / 1000) })
    }
  }

  async function startBreak() {
    if (state.value.mode === 'idle') return
    const ms = studyElapsedMs.value
    const subjectId = state.value.subjectId
    const startTime = state.value.originalStartedAt || Date.now() - ms

    if (subjectId && ms >= 5000) {
      await sessions.save({ subjectId, startTime, endTime: Date.now(), duration: Math.floor(ms / 1000) })
    }

    state.value.mode = 'break'
    state.value.subjectId = null
    state.value.accumulatedMs = 0
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
