<template>
  <Transition name="slide-banner">
    <div
      v-if="needRefresh"
      class="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-3 px-4 py-3 max-w-lg mx-auto"
      style="background: linear-gradient(135deg, #8b5cf6, #6366f1); box-shadow: 0 4px 20px #8b5cf650"
    >
      <div class="flex items-center gap-2 min-w-0">
        <span class="text-base flex-shrink-0">🔄</span>
        <p class="text-sm font-semibold text-white truncate">Nova versão disponível</p>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <button
          @click="updateServiceWorker(true)"
          class="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm font-bold transition-all active:scale-95"
        >
          Atualizar
        </button>
        <button
          @click="close"
          class="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'

const { needRefresh, updateServiceWorker } = useRegisterSW()

function close() {
  needRefresh.value = false
}
</script>

<style scoped>
.slide-banner-enter-active { transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.slide-banner-leave-active { transition: transform 0.2s ease-in; }
.slide-banner-enter-from, .slide-banner-leave-to { transform: translateY(-100%); }
</style>
