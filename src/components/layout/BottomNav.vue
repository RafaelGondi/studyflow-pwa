<template>
  <nav class="fixed bottom-0 left-0 right-0 z-50 bg-app-card border-t border-app-border pb-safe">
    <div class="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
      <RouterLink
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        class="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 group"
        :class="isActive(tab.to) ? 'text-violet-500' : 'text-muted hover:text-secondary'"
      >
        <div
          class="relative flex items-center justify-center w-10 h-8 rounded-xl transition-all duration-200"
          :class="isActive(tab.to) ? 'bg-violet-500/15' : 'group-hover:bg-app-elevated'"
        >
          <component :is="tab.icon" class="w-5 h-5" :stroke-width="isActive(tab.to) ? 2.5 : 1.8" />
          <span
            v-if="tab.badge"
            class="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] px-1 flex items-center justify-center rounded-full bg-violet-500 text-white text-[10px] font-semibold"
          >
            {{ tab.badge }}
          </span>
        </div>
        <span class="text-[10px] font-medium tracking-wide">{{ tab.label }}</span>
      </RouterLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useTimerStore } from '@/stores/timer'
import HomeIcon from './icons/HomeIcon.vue'
import BookIcon from './icons/BookIcon.vue'
import ChartIcon from './icons/ChartIcon.vue'

const route = useRoute()
const timerStore = useTimerStore()

const tabs = computed(() => [
  { to: '/',         label: 'Início',    icon: HomeIcon,  badge: timerStore.isRunning ? '●' : null },
  { to: '/subjects', label: 'Matérias',  icon: BookIcon,  badge: null },
  { to: '/stats',    label: 'Estatísticas', icon: ChartIcon, badge: null },
])

function isActive(path: string) {
  return path === '/' ? route.path === '/' : route.path.startsWith(path)
}
</script>
