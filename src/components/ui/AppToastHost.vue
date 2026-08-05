<script setup lang="ts">
import { AkIcon } from '@rafael_dias/akoma'
import CoinIcon from '@/components/ui/CoinIcon.vue'
import { useAppToast } from '@/composables/useAppToast'

const { toasts, dismiss } = useAppToast()

function icon(color: string) {
  if (color === 'success') return 'check-circle-outline'
  if (color === 'error') return 'alert-outline'
  return 'info-outline'
}
</script>

<template>
  <Teleport to="body">
    <div class="toast-host" aria-live="polite">
      <TransitionGroup name="toast-pop">
        <div
          v-for="item in toasts"
          :key="item.id"
          class="toast-item"
          :class="`toast-item--${item.color}`"
          role="status"
        >
          <CoinIcon v-if="item.color === 'coin'" :size="20" class="toast-item__icon" />
          <AkIcon v-else :name="icon(item.color)" :size="18" class="toast-item__icon" />
          <div class="toast-item__body">
            <span class="toast-item__title">{{ item.title }}</span>
            <p v-if="item.description" class="toast-item__desc">{{ item.description }}</p>
          </div>
          <button
            class="toast-item__close"
            type="button"
            aria-label="Fechar"
            @click="dismiss(item.id)"
          >
            <AkIcon name="x-outline" :size="14" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-host {
  position: fixed;
  bottom: calc(var(--safe-bottom) + var(--nav-height) + var(--space-4));
  inset-inline: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding-inline: var(--space-4);
  z-index: 200;
  pointer-events: none;
}

.toast-item {
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  width: 100%;
  max-width: calc(var(--shell-max) - var(--space-8));
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  background: var(--toast-bg);
  color: var(--toast-fg);
  box-shadow: var(--shadow-md);
}

.toast-item__icon {
  flex-shrink: 0;
  margin-top: 1px;
  opacity: 0.9;
}

.toast-item--success .toast-item__icon { color: #6dba92; }
.toast-item--error   .toast-item__icon { color: #e08880; }
.toast-item--neutral .toast-item__icon { color: var(--toast-fg); opacity: 0.55; }

/* Ganho de moeda: o toast tem que parecer prêmio, não notificação de sistema. */
.toast-item--coin {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--coin-face-lo) 24%, var(--toast-bg)),
    var(--toast-bg) 62%
  );
}

.toast-item--coin .toast-item__title { font-weight: 650; }

.toast-item__body {
  flex: 1;
  min-width: 0;
}

.toast-item__title {
  font-size: var(--text-sm);
  font-weight: 500;
  line-height: 1.4;
}

.toast-item__desc {
  margin-top: 2px;
  font-size: var(--text-xs);
  opacity: 0.7;
}

.toast-item__close {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  margin-top: 1px;
  border: none;
  background: none;
  color: inherit;
  opacity: 0.5;
  cursor: pointer;
  padding: 0;
}
.toast-item__close:hover { opacity: 1; }

.toast-pop-enter-active,
.toast-pop-leave-active {
  transition: opacity 0.2s ease, transform 0.24s var(--ease-out-expo);
}

.toast-pop-enter-from,
.toast-pop-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.97);
}
</style>
