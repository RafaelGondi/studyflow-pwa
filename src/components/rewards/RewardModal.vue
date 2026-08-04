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
import { SUBJECT_COLORS } from '@/types'
import { DEFAULT_SUBJECT_COLOR, normalizeAkomaColor } from '@/utils/colors'
import type { Reward } from '@/types'

const REWARD_ICONS = ['🍫', '🎮', '📚', '☕', '🎬', '🍕', '🎁', '🛍️', '🎧', '🍰', '🎟️', '✨']

const props = defineProps<{ show: boolean; reward?: Reward | null }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const gamification = useGamificationStore()
const toast = useAppToast()
const saving = ref(false)
const form = ref({
  name: '',
  description: '',
  cost: 100,
  icon: REWARD_ICONS[0],
  color: DEFAULT_SUBJECT_COLOR,
  repeatable: true,
})

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
    : {
        name: '',
        description: '',
        cost: 100,
        icon: REWARD_ICONS[0],
        color: DEFAULT_SUBJECT_COLOR,
        repeatable: true,
      }
})

async function handleSubmit() {
  if (!canSubmit.value) return
  saving.value = true
  try {
    const payload = {
      name: form.value.name.trim(),
      description: form.value.description.trim() || undefined,
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
  background: var(--surface);
  font-size: 22px;
}

.reward-icon-pick--active {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, var(--surface));
}
</style>
