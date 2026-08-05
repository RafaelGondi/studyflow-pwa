import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import { useAuthStore } from './auth'
import * as db from '@/firebase/db'
import type { GamificationSettings, Reward, RewardRedemption, StudySession } from '@/types'

/*
 * 60 faz 1 moeda valer exatamente 1 minuto de estudo. Isso torna todo custo
 * autoexplicativo — "90 moedas" lê-se "1h30 de estudo" sem conta — e é a
 * unidade em que as faixas de recompensa e a carteira já falam.
 */
const DEFAULT_COINS_PER_HOUR = 60

export type WalletEntry =
  | { id: string; type: 'earning'; amount: number; createdAt: number; session: StudySession }
  | { id: string; type: 'redemption'; amount: number; createdAt: number; redemption: RewardRedemption }
  | { id: string; type: 'refund'; amount: number; createdAt: number; redemption: RewardRedemption }

export type RewardDraft = Omit<Reward, 'id' | 'userId' | 'createdAt' | 'updatedAt'>

export const useGamificationStore = defineStore('gamification', () => {
  const auth = useAuthStore()
  const loading = ref(false)
  const rewardedSessions = ref<StudySession[]>([])
  const rewards = ref<Reward[]>([])
  const redemptions = ref<RewardRedemption[]>([])
  const settings = reactive<GamificationSettings>({
    coinsPerHour: DEFAULT_COINS_PER_HOUR,
    updatedAt: 0,
  })

  const earnedCoins = computed(() =>
    rewardedSessions.value.reduce((total, session) => total + (session.coinsEarned ?? 0), 0),
  )
  const spentCoins = computed(() =>
    redemptions.value.reduce((total, redemption) =>
      redemption.undoneAt ? total : total + redemption.cost, 0),
  )
  const balance = computed(() => Math.floor(earnedCoins.value) - spentCoins.value)
  const activeRewards = computed(() => rewards.value.filter(reward => !reward.archivedAt))
  const archivedRewards = computed(() => rewards.value.filter(reward => !!reward.archivedAt))
  const recentLedger = computed<WalletEntry[]>(() => {
    const entries: WalletEntry[] = rewardedSessions.value.map(session => ({
      id: `earning-${session.id}`,
      type: 'earning',
      amount: session.coinsEarned ?? 0,
      createdAt: session.endTime,
      session,
    }))
    for (const redemption of redemptions.value) {
      entries.push({
        id: `redemption-${redemption.id}`,
        type: 'redemption',
        amount: -redemption.cost,
        createdAt: redemption.createdAt,
        redemption,
      })
      if (redemption.undoneAt) {
        entries.push({
          id: `refund-${redemption.id}`,
          type: 'refund',
          amount: redemption.cost,
          createdAt: redemption.undoneAt,
          redemption,
        })
      }
    }
    return entries.sort((a, b) => b.createdAt - a.createdAt).slice(0, 100)
  })

  async function load() {
    if (!auth.uid) return
    loading.value = true
    try {
      const [saved, sessions, savedRewards, savedRedemptions] = await Promise.all([
        db.fetchGamificationSettings(auth.uid),
        db.fetchRewardedSessions(auth.uid),
        db.fetchRewards(auth.uid),
        db.fetchRedemptions(auth.uid),
      ])
      settings.coinsPerHour = normalizeRate(saved?.coinsPerHour)
      settings.updatedAt = saved?.updatedAt ?? 0
      rewardedSessions.value = sessions
      rewards.value = savedRewards
      redemptions.value = savedRedemptions
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

  async function addReward(data: RewardDraft) {
    if (!auth.uid) return
    const reward = await db.addReward(auth.uid, data)
    rewards.value.push(reward)
    return reward
  }

  async function updateReward(id: string, data: Partial<RewardDraft>) {
    if (!auth.uid) return
    await db.updateReward(auth.uid, id, data)
    const index = rewards.value.findIndex(reward => reward.id === id)
    if (index !== -1) {
      rewards.value[index] = { ...rewards.value[index], ...data, updatedAt: Date.now() }
    }
  }

  async function archiveReward(id: string) {
    await updateReward(id, { archivedAt: Date.now() })
  }

  async function restoreReward(id: string) {
    await updateReward(id, { archivedAt: null })
  }

  async function removeReward(id: string) {
    if (!auth.uid) return
    await db.deleteReward(auth.uid, id)
    rewards.value = rewards.value.filter(reward => reward.id !== id)
  }

  async function refreshWallet() {
    if (!auth.uid) return
    const [sessions, savedRedemptions] = await Promise.all([
      db.fetchRewardedSessions(auth.uid),
      db.fetchRedemptions(auth.uid),
    ])
    rewardedSessions.value = sessions
    redemptions.value = savedRedemptions
  }

  function hasActiveRedemption(rewardId: string) {
    return redemptions.value.some(redemption =>
      redemption.rewardId === rewardId && !redemption.undoneAt,
    )
  }

  function canRedeem(reward: Reward) {
    if (reward.archivedAt) return false
    if (balance.value < reward.cost) return false
    return reward.repeatable || !hasActiveRedemption(reward.id)
  }

  async function redeemReward(id: string) {
    if (!auth.uid) return
    await refreshWallet()
    const reward = rewards.value.find(item => item.id === id)
    if (!reward) throw new Error('reward-not-found')
    if (balance.value < reward.cost) throw new Error('insufficient-balance')
    if (!reward.repeatable && hasActiveRedemption(reward.id)) {
      throw new Error('reward-already-redeemed')
    }
    const redemption = await db.addRedemption(auth.uid, reward)
    redemptions.value.unshift(redemption)
    return redemption
  }

  async function undoRedemption(id: string) {
    if (!auth.uid) return
    const redemption = redemptions.value.find(item => item.id === id)
    if (!redemption || redemption.undoneAt) return
    const undoneAt = Date.now()
    await db.undoRedemption(auth.uid, id, undoneAt)
    redemption.undoneAt = undoneAt
  }

  function calculateCoins(
    durationSeconds: number,
    rate = settings.coinsPerHour,
    multiplier = 1,
  ): number {
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return 0
    if (!Number.isFinite(multiplier) || multiplier <= 0) return 0
    return Math.max(0, (durationSeconds * normalizeRate(rate) * multiplier) / 3600)
  }

  function normalizeRate(value: number | undefined): number {
    if (!Number.isFinite(value)) return DEFAULT_COINS_PER_HOUR
    return Math.min(1000, Math.max(1, Math.round(value!)))
  }

  return {
    settings, loading, rewardedSessions, rewards, redemptions,
    earnedCoins, spentCoins, balance, activeRewards, archivedRewards, recentLedger,
    load, refreshWallet, updateSettings, calculateCoins, trackSession, forgetSession,
    addReward, updateReward, archiveReward, restoreReward, removeReward,
    hasActiveRedemption, canRedeem, redeemReward, undoRedemption,
  }
})
