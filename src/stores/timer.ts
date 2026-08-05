import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useSessionsStore } from './sessions'
import { formatTimer } from '@/types'
import type { StudySegment, StudySession } from '@/types'

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
  flowNotificationEnabled: boolean
  flowNotificationMinutes: number
}

const DEFAULT_PREFS: TimerPrefs = {
  timerType: 'counter',
  pomodoro: { workMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15, longBreakInterval: 4 },
  flowBreakRatio: 5,
  flowNotificationEnabled: false,
  flowNotificationMinutes: 25,
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
  flowNotificationSent: boolean
}

const DEFAULT_STATE: TimerState = {
  mode: 'idle', subjectId: null,
  originalStartedAt: 0, startedAt: 0, accumulatedMs: 0, segments: [],
  breakStartedAt: 0, breakDurationMs: 0, breakKind: null,
  pomodoroCount: 0,
  flowNotificationSent: false,
}

/* ─── Persistent AudioContext (survives background via resume()) ─── */
let _audioCtx: AudioContext | null = null

function getAudioCtx(): AudioContext | null {
  try {
    if (!_audioCtx || _audioCtx.state === 'closed') {
      _audioCtx = new AudioContext()
    }
    return _audioCtx
  } catch {
    return null
  }
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

  /*
   * Última sessão gravada. Existe pra UI poder celebrar o ganho de moedas sem
   * duplicar a lógica em cada caminho de saída: parar no contador, parar no
   * Flowmodoro e o fim automático de um bloco de Pomodoro passam todos por
   * aqui. Quem observa decide o que mostrar — o store não conhece a tela.
   */
  const lastSavedSession = ref<StudySession | null>(null)
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

  function playChime(type: 'work-done' | 'break-done') {
    const ctx = getAudioCtx()
    if (!ctx) return
    const play = () => {
      try {
        const t0 = ctx.currentTime
        const notes = type === 'work-done'
          ? [{ freq: 528, vol: 0.12, offset: 0, dur: 2.2 }]
          : [
              { freq: 440, vol: 0.10, offset: 0,    dur: 1.8 },
              { freq: 528, vol: 0.10, offset: 0.35, dur: 1.8 },
            ]
        for (const { freq, vol, offset, dur } of notes) {
          const osc  = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.type = 'sine'
          osc.frequency.value = freq
          const t = t0 + offset
          gain.gain.setValueAtTime(0, t)
          gain.gain.linearRampToValueAtTime(vol, t + 0.025)
          gain.gain.exponentialRampToValueAtTime(0.001, t + dur)
          osc.start(t)
          osc.stop(t + dur)
        }
      } catch {}
    }
    try {
      if (ctx.state === 'suspended') {
        ctx.resume().then(play).catch(() => {})
      } else {
        play()
      }
    } catch {}
  }

  function notifyFlowMilestone(minutes: number) {
    state.value.flowNotificationSent = true
    save()
    vibrate([180, 100, 180])
    playChime('break-done')
    notify(
      `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'} de foco`,
      'O Flowmodoro continua correndo. Pare quando quiser.',
    )
  }

  function notify(title: string, body: string) {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    navigator.serviceWorker?.ready
      .then(reg => reg.showNotification(title, { body, silent: false }))
      .catch(() => {})
  }

  async function requestNotificationPermission() {
    if (typeof Notification === 'undefined') return
    if (Notification.permission === 'default') {
      await Notification.requestPermission().catch(() => {})
    }
  }

  function enterBreak(durationMs: number, kind: BreakKind) {
    const startedAt = Date.now()
    stopTick()
    now.value                   = startedAt
    state.value.mode            = 'break'
    state.value.breakStartedAt  = startedAt
    state.value.breakDurationMs = durationMs
    state.value.breakKind       = kind
    state.value.accumulatedMs   = 0
    state.value.segments        = []
    startTick()
    save()
    vibrate([200, 100, 200])
    playChime('work-done')
    notify('Sessão concluída', kind === 'flow' ? 'Hora da pausa proporcional.' : 'Hora da pausa.')
  }

  function endBreak() {
    stopTick()
    const afterLong = state.value.breakKind === 'long'
    const subjectId = state.value.subjectId
    state.value = {
      ...DEFAULT_STATE,
      subjectId,
      pomodoroCount: afterLong ? 0 : state.value.pomodoroCount,
    }
    localStorage.removeItem(SESSION_KEY)
    vibrate([100, 50, 100, 50, 100])
    playChime('break-done')
    notify('Pausa encerrada', 'Hora de voltar ao foco!')

    // Auto-restart next Pomodoro cycle
    if (prefs.value.timerType === 'pomodoro' && subjectId) {
      void startStudy(subjectId)
    }
  }

  /* ─── Auto-advance: Pomodoro work → break ────────────────────── */
  watch(studyElapsedMs, async (ms) => {
    if (prefs.value.timerType !== 'pomodoro') return
    if (state.value.mode !== 'study')         return
    if (ms < workDurationMs.value)            return
    await completePomodoro()
  })

  watch(studyElapsedMs, (ms) => {
    if (prefs.value.timerType !== 'flowmodoro') return
    if (state.value.mode !== 'study') return
    if (!prefs.value.flowNotificationEnabled || state.value.flowNotificationSent) return
    const rawMinutes = prefs.value.flowNotificationMinutes
    const minutes = Number.isFinite(rawMinutes) ? Math.min(240, Math.max(1, rawMinutes)) : 25
    if (ms < minutes * 60_000) return
    notifyFlowMilestone(minutes)
  })

  async function completePomodoro() {
    const ms        = studyElapsedMs.value
    const subjectId = state.value.subjectId
    const startTime = state.value.originalStartedAt || Date.now() - ms
    const endTime   = Date.now()
    const segments  = buildSegments()
    const count     = state.value.pomodoroCount + 1
    const isLong    = count % prefs.value.pomodoro.longBreakInterval === 0
    const breakMs   = (isLong
      ? prefs.value.pomodoro.longBreakMinutes
      : prefs.value.pomodoro.shortBreakMinutes) * 60_000

    // Transition first (prevents re-entry from watcher, mode → 'break' before async save)
    state.value.pomodoroCount = count
    enterBreak(breakMs, isLong ? 'long' : 'short')

    if (subjectId && ms >= 5000) {
      lastSavedSession.value = await sessions.saveStudy({
        subjectId, startTime, endTime,
        duration: Math.floor(ms / 1000), segments,
      }) ?? null
    }
  }

  /* ─── Auto-end break ─────────────────────────────────────────── */
  watch(breakRemainingMs, (ms) => {
    if (state.value.mode === 'break' && ms === 0) endBreak()
  })

  /* ─── Public actions ─────────────────────────────────────────── */
  async function startStudy(subjectId: string) {
    // Warm up AudioContext and request notification permission during user gesture
    getAudioCtx()
    void requestNotificationPermission()

    const now_ = Date.now()
    now.value = now_
    state.value.mode               = 'study'
    state.value.subjectId          = subjectId
    state.value.originalStartedAt  = now_
    state.value.startedAt          = now_
    state.value.accumulatedMs      = 0
    state.value.segments           = []
    state.value.flowNotificationSent = false
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
      const endTime   = Date.now()
      const rawRatio  = prefs.value.flowBreakRatio
      const flowRatio = Number.isFinite(rawRatio) && rawRatio > 0 ? rawRatio : DEFAULT_PREFS.flowBreakRatio
      const breakMs   = Math.max(1000, Math.floor(ms / flowRatio))
      enterBreak(breakMs, 'flow')   // mode → 'break' before async save
      if (subjectId) {
        lastSavedSession.value = await sessions.saveStudy({
          subjectId, startTime, endTime,
          duration: Math.floor(ms / 1000), segments,
        }) ?? null
      }
      return
    }

    /*
     * Counter or Pomodoro early exit. No Pomodoro a contagem do ciclo sobrevive:
     * parar no meio do 3º bloco e recomeçar não deveria jogar você de volta pro
     * 1º — só a pausa longa fecha o ciclo.
     */
    reset({ keepCycle: prefs.value.timerType === 'pomodoro' })
    if (subjectId && ms >= 5000) {
      lastSavedSession.value = await sessions.saveStudy({
        subjectId, startTime, endTime: Date.now(),
        duration: Math.floor(ms / 1000), segments,
      }) ?? null
    }
  }

  function skipBreak() {
    if (state.value.mode === 'break') endBreak()
  }

  function reset(opts?: { keepCycle?: boolean }) {
    stopTick()
    const pomodoroCount = opts?.keepCycle ? state.value.pomodoroCount : 0
    state.value = { ...DEFAULT_STATE, pomodoroCount }
    if (pomodoroCount > 0) save()
    else localStorage.removeItem(SESSION_KEY)
  }

  return {
    state, mode, activeSubjectId, lastSavedSession,
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
