<template>
  <Transition name="slide-banner">
    <div
      v-if="hasUpdate && show"
      class="update-banner"
      role="status"
    >
      <p class="update-banner__text">Nova versão disponível</p>
      <div class="update-banner__actions">
        <AkButton size="sm" variant="primary" :loading="updating" @click="applyUpdate">
          Atualizar
        </AkButton>
        <AkIconButton
          size="sm"
          variant="ghost"
          label="Dispensar"
          icon="x-outline"
          @click="show = false"
        />
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { AkButton, AkIconButton } from '@rafael_dias/akoma'
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
  padding:
    calc(var(--safe-top) + var(--space-3))
    var(--page-pad-x)
    var(--space-3);
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border);
}

.update-banner__text {
  font-size: 14px;
  font-weight: 650;
  color: var(--text);
  min-width: 0;
}

.update-banner__actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
}

.slide-banner-enter-active { transition: transform 0.3s var(--ease-out-expo); }
.slide-banner-leave-active { transition: transform 0.2s var(--ease-smooth); }
.slide-banner-enter-from,
.slide-banner-leave-to { transform: translateY(-100%); }
</style>
