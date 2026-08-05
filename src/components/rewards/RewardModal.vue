<template>
  <AkSheet
    :open="show"
    :title="reward ? 'Editar recompensa' : 'Nova recompensa'"
    close-label="Fechar"
    @update:open="(open) => { if (!open) emit('close') }"
  >
    <div class="modal-body">
      <form id="reward-form" class="stack" @submit.prevent="handleSubmit">
        <AkInput
          v-model="form.name"
          label="Nome"
          placeholder="Ex: Chocolate favorito"
          required
        />

        <AkTextarea
          v-model="form.description"
          label="Descrição"
          placeholder="Opcional"
          :rows="3"
        />

        <!--
          Precificar do zero é a parte difícil de cadastrar uma recompensa:
          "quanto vale um cinema?" não tem resposta em moedas. As faixas dão um
          ponto de partida em horas de estudo, que é uma unidade que a pessoa
          conhece, e o custo sai daí.
        -->
        <div class="form-field">
          <label class="form-label">Faixa</label>
          <div class="tier-row">
            <button
              v-for="tier in REWARD_TIERS"
              :key="tier.id"
              type="button"
              class="tier-chip"
              :class="{ 'tier-chip--active': currentTier.id === tier.id }"
              :aria-pressed="currentTier.id === tier.id"
              @click="applyTier(tier)"
            >
              <span class="tier-chip__label">{{ tier.label }}</span>
              <span class="tier-chip__hours">{{ tier.suggestedHours }}h</span>
            </button>
          </div>
          <p class="tier-hint">{{ currentTier.hint }}</p>
        </div>

        <div class="ak-field">
          <label class="ak-field__label" for="reward-cost">Custo em moedas</label>
          <input
            id="reward-cost"
            v-model.number="form.cost"
            type="number"
            min="1"
            max="1000000"
            step="1"
            required
            class="ak-field__control ak-field__control--md"
          />
          <p class="cost-translation">
            <CoinIcon :size="13" />
            ≈ {{ costAsTime }} de estudo · faixa {{ currentTier.label.toLowerCase() }}
          </p>
        </div>

        <div class="form-field">
          <label class="form-label">Ícone</label>
          <div class="reward-icon-grid">
            <button
              v-for="icon in REWARD_ICONS"
              :key="icon"
              type="button"
              class="reward-icon-pick"
              :class="{ 'reward-icon-pick--active': form.icon === icon }"
              :aria-label="`Usar ${icon}`"
              @click="form.icon = icon"
            >
              {{ icon }}
            </button>
          </div>
        </div>

        <div class="form-field">
          <label class="form-label">Cor</label>
          <div class="color-grid">
            <button
              v-for="color in SUBJECT_COLORS"
              :key="color.value"
              type="button"
              class="color-swatch"
              :class="{ 'color-swatch--active': form.color === color.value }"
              :style="{ background: color.value }"
              :aria-label="color.name"
              @click="form.color = color.value"
            />
          </div>
        </div>

        <AkSwitch
          :model-value="form.repeatable"
          label="Pode ser resgatada novamente"
          description="Desative para recompensas compradas apenas uma vez"
          @update:model-value="form.repeatable = $event"
        />

        <AkButton
          type="submit"
          form="reward-form"
          variant="primary"
          size="lg"
          block
          :loading="saving"
          :disabled="!canSubmit"
        >
          {{ reward ? 'Salvar' : 'Criar recompensa' }}
        </AkButton>
      </form>
    </div>
  </AkSheet>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { AkButton, AkInput, AkSheet, AkSwitch, AkTextarea } from '@rafael_dias/akoma'
import { useGamificationStore } from '@/stores/gamification'
import { useAppToast } from '@/composables/useAppToast'
import CoinIcon from '@/components/ui/CoinIcon.vue'
import { SUBJECT_COLORS } from '@/types'
import { DEFAULT_SUBJECT_COLOR, normalizeAkomaColor } from '@/utils/colors'
import {
  REWARD_TIERS, coinsAsStudyTime, suggestedCost, tierForCost, type RewardTier,
} from '@/utils/coins'
import type { Reward } from '@/types'

