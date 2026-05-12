<template>
  <button
    @click="theme.toggle()"
    class="w-9 h-9 rounded-md flex items-center justify-center transition-all duration-200 active:scale-90"
    :class="theme.isDark
      ? 'bg-app-elevated text-amber-400 hover:bg-app-border'
      : 'bg-app-elevated text-accent hover:bg-app-border'"
    :title="theme.isDark ? 'Mudar para claro' : 'Mudar para escuro'"
  >
    <!-- Sun (light mode icon shown in dark mode) -->
    <svg v-if="theme.isDark" class="w-4.5 h-4.5 w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1"  x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22"   x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1"  y1="12" x2="3"  y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
    <!-- Moon (dark mode icon shown in light mode) -->
    <svg v-else class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  </button>
</template>

<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'
const theme = useThemeStore()
</script>
