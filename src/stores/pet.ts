import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from './auth'
import { useGamificationStore } from './gamification'
import { useSessionsStore } from './sessions'
import { useTimerStore } from './timer'
import * as db from '@/firebase/db'
import type { PetMood, PetProfile } from '@/types'

const LEVEL_SIZE = 100

const moodMeta: Record<PetMood, { label: string; message: string }> = {
  sleepy: { label: 'Sonolenta', message: 'Estou esperando nosso primeiro foco de hoje.' },
  curious: { label: 'Curiosa', message: 'Eu vi você começar. Vamos só mais um pouquinho?' },
  happy: { label: 'Animada', message: 'Seu ritmo de hoje já deixou minha estrela brilhando!' },
  proud: { label: 'Orgulhosa', message: 'Que dia bonito de dedicação. Eu sabia que você conseguia.' },
}

export const usePetStore = defineStore('pet', () => {
  const auth = useAuthStore()
  const gamification = useGamificationStore()
  const sessions = useSessionsStore()
  const timer = useTimerStore()
  const profile = ref<PetProfile | null>(null)
  const loading = ref(false)

  const name = computed(() => profile.value?.name || 'Lumi')
  const bondPoints = computed(() => Math.max(0, Math.floor(gamification.earnedCoins)))
  const level = computed(() => Math.floor(bondPoints.value / LEVEL_SIZE) + 1)
  const levelProgress = computed(() => bondPoints.value % LEVEL_SIZE)
  const todaySeconds = computed(() => sessions.todayStudyTotalSeconds + timer.studyElapsedSeconds)
  const mood = computed<PetMood>(() => {
    if (todaySeconds.value >= 3600) return 'proud'
    if (todaySeconds.value >= 1500) return 'happy'
    if (todaySeconds.value > 0) return 'curious'
    return 'sleepy'
  })
  const moodLabel = computed(() => moodMeta[mood.value].label)
  const message = computed(() => moodMeta[mood.value].message)

  async function load() {
    if (!auth.uid) return
    loading.value = true
    try {
      profile.value = await db.fetchPetProfile(auth.uid)
    } catch (error) {
      console.error('[StudyFlow] Erro ao carregar mascote:', error)
    } finally {
      loading.value = false
    }
  }

  async function rename(value: string) {
    if (!auth.uid) return
    const trimmed = value.trim().slice(0, 20)
    if (!trimmed) return
    const now = Date.now()
    const next: PetProfile = {
      petId: 'lumi',
      name: trimmed,
      createdAt: profile.value?.createdAt ?? now,
      updatedAt: now,
    }
    profile.value = next
    await db.savePetProfile(auth.uid, next)
  }

  return {
    profile, loading, name, bondPoints, level, levelProgress, todaySeconds,
    mood, moodLabel, message, load, rename,
  }
})
