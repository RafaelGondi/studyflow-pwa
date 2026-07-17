<template>
  <nav class="app-tab-bar" aria-label="Navegação principal">
    <div class="app-tab-bar__inner">
      <RouterLink
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        class="app-tab-bar__item tap-scale"
        :class="{ 'app-tab-bar__item--active': isActive(tab.to) }"
      >
        <CuidaIcon :name="tab.icon" :size="22" />
        <span v-if="tab.badge" class="app-tab-bar__dot" aria-label="Timer ativo" />
        <span class="app-tab-bar__label">{{ tab.label }}</span>
      </RouterLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useTimerStore } from '@/stores/timer'
import CuidaIcon from '@/components/ui/CuidaIcon.vue'

const route = useRoute()
const timerStore = useTimerStore()

const tabs = computed(() => [
  { to: '/', icon: 'home-outline', label: 'Início', badge: timerStore.isRunning },
  { to: '/subjects', icon: 'open-book-outline', label: 'Matérias', badge: false },
  { to: '/stats', icon: 'chart-column-outline', label: 'Stats', badge: false },
  { to: '/settings', icon: 'settings-outline', label: 'Ajustes', badge: false },
])

function isActive(path: string) {
  return path === '/' ? route.path === '/' : route.path.startsWith(path)
}
</script>
