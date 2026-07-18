<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay">
        <div class="modal-backdrop" @click="emit('close')" />
        <div class="modal-sheet modal-form">
          <div class="modal-handle" aria-hidden="true" />
          <div class="modal-header">
            <h2 class="modal-title">{{ category ? 'Editar categoria' : 'Nova categoria' }}</h2>
            <AkIconButton label="Fechar" size="sm" icon="x-outline" @click="emit('close')" />
          </div>

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
                    @click="form.color = c.value"
                    class="color-swatch"
                    :class="{ 'color-swatch--active': form.color === c.value }"
                    :style="{ background: c.value }"
                  >
                    <svg v-if="form.color === c.value" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" style="width:14px;height:14px;color:var(--accent-contrast)">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div class="modal-footer">
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
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { AkButton, AkIconButton, AkInput } from '@rafael_dias/akoma'
import { useSubjectsStore } from '@/stores/subjects'
import { SUBJECT_COLORS } from '@/types'
import type { Category } from '@/types'

const props = defineProps<{ show: boolean; category?: Category | null }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const subjectsStore = useSubjectsStore()
const saving = ref(false)
const form = ref<{ name: string; color: string }>({ name: '', color: SUBJECT_COLORS[0].value })

watch(() => props.show, (val) => {
  if (val) {
    form.value = props.category
      ? { name: props.category.name, color: props.category.color }
      : { name: '', color: SUBJECT_COLORS[0].value }
  }
})

async function handleSubmit() {
  if (!form.value.name.trim()) return
  saving.value = true
  try {
    if (props.category) await subjectsStore.updateCategory(props.category.id, form.value)
    else await subjectsStore.addCategory(form.value)
    emit('saved')
    emit('close')
  } finally {
    saving.value = false
  }
}
</script>
