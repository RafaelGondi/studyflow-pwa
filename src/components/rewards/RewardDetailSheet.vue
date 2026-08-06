<template>
  <!--
    Folha de detalhe. Editar, arquivar e excluir moram aqui porque são ações de
    uma vez na vida da recompensa — na lista, com o mesmo peso do resgate, elas
    enterravam a única coisa que a pessoa vem fazer.
  -->
  <AkSheet
    :open="!!reward"
    :title="reward?.name ?? ''"
    close-label="Fechar"
    @update:open="(open) => { if (!open) emit('close') }"
  >
    <div v-if="reward" class="modal-body detail">
      <div class="detail__head">
        <div class="detail__icon" :style="{ background: iconTint }">{{ reward.icon }}</div>
        <div class="detail__id">
          <p v-if="reward.description" class="detail__desc">{{ reward.description }}</p>
          <p class="detail__cost">
            <CoinIcon :size="14" />
            <strong class="numeric">{{ formatCoins(reward.cost) }}</strong>
            <span>· {{ coinsAsStudyTime(reward.cost, coinsPerHour) }} de estudo</span>
          </p>
        </div>
      </div>

      <div class="detail__bar" aria-hidden="true">
        <span :style="{ width: `${progress}%` }" />
      </div>
      <p class="detail__status" :class="{ 'detail__status--ready': ready }">
        <AkIcon v-if="ready" name="check-outline" :size="13" />
        {{ status }}
      </p>

      <AkButton
        v-if="!reward.archivedAt"
        variant="primary"
        size="lg"
        block
        class="detail__redeem"
        :disabled="!ready"
        @click="emit('redeem', reward)"
      >
        {{ ready ? `Resgatar por ${formatCoins(reward.cost)}` : 'Ainda não dá' }}
      </AkButton>

      <div class="detail__manage">
        <button type="button" @click="emit('edit', reward)">Editar</button>
        <button type="button" @click="emit('archive', reward)">
          {{ reward.archivedAt ? 'Restaurar' : 'Arquivar' }}
        </button>
        <button type="button" class="detail__danger" @click="emit('remove', reward)">Excluir</button>
      </div>
    </div>
  </AkSheet>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AkButton, AkIcon, AkSheet } from '@rafael_dias/akoma'
import CoinIcon from '@/components/ui/CoinIcon.vue'
import { coinsAsStudyTime, formatCoins } from '@/utils/coins'
import type { Reward } from '@/types'

const props = defineProps<{
  reward: Reward | null
  balance: number
  coinsPerHour: number
  ready: boolean
  claimed: boolean
}>()

const emit = defineEmits<{
  close: []
  redeem: [reward: Reward]
  edit: [reward: Reward]
  archive: [reward: Reward]
  remove: [reward: Reward]
}>()

const iconTint = computed(() =>
  `color-mix(in srgb, ${props.reward?.color ?? 'var(--accent)'} 16%, var(--bg-soft))`,
)

const progress = computed(() => {
  if (!props.reward || props.reward.cost <= 0) return 100
  if (props.claimed) return 100
  return Math.min(100, Math.max(0, (props.balance / props.reward.cost) * 100))
})

const status = computed(() => {
  if (!props.reward) return ''
  if (props.reward.archivedAt) return 'Arquivada — restaure para resgatar'
  if (props.claimed) return 'Já resgatada'
  if (props.ready) return 'Pronta para resgatar'
  const missing = Math.max(0, props.reward.cost - props.balance)
  return `Faltam ${formatCoins(missing)} · ≈ ${coinsAsStudyTime(missing, props.coinsPerHour)} de estudo`
})
</script>

<style scoped>
.detail__head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.detail__icon {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  font-size: 26px;
}

.detail__id { min-width: 0; }

.detail__desc {
  margin: 0 0 3px;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: 1.4;
}

.detail__cost {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 0;
  color: var(--text);
  font-size: var(--text-md);
}

.detail__cost span {
  color: var(--text-secondary);
  font-size: var(--text-xs);
  font-weight: 400;
}

.detail__bar {
  height: 7px;
  margin-top: var(--space-5);
  overflow: hidden;
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--text) 8%, transparent);
}

.detail__bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--coin-face-lo), var(--coin-face-hi));
  transition: width 0.6s var(--ease-out-expo);
}

.detail__status {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: var(--space-2) 0 0;
  color: var(--text-secondary);
  font-size: var(--text-xs);
}

.detail__status--ready {
  color: var(--coin-text);
  font-weight: 500;
}

.detail__redeem { margin-top: var(--space-5); }

.detail__manage {
  display: flex;
  gap: var(--space-1);
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border);
}

.detail__manage button {
  flex: 1;
  padding: var(--space-2) var(--space-1);
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  font: inherit;
  font-size: var(--text-xs);
  cursor: pointer;
  transition: background 0.16s var(--ease-smooth);
}

.detail__manage button:hover {
  background: var(--bg-soft);
  color: var(--text);
}

.detail__manage button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}

.detail__danger:hover { color: var(--danger); }

@media (prefers-reduced-motion: reduce) {
  .detail__bar span { transition: none; }
}
</style>
