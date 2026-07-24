<template>
  <AkSheet
    :open="show"
    :title="category ? 'Editar categoria' : 'Nova categoria'"
    close-label="Fechar"
    @update:open="(open) => { if (!open) emit('close') }"
  >
    <div class="modal-body">
      <form id="category-form" class="stack" @submit.prevent="handleSubmit">
        <AkInput
          v-model="form.name"
          label="Nome"
          placeholder="Ex: Exatas, Humanas..."
          required
        />

        <div class="form-field">
          <label class="form-label">Cor</label>
          <div class="color-grid">
            <button
              v-for="c in SUBJECT_COLORS"
              :key="c.value"
              type="button"
              class="color-swatch"
              :class="{ 'color-swatch--active': form.color === c.value }"
              :style="{ background: c.value }"
              @click="form.color = c.value"
            >
              <svg
                v-if="form.color === c.value"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
                class="color-swatch__check"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          </div>
        </div>

        <AkButton
          type="submit"
          form="category-form"
          variant="primary"
          size="lg"
          block
          :loading="saving"
          :disabled="!form.name.trim()"
        >
          {{ category ? 'Salvar' : 'Criar categoria' }}
        </AkButton>
      </form>
    </div>
  </AkSheet>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { AkButton, AkInput, AkSheet } from '@rafael_dias/akoma'
import { useSubjectsStore } from '@/stores/subjects'
import { useAppToast } from '@/composables/useAppToast'
import { SUBJECT_COLORS } from '@/types'
import { DEFAULT_SUBJECT_COLOR } from '@/utils/colors'
import type { Category } from '@/types'

const props = defineProps<{ show: boolean; category?: Category | null }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const subjectsStore = useSubjectsStore()
const toast = useAppToast()
const saving = ref(false)
const form = ref<{ name: string; color: string }>({ name: '', color: DEFAULT_SUBJECT_COLOR })

watch(() => props.show, (val) => {
  if (val) {
    form.value = props.category
      ? { name: props.category.name, color: props.category.color }
      : { name: '', color: DEFAULT_SUBJECT_COLOR }
  }
})

async function handleSubmit() {
  if (!form.value.name.trim()) return
  saving.value = true
  try {
    if (props.category) {
      await subjectsStore.updateCategory(props.category.id, form.value)
      toast.success('Categoria atualizada')
    } else {
      await subjectsStore.addCategory(form.value)
      toast.success('Categoria criada')
    }
    emit('saved')
    emit('close')
  } finally {
    saving.value = false
  }
}
</script>
