import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import { useSessionsStore } from './sessions'
import type { ActiveTimer } from '@/types'
import { formatTimer } from '@/types'

const STORAGE_KEY = 'studyflow_timer'

export const useTimerStore = defineStore('timer', () => {
  const auth = useAuthStore()
  const sessions = useSessionsStore()

  const timer = ref<ActiveTimer | null>(null)
  const now = ref(Date.now())
  let tick: ReturnType<typeof setInterval> | null = null

  function load() {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    timer.value = JSON.parse(raw)
    if (timer.value && !timer.value.isPaused) startTick()
  }

  function save() {
    if (timer.value) localStorage.setItem(STORAGE_KEY, JSON.stringify(timer.value))
    else localStorage.removeItem(STORAGE_KEY)
  }

  function startTick() {
    if (tick) return
    tick = setInterval(() => { now.value = Date.now() }, 1000)
  }

  function stopTick() {
    if (tick) { clearInterval(tick); tick = null }
  }

  const elapsedMs = computed(() => {
    if (!timer.value) return 0
    if (timer.value.isPaused) return timer.value.accumulatedMs
    return timer.value.accumulatedMs + (now.value - timer.value.startedAt)
  })

  const elapsedSeconds = computed(() => Math.floor(elapsedMs.value / 1000))
  const formatted = computed(() => formatTimer(elapsedSeconds.value))
  const isRunning = computed(() => !!timer.value && !timer.value.isPaused)
  const isPaused = computed(() => !!timer.value && timer.value.isPaused)
  const activeSubjectId = computed(() => timer.value?.subjectId ?? null)

  function start(subjectId: string) {
    timer.value = { subjectId, startedAt: Date.now(), isPaused: false, pausedAt: null, accumulatedMs: 0 }
    startTick()
    save()
  }

  function pause() {
    if (!timer.value || timer.value.isPaused) return
    timer.value.accumulatedMs += Date.now() - timer.value.startedAt
    timer.value.isPaused = true
    timer.value.pausedAt = Date.now()
    stopTick()
    save()
  }

  function resume() {
    if (!timer.value || !timer.value.isPaused) return
    timer.value.startedAt = Date.now()
    timer.value.isPaused = false
    timer.value.pausedAt = null
    startTick()
    save()
  }

  async function stop() {
    if (!timer.value) return
    const { subjectId, startedAt } = timer.value
    const totalMs = elapsedMs.value
    if (totalMs < 5000) {
      // ignore sessions shorter than 5 seconds
      reset()
      return
    }
    const endTime = Date.now()
    const startTime = endTime - totalMs
    reset()
    await sessions.save({ subjectId, startTime, endTime, duration: Math.floor(totalMs / 1000) })
  }

  function reset() {
    timer.value = null
    stopTick()
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    timer, elapsedMs, elapsedSeconds, formatted,
    isRunning, isPaused, activeSubjectId,
    load, start, pause, resume, stop, reset,
  }
})
