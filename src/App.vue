<template>
  <div class="max-w-lg mx-auto relative">
    <Transition name="page" mode="out-in">
      <RouterView v-if="authStore.ready" :key="route.path" />
      <div v-else class="min-h-screen flex flex-col items-center justify-center gap-4">
        <div class="text-5xl animate-pulse-slow">📚</div>
        <p class="text-zinc-400 text-sm font-medium">Carregando StudyFlow...</p>
      </div>
    </Transition>

    <BottomNav v-if="authStore.ready" />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSubjectsStore } from '@/stores/subjects'
import { useSessionsStore } from '@/stores/sessions'
import { useThemeStore } from '@/stores/theme'
import BottomNav from '@/components/layout/BottomNav.vue'

const route = useRoute()
const authStore = useAuthStore()
const subjectsStore = useSubjectsStore()
const sessionsStore = useSessionsStore()
const themeStore = useThemeStore()

onMounted(async () => {
  themeStore.init()
  await authStore.init()
  await Promise.all([
    subjectsStore.load(),
    sessionsStore.loadToday(),
  ])
})
</script>
