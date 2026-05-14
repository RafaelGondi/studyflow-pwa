<template>
  <div class="max-w-lg mx-auto relative">
    <UpdateBanner />
    <Transition name="page" mode="out-in">
      <RouterView v-if="appReady" :key="route.path" />
      <div v-else class="min-h-screen flex flex-col items-center justify-center gap-4">
        <div class="text-5xl animate-pulse-slow">📚</div>
        <p class="text-faint text-sm font-medium">Carregando StudyFlow...</p>
      </div>
    </Transition>

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
import BottomNav from '@/components/layout/BottomNav.vue'
import UpdateBanner from '@/components/ui/UpdateBanner.vue'

const route = useRoute()
const authStore = useAuthStore()
const subjectsStore = useSubjectsStore()
const sessionsStore = useSessionsStore()
const themeStore = useThemeStore()

// Só mostra a UI quando auth + subjects + sessions estão prontos
const appReady = ref(false)

// Recarrega todos os dados quando o UID muda (ex.: login com Google)
watch(() => authStore.uid, (newUid, oldUid) => {
  if (newUid && oldUid && newUid !== oldUid) {
    subjectsStore.load()
    sessionsStore.loadToday()
  }
})

onMounted(async () => {
  themeStore.init()
  await authStore.init()
  await Promise.all([
    subjectsStore.load(),
    sessionsStore.loadToday(),
  ])
  appReady.value = true
})
</script>
