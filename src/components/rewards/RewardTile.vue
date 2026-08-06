<template>
  <!--
    Ficha da vitrine. Uma linha, 64px — contra os ~140px do card antigo, que
    carregava descrição, barra de largura inteira, status e quatro botões.
    Tudo que não ajuda a escolher saiu; resgatar e administrar vivem na folha.
  -->
  <button
    type="button"
    class="tile"
    :class="{ 'tile--ready': ready, 'tile--claimed': claimed, 'tile--archived': !!reward.archivedAt }"
    :style="{ '--reward-color': reward.color }"
    @click="emit('open', reward)"
  >
    <!--
      O anel troca a barra: cabe em 40px em vez de uma faixa inteira mais uma
      linha de texto, e mantém o quanto-falta colado no que falta.
    -->
    <span class="tile__ring">
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <circle class="tile__track" cx="20" cy="20" r="17" />
        <circle
          class="tile__fill"
          cx="20" cy="20" r="17"
          :stroke-dasharray="CIRC"
          :stroke-dashoffset="CIRC - CIRC * progress / 100"
        />
      </svg>
      <span class="tile__icon">{{ reward.icon }}</span>
    </span>

    <span class="tile__id">
      <span class="tile__name">{{ reward.name }}</span>
      <span class="tile__sub">
        <CoinIcon :size="11" />
        {{ subtitle }}
      </span>
    </span>

    <AkIcon name="arrow-right-outline" :size="16" class="tile__chevron" />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AkIcon } from '@rafael_dias/akoma'
import CoinIcon from '@/components/ui/CoinIcon.vue'
import { coinsAsStudyTime, formatCoins } from '@/utils/coins'
import type { Reward } from '@/types'

const props = defineProps<{
  reward: Reward
  balance: number
  coinsPerHour: number
  ready: boolean
  claimed: boolean
}>()

const emit = defineEmits<{ open: [reward: Reward] }>()

const CIRC = 2 * Math.PI * 17

const missing = computed(() => Math.max(0, props.reward.cost - props.balance))

const progress = computed(() => {
  if (props.claimed || props.ready) return 100
  if (props.reward.cost <= 0) return 100
  return Math.min(100, Math.max(0, (props.balance / props.reward.cost) * 100))
})

const subtitle = computed(() => {
  if (props.reward.archivedAt) return `${formatCoins(props.reward.cost)} · arquivada`
  if (props.claimed) return `${formatCoins(props.reward.cost)} · já resgatada`
  if (props.ready) return `${formatCoins(props.reward.cost)} · pronta`
  return `faltam ${formatCoins(missing.value)} · ${coinsAsStudyTime(missing.value, props.coinsPerHour)} de estudo`
})
</script>

<style scoped>
.tile {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--bg-elevated);
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.16s var(--ease-out-expo),
    border-color 0.3s var(--ease-smooth);
}

.tile:active { transform: scale(0.975); }

.tile:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.tile--ready { border-color: color-mix(in srgb, var(--coin-face-lo) 52%, transparent); }
.tile--claimed,
.tile--archived { opacity: 0.55; }

.tile__ring {
  position: relative;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.tile__ring svg {
  position: absolute;
  inset: 0;
  transform: rotate(-90deg);
}

.tile__track {
  fill: none;
  stroke: color-mix(in srgb, var(--text) 10%, transparent);
  stroke-width: 3;
}

.tile__fill {
  fill: none;
  stroke: var(--coin-face-lo);
  stroke-width: 3;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.7s var(--ease-out-expo);
}

.tile__icon {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 17px;
}

.tile__id {
  flex: 1;
  min-width: 0;
}

.tile__name {
  display: block;
  overflow: hidden;
  color: var(--text);
  font-size: var(--text-md);
  font-weight: 500;
  letter-spacing: -0.01em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tile__sub {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
  color: var(--text-secondary);
  font-size: var(--text-2xs);
  white-space: nowrap;
}

.tile--ready .tile__sub {
  color: var(--coin-text);
  font-weight: 500;
}

.tile__chevron {
  flex-shrink: 0;
  color: var(--text-tertiary);
}

@media (prefers-reduced-motion: reduce) {
  .tile__fill { transition: none; }
}
</style>
