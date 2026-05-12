<template>
  <div class="min-h-screen bg-app-bg flex flex-col">
    <header class="px-4 pt-5 pb-4">
      <p class="text-[11px] text-muted font-medium uppercase tracking-widest">Preferências</p>
      <h1 class="text-lg font-bold text-primary">Configurações</h1>
    </header>

    <main class="flex-1 px-4 pb-28 space-y-2">

      <!-- Instalar -->
      <template v-if="isInstallable && !isInstalled">
        <p class="text-[11px] font-semibold text-muted uppercase tracking-wider px-1 pt-2 pb-1">Aplicativo</p>
        <div class="bg-app-card rounded-md overflow-hidden">
          <button
            @click="install()"
            class="w-full flex items-center gap-4 px-4 py-3.5 active:bg-app-elevated transition-colors"
          >
            <div class="w-9 h-9 rounded-sm bg-app-elevated flex items-center justify-center flex-shrink-0">
              <svg class="w-[18px] h-[18px] text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </div>
            <div class="flex-1 text-left">
              <p class="text-sm font-semibold text-primary">Instalar aplicativo</p>
              <p class="text-xs text-muted">Adicionar à tela inicial</p>
            </div>
            <svg class="w-4 h-4 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </template>

      <!-- Aparência -->
      <p class="text-[11px] font-semibold text-muted uppercase tracking-wider px-1 pt-2 pb-1">Aparência</p>

      <div class="bg-app-card rounded-md overflow-hidden">
        <button
          @click="theme.toggle()"
          class="w-full flex items-center gap-4 px-4 py-3.5 active:bg-app-elevated transition-colors"
        >
          <div class="w-9 h-9 rounded-sm bg-app-elevated flex items-center justify-center flex-shrink-0">
            <svg v-if="theme.isDark" class="w-[18px] h-[18px] text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1"  x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
            <svg v-else class="w-[18px] h-[18px] text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          </div>
          <div class="flex-1 text-left">
            <p class="text-sm font-semibold text-primary">Tema</p>
            <p class="text-xs text-muted">{{ theme.isDark ? 'Modo escuro' : 'Modo claro' }}</p>
          </div>
          <div class="w-11 h-6 rounded-full transition-colors flex items-center px-0.5" :class="theme.isDark ? 'bg-blue-500' : 'bg-app-elevated'">
            <div class="w-5 h-5 rounded-full bg-white shadow transition-transform" :class="theme.isDark ? 'translate-x-5' : 'translate-x-0'" />
          </div>
        </button>
      </div>

    </main>
  </div>
</template>

<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'
import { usePwaInstall } from '@/composables/usePwaInstall'

const theme = useThemeStore()
const { isInstallable, isInstalled, install } = usePwaInstall()
</script>
