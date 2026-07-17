<template>
  <Transition name="slide-banner">
    <AkCard
      v-if="hasUpdate && show"
      padding="sm"
      class="update-banner"
    >
      <div class="flex-row" style="gap: var(--space-2); min-width: 0">
        <span>🔄</span>
        <p class="text-sm font-semibold truncate" style="color: var(--accent-contrast)">Nova versão disponível</p>
      </div>
      <div class="flex-row" style="gap: var(--space-2)">
        <AkButton size="sm" variant="secondary" :loading="updating" @click="applyUpdate">
          Atualizar
        </AkButton>
        <AkButton size="sm" variant="ghost" @click="show = false">
          <template #icon>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </template>
        </AkButton>
      </div>
    </AkCard>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { AkButton, AkCard } from '@rafael_dias/akoma'
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
.update-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  max-width: var(--shell-max);
  margin: 0 auto;
  padding-top: calc(var(--safe-top) + var(--space-3));
  background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 60%, var(--fill-strong))) !important;
  border: none !important;
  border-radius: 0 0 var(--card-radius) var(--card-radius) !important;
  color: var(--accent-contrast);
}

.slide-banner-enter-active { transition: transform 0.3s var(--ease-spring); }
.slide-banner-leave-active { transition: transform 0.2s var(--ease-smooth); }
.slide-banner-enter-from,
.slide-banner-leave-to { transform: translateY(-100%); }
</style>
