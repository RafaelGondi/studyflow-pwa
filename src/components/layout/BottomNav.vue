<template>
  <nav class="nav" aria-label="Navegação principal">
    <div class="nav__inner" :style="{ '--tab-count': tabs.length }">
      <div
        v-if="activeIndex >= 0"
        class="nav__indicator"
        :style="{ transform: `translateX(${activeIndex * 100}%)` }"
        aria-hidden="true"
      />
      <RouterLink
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        class="nav__tab tap-scale"
        :class="{ 'nav__tab--active': isActive(tab.to) }"
      >
        <div class="nav__icon-wrap">
          <component
            :is="tab.icon"
            class="nav__svg"
            :stroke-width="isActive(tab.to) ? 2.5 : 1.8"
          />
          <span
            v-if="tab.badge"
            class="nav__badge"
            aria-label="Timer ativo"
          >
            {{ tab.badge }}
          </span>
        </div>
        <span class="nav__label">{{ tab.label }}</span>
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
import SettingsIcon from './icons/SettingsIcon.vue'

const route = useRoute()
const timerStore = useTimerStore()

const tabs = computed(() => [
  { to: '/', label: 'Início', icon: HomeIcon, badge: timerStore.isRunning ? '●' : null },
  { to: '/subjects', label: 'Matérias', icon: BookIcon, badge: null },
  { to: '/stats', label: 'Stats', icon: ChartIcon, badge: null },
  { to: '/settings', label: 'Ajustes', icon: SettingsIcon, badge: null },
])

const activeIndex = computed(() => tabs.value.findIndex((t) => isActive(t.to)))

function isActive(path: string) {
  return path === '/' ? route.path === '/' : route.path.startsWith(path)
}
</script>

<style scoped>
.nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 0 16px calc(14px + var(--safe-bottom));
  pointer-events: none;
}

.nav__inner {
  position: relative;
  display: flex;
  justify-content: space-around;
  max-width: 440px;
  margin: 0 auto;
  padding: 6px;
  background: var(--nav-glass);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-nav);
  pointer-events: auto;
}

.nav__indicator {
  position: absolute;
  top: 6px;
  left: 6px;
  width: calc((100% - 12px) / var(--tab-count, 4));
  height: calc(100% - 12px);
  background: var(--accent-soft);
  border-radius: var(--radius-full);
  transition: transform 0.38s var(--ease-spring);
  z-index: 0;
}

.nav__tab {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 4px;
  border-radius: var(--radius-full);
  color: var(--text-tertiary);
  transition: color 0.25s var(--ease-smooth);
  min-width: 0;
}

.nav__tab--active {
  color: var(--accent);
}

.nav__icon-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 24px;
}

.nav__svg {
  width: 20px;
  height: 20px;
}

.nav__badge {
  position: absolute;
  top: -4px;
  right: -6px;
  min-width: 14px;
  height: 14px;
  padding: 0 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  background: var(--accent);
  color: #fff;
  font-size: 8px;
  font-weight: 700;
}

.nav__label {
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
}

@media (hover: none) and (pointer: coarse) {
  .nav {
    background: linear-gradient(
      180deg,
      transparent 0%,
      color-mix(in srgb, var(--bg) 88%, transparent) 28%,
      var(--bg) 62%
    );
  }

  .nav__inner {
    background: var(--bg-elevated);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    border-color: var(--border-strong);
    box-shadow: var(--shadow-nav), 0 4px 24px color-mix(in srgb, var(--text) 8%, transparent);
  }
}
</style>
