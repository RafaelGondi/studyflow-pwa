<template>
  <div class="ak-app-root">
    <AkAmbientBg contained />
    <UpdateBanner />
    <main class="ak-app-main">
      <Transition name="page" mode="out-in">
        <RouterView v-if="appReady" :key="route.path" />
        <div v-else class="loading-screen reveal">
          <AkShimmer width="48px" height="48px" radius="full" />
          <AkShimmer width="140px" height="12px" radius="md" />
        </div>
      </Transition>
    </main>
    <AppTabBar v-if="appReady" />
    <AppToastHost />
    <AppConfirmSheet />
    <CoinBurstHost />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { AkAmbientBg, AkShimmer } from '@rafael_dias/akoma'
import { useAuthStore } from '@/stores/auth'
import { useSubjectsStore } from '@/stores/subjects'
import { useSessionsStore } from '@/stores/sessions'
import { useGamificationStore } from '@/stores/gamification'
import { useAppTheme } from '@/composables/useAppTheme'
import AppTabBar from '@/components/layout/AppTabBar.vue'
import UpdateBanner from '@/components/ui/UpdateBanner.vue'
import AppToastHost from '@/components/ui/AppToastHost.vue'
import AppConfirmSheet from '@/components/ui/AppConfirmSheet.vue'
import CoinBurstHost from '@/components/ui/CoinBurstHost.vue'

useAppTheme()

const route = useRoute()
const authStore = useAuthStore()
const subjectsStore = useSubjectsStore()
const sessionsStore = useSessionsStore()
const gamificationStore = useGamificationStore()

const appReady = ref(false)

watch(() => authStore.uid, (newUid, oldUid) => {
  if (newUid && oldUid && newUid !== oldUid) {
    void Promise.all([subjectsStore.load(), sessionsStore.loadToday(), gamificationStore.load()])
  }
})

onMounted(async () => {
  await authStore.init()
  try {
    await Promise.all([subjectsStore.load(), sessionsStore.loadToday(), gamificationStore.load()])
  } catch (e) {
    console.error('[StudyFlow] Erro ao carregar dados iniciais:', e)
  } finally {
    appReady.value = true
  }
})
</script>