const REWARD_ICONS = ['🍫', '🎮', '📚', '☕', '🎬', '🍕', '🎁', '🛍️', '🎧', '🍰', '🎟️', '✨']

const props = defineProps<{ show: boolean; reward?: Reward | null }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const gamification = useGamificationStore()
const toast = useAppToast()
const saving = ref(false)

/* Custo inicial na faixa diária, derivado da taxa — um 100 fixo cairia numa
   faixa diferente para cada pessoa. */
function emptyForm() {
  return {
    name: '',
    description: '',
    cost: suggestedCost(REWARD_TIERS[0], gamification.settings.coinsPerHour),
    icon: REWARD_ICONS[0],
    color: DEFAULT_SUBJECT_COLOR,
    repeatable: true,
  }
}

const form = ref(emptyForm())

const rate = computed(() => gamification.settings.coinsPerHour)

/* A faixa não é um campo salvo — é lida do custo, então continua verdadeira
   mesmo se o custo for digitado à mão ou a taxa mudar depois. */
const currentTier = computed(() => tierForCost(form.value.cost, rate.value))
const costAsTime = computed(() => coinsAsStudyTime(form.value.cost, rate.value))

function applyTier(tier: RewardTier) {
  form.value.cost = suggestedCost(tier, rate.value)
}

const canSubmit = computed(() =>
  !!form.value.name.trim()
  && Number.isFinite(form.value.cost)
  && form.value.cost >= 1,
)

watch(() => props.show, (show) => {
  if (!show) return
  form.value = props.reward
    ? {
        name: props.reward.name,
        description: props.reward.description ?? '',
        cost: props.reward.cost,
        icon: props.reward.icon,
        color: normalizeAkomaColor(props.reward.color),
        repeatable: props.reward.repeatable,
      }
    : emptyForm()
})

async function handleSubmit() {
  if (!canSubmit.value) return
  saving.value = true
  try {
    const payload = {
      name: form.value.name.trim(),
      description: form.value.description.trim(),
      cost: Math.max(1, Math.round(form.value.cost)),
      icon: form.value.icon,
      color: normalizeAkomaColor(form.value.color),
      repeatable: form.value.repeatable,
      archivedAt: props.reward?.archivedAt ?? null,
    }
    if (props.reward) {
      await gamification.updateReward(props.reward.id, payload)
      toast.success('Recompensa atualizada')
    } else {
      await gamification.addReward(payload)
      toast.success('Recompensa criada')
    }
    emit('saved')
    emit('close')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.tier-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-2);
}

.tier-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: var(--space-2) 4px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-elevated);
  color: var(--text-secondary);
  font: inherit;
  cursor: pointer;
  transition: transform 0.14s var(--ease-out-expo), border-color 0.14s var(--ease-smooth);
}

.tier-chip:active { transform: scale(0.95); }

.tier-chip--active {
  border-color: color-mix(in srgb, var(--coin-face-lo) 55%, transparent);
  background: var(--coin-soft);
  color: var(--coin-text);
}

.tier-chip__label {
  font-size: var(--text-xs);
  font-weight: 500;
}

.tier-chip__hours {
  font-size: var(--text-2xs);
  opacity: 0.7;
}

.tier-hint {
  margin-top: var(--space-2);
  color: var(--text-secondary);
  font-size: var(--text-xs);
}

.cost-translation {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: var(--space-2);
  color: var(--text-secondary);
  font-size: var(--text-xs);
}

.reward-icon-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: var(--space-2);
}

.reward-icon-pick {
  display: grid;
  place-items: center;
  min-height: 44px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-elevated);
  font-size: 22px;
  transition: transform 0.14s var(--ease-out-expo), border-color 0.14s var(--ease-smooth);
}

.reward-icon-pick:active { transform: scale(0.92); }

.reward-icon-pick--active {
  border-color: var(--accent);
  background: var(--accent-soft);
}
</style>
