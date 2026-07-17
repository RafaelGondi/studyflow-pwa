<template>
  <div class="app-shell">
    <AkAmbientBg />
    <UpdateBanner />
    <main class="app-main">
      <Transition name="page" mode="out-in">
        <RouterView v-if="appReady" :key="route.path" />
        <div v-else class="loading-screen reveal">
          <AkShimmer width="48px" height="48px" radius="full" />
          <AkShimmer width="140px" height="12px" radius="md" />
        </div>
      </Transition>
    </main>
    <AppTabBar v-if="appReady" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { AkAmbientBg, AkShimmer } from '@rafael_dias/akoma'
import { useAuthStore } from '@/stores/auth'
import { useSubjectsStore } from '@/stores/subjects'
import { useSessionsStore } from '@/stores/sessions'
import { useThemeStore } from '@/stores/theme'
import AppTabBar from '@/components/layout/AppTabBar.vue'
import UpdateBanner from '@/components/ui/UpdateBanner.vue'

const route = useRoute()
const authStore = useAuthStore()
const subjectsStore = useSubjectsStore()
const sessionsStore = useSessionsStore()
const themeStore = useThemeStore()

const appReady = ref(false)

watch(() => authStore.uid, (newUid, oldUid) => {
  if (newUid && oldUid && newUid !== oldUid) {
    subjectsStore.load()
    sessionsStore.loadToday()
  }
})

onMounted(async () => {
  themeStore.init()
  await authStore.init()
  try {
    await Promise.all([subjectsStore.load(), sessionsStore.loadToday()])
  } catch (e) {
    console.error('[StudyFlow] Erro ao carregar dados iniciais:', e)
  } finally {
    appReady.value = true
  }
})
</script>
