<template>
  <div class="shell">
    <AmbientBg />
    <UpdateBanner />
    <main class="akoma-shell">
      <Transition name="page" mode="out-in">
        <RouterView v-if="appReady" :key="route.path" />
        <div v-else class="min-h-[70dvh] flex flex-col items-center justify-center gap-4 reveal">
          <div class="text-5xl animate-pulse-slow">📚</div>
          <p class="text-muted text-sm font-medium">Carregando StudyFlow...</p>
        </div>
      </Transition>
    </main>
    <BottomNav v-if="appReady" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSubjectsStore } from '@/stores/subjects'
import { useSessionsStore } from '@/stores/sessions'
import { useThemeStore } from '@/stores/theme'
import AmbientBg from '@/components/layout/AmbientBg.vue'
import BottomNav from '@/components/layout/BottomNav.vue'
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

<style scoped>
.shell {
  position: relative;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}
</style>
