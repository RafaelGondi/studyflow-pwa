<template>
  <AkTabBar v-model="activeTab">
    <AkTabBarItem value="/" label="Estudar">
      <template #icon>
        <span class="tab-icon-wrap">
          <AkIcon name="play-outline" :size="20" />
          <span v-if="timerStore.isRunning" class="tab-badge" aria-label="Timer ativo" />
        </span>
      </template>
    </AkTabBarItem>
    <AkTabBarItem value="/subjects" label="Matérias" icon="open-book-outline" />
    <AkTabBarItem value="/stats" label="Progresso" icon="chart-column-outline" />
    <AkTabBarItem value="/settings" label="Ajustes" icon="settings-outline" />
  </AkTabBar>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AkIcon, AkTabBar, AkTabBarItem } from '@rafael_dias/akoma'
import { useTimerStore } from '@/stores/timer'

const route = useRoute()
const router = useRouter()
const timerStore = useTimerStore()

const TAB_PATHS = ['/', '/subjects', '/stats', '/settings'] as const

function pathToTab(path: string): string {
  if (path === '/') return '/'
  const match = TAB_PATHS.find(tab => tab !== '/' && path.startsWith(tab))
  return match ?? '/'
}

const activeTab = computed({
  get: () => pathToTab(route.path),
  set: (value: string) => {
    if (pathToTab(route.path) !== value) router.push(value)
  },
})
</script>
