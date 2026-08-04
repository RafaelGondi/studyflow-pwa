import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import { useAuthStore } from './auth'
import * as db from '@/firebase/db'
import type { GamificationSettings, StudySession } from '@/types'

const DEFAULT_COINS_PER_HOUR = 50

export const useGamificationStore = defineStore('gamification', () => {
  const auth = useAuthStore()
  const loading = ref(false)
  const rewardedSessions = ref<StudySession[]>([])
  const settings = reactive<GamificationSettings>({
    coinsPerHour: DEFAULT_COINS_PER_HOUR,
    updatedAt: 0,
  })

  const earnedCoins = computed(() =>
    rewardedSessions.value.reduce((total, session) => total + (session.coinsEarned ?? 0), 0),
  )
  const balance = computed(() => Math.floor(earnedCoins.value))
  const recentEarnings = computed(() =>
    [...rewardedSessions.value].sort((a, b) => b.endTime - a.endTime).slice(0, 50),
  )

  async function load() {
    if (!auth.uid) return
    loading.value = true
    try {
      const [saved, sessions] = await Promise.all([
        db.fetchGamificationSettings(auth.uid),
        db.fetchRewardedSessions(auth.uid),
      ])
      settings.coinsPerHour = normalizeRate(saved?.coinsPerHour)
      settings.updatedAt = saved?.updatedAt ?? 0
      rewardedSessions.value = sessions
    } catch (error) {
      console.error('[StudyFlow] Erro ao carregar preferências de recompensas:', error)
    } finally {
      loading.value = false
    }
  }

  async function updateSettings(patch: Partial<Pick<GamificationSettings, 'coinsPerHour'>>) {
    if (!auth.uid) return
    const next: GamificationSettings = {
      coinsPerHour: normalizeRate(patch.coinsPerHour ?? settings.coinsPerHour),
      updatedAt: Date.now(),
    }
    await db.saveGamificationSettings(auth.uid, next)
    Object.assign(settings, next)
  }

  function trackSession(session: StudySession | undefined) {
    if (!session) return
    rewardedSessions.value = rewardedSessions.value.filter(item => item.id !== session.id)
    if ((session.coinsEarned ?? 0) > 0) {
      rewardedSessions.value.push(session)
    }
  }

  function forgetSession(id: string) {
    rewardedSessions.value = rewardedSessions.value.filter(session => session.id !== id)
  }

  function calculateCoins(durationSeconds: number, rate = settings.coinsPerHour): number {
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return 0
    return Math.max(0, (durationSeconds * normalizeRate(rate)) / 3600)
  }

  function normalizeRate(value: number | undefined): number {
    if (!Number.isFinite(value)) return DEFAULT_COINS_PER_HOUR
    return Math.min(1000, Math.max(1, Math.round(value!)))
  }

  return {
    settings, loading, rewardedSessions, earnedCoins, balance, recentEarnings,
    load, updateSettings, calculateCoins, trackSession, forgetSession,
  }
})
