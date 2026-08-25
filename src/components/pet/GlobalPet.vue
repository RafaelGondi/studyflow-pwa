<template>
  <Transition name="global-pet">
    <div v-if="visible" class="global-pet">
      <button type="button" class="global-pet__button" :aria-label="ariaLabel" @click="router.push('/rewards/pet')">
        <span v-if="attentionMessage" class="global-pet__bubble">{{ attentionMessage }}</span>
        <PixelPet :mood="pet.mood" :name="pet.name" :mood-label="pet.moodLabel" :size="74" />
        <span v-if="pet.isAway || pet.missedDays > 0" class="global-pet__alert" aria-hidden="true">!</span>
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PixelPet from './PixelPet.vue'
import { usePetStore } from '@/stores/pet'

const route = useRoute()
const router = useRouter()
const pet = usePetStore()

const visible = computed(() => route.path !== '/rewards/pet')
const attentionMessage = computed(() => {
  if (pet.isAway) return 'Complete 1h para eu voltar'
  if (pet.missedDays > 0) return 'Estou com fome'
  if (pet.streakAtRisk) return 'Nossa sequência está em risco'
  return ''
})
const ariaLabel = computed(() => attentionMessage.value
  ? `${pet.name}: ${attentionMessage.value}. Abrir cuidados.`
  : `${pet.name}, ${pet.moodLabel.toLowerCase()}. Abrir cuidados.`)
</script>

<style scoped>
.global-pet {
  position: fixed;
  z-index: 35;
  left: max(var(--space-2), calc((100vw - var(--shell-max)) / 2 + var(--space-2)));
  bottom: calc(var(--nav-height) + var(--safe-bottom) + 2px);
  width: 78px;
  height: 78px;
  pointer-events: none;
}

.global-pet__button {
  position: relative;
  display: grid;
  place-items: center;
  width: 78px;
  height: 78px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text);
  cursor: pointer;
  pointer-events: auto;
  -webkit-tap-highlight-color: transparent;
}

.global-pet__button:focus-visible {
  border-radius: var(--radius-full);
  outline: 2px solid var(--accent);
  outline-offset: -4px;
}

.global-pet__bubble {
  position: absolute;
  z-index: 5;
  left: 58px;
  bottom: 48px;
  width: max-content;
  max-width: min(210px, calc(100vw - 92px));
  padding: 7px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md) var(--radius-md) var(--radius-md) 3px;
  background: color-mix(in srgb, var(--bg-elevated) 94%, transparent);
  box-shadow: var(--shadow-sm);
  color: var(--text-secondary);
  font-size: var(--text-xs);
  font-weight: 650;
  line-height: 1.25;
  backdrop-filter: blur(12px);
  animation: bubble-in .35s var(--ease-out-expo) both;
}

.global-pet__alert {
  position: absolute;
  z-index: 6;
  top: 5px;
  right: 5px;
  display: grid;
  place-items: center;
  width: 19px;
  height: 19px;
  border: 2px solid var(--bg);
  border-radius: 50%;
  background: #d85f58;
  color: #fff;
  font-size: 11px;
  font-weight: 800;
}

.global-pet-enter-active, .global-pet-leave-active { transition: opacity .2s, transform .28s var(--ease-out-expo); }
.global-pet-enter-from, .global-pet-leave-to { opacity: 0; transform: translateY(12px) scale(.88); }

@keyframes bubble-in {
  from { opacity: 0; transform: translate(-5px, 4px) scale(.96); }
}

@media (prefers-reduced-motion: reduce) {
  .global-pet-enter-active, .global-pet-leave-active { transition: none; }
  .global-pet__bubble { animation: none; }
}
</style>
