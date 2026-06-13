<template>
  <Transition name="slide-banner">
    <div
      v-if="hasUpdate && show"
      class="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-3 px-4 py-3 max-w-lg mx-auto"
      style="background: linear-gradient(135deg, var(--accent-color), color-mix(in oklch, var(--accent-color) 60%, black)); box-shadow: 0 4px 20px color-mix(in oklch, var(--accent-color) 50%, transparent)"
    >
      <div class="flex items-center gap-2 min-w-0">
        <span class="text-base flex-shrink-0">🔄</span>
        <p class="text-sm font-semibold text-white truncate">Nova versão disponível</p>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <button
          @click="applyUpdate"
          :disabled="updating"
          class="px-3 py-1.5 rounded-pill bg-white/20 hover:bg-white/30 text-white text-sm font-bold transition-all tap-scale disabled:opacity-60"
        >
          {{ updating ? 'Atualizando…' : 'Atualizar' }}
        </button>
        <button
          @click="show = false"
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
import { ref, onMounted } from 'vue'
import { usePwaUpdate } from '@/composables/usePwaUpdate'

const { hasUpdate, setup, applyUpdate: triggerUpdate } = usePwaUpdate()
const show = ref(true)
const updating = ref(false)

onMounted(setup)

function applyUpdate() {
  updating.value = true
  triggerUpdate()
}
</script>

<style scoped>
.slide-banner-enter-active { transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.slide-banner-leave-active { transition: transform 0.2s ease-in; }
.slide-banner-enter-from, .slide-banner-leave-to { transform: translateY(-100%); }
</style>
