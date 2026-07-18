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
                    <svg v-if="form.color === c.value" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" style="width:14px;height:14px">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </button>
                </div>
                <div class="color-custom-row">
                  <label
                    class="color-swatch color-swatch--custom"
                    :class="{ 'color-swatch--active': isCustomColor }"
                    :style="isCustomColor ? { background: form.color } : undefined"
                    title="Cor personalizada"
                  >
                    <input type="color" :value="form.color" @input="onCustomColor" />
                    <svg v-if="!isCustomColor" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;color:var(--text-tertiary)">
                      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
                    </svg>
                  </label>
                  <span class="color-custom-row__label">{{ isCustomColor ? form.color : 'Cor personalizada' }}</span>
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
import { ref, computed, watch } from 'vue'
import { AkButton, AkIconButton, AkInput } from '@rafael_dias/akoma'
import { useSubjectsStore } from '@/stores/subjects'
import { SUBJECT_COLORS } from '@/types'
import type { Category } from '@/types'

const PRESET_VALUES = new Set(SUBJECT_COLORS.map(c => c.value))

const props = defineProps<{ show: boolean; category?: Category | null }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const subjectsStore = useSubjectsStore()
const saving = ref(false)
const form = ref({ name: '', color: SUBJECT_COLORS[0].value })

const isCustomColor = computed(() => !PRESET_VALUES.has(form.value.color))

function onCustomColor(e: Event) {
  form.value.color = (e.target as HTMLInputElement).value
}

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
