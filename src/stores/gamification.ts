import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
import { useAuthStore } from './auth'
import * as db from '@/firebase/db'
import type { GamificationSettings } from '@/types'

const DEFAULT_COINS_PER_HOUR = 50

export const useGamificationStore = defineStore('gamification', () => {
  const auth = useAuthStore()
  const loading = ref(false)
  const settings = reactive<GamificationSettings>({
    coinsPerHour: DEFAULT_COINS_PER_HOUR,
    updatedAt: 0,
  })

  async function load() {
    if (!auth.uid) return
    loading.value = true
    try {
      const saved = await db.fetchGamificationSettings(auth.uid)
      settings.coinsPerHour = normalizeRate(saved?.coinsPerHour)
      settings.updatedAt = saved?.updatedAt ?? 0
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

  function calculateCoins(durationSeconds: number, rate = settings.coinsPerHour): number {
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return 0
    return Math.max(0, (durationSeconds * normalizeRate(rate)) / 3600)
  }

  function normalizeRate(value: number | undefined): number {
    if (!Number.isFinite(value)) return DEFAULT_COINS_PER_HOUR
    return Math.min(1000, Math.max(1, Math.round(value!)))
  }

  return { settings, loading, load, updateSettings, calculateCoins }
})
