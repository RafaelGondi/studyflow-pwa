<template>
  <AkSheet
    :open="show"
    :title="subject ? 'Editar matéria' : 'Nova matéria'"
    close-label="Fechar"
    @update:open="(open) => { if (!open) emit('close') }"
  >
    <div class="modal-body">
      <form id="subject-form" class="stack" @submit.prevent="handleSubmit">
        <div class="form-field">
          <label class="form-label">Ícone</label>
          <div class="icon-grid">
            <button
              v-for="icon in SUBJECT_ICONS"
              :key="icon"
              type="button"
              class="icon-pick"
              :class="{ 'icon-pick--active': form.icon === icon }"
              @click="form.icon = icon"
            >
              {{ icon }}
            </button>
          </div>
        </div>

        <AkInput v-model="form.name" label="Nome" placeholder="Ex: Matemática" required />

        <div class="ak-field">
          <span class="ak-field__label" id="subject-category-label">Categoria</span>
          <select
            id="subject-category"
            v-model="form.categoryId"
            class="ak-field__control ak-field__control--md field-select"
            aria-labelledby="subject-category-label"
          >
            <option :value="null">Sem categoria</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>

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
              :aria-label="c.name"
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

        <div class="form-preview">
          <div class="subject-avatar" :style="{ background: subjectBgMix(form.color, 15) }">
            {{ form.icon }}
          </div>
          <div class="min-w-0">
            <p class="form-preview__name">{{ form.name || 'Nome da matéria' }}</p>
            <p class="form-preview__meta">
              <span class="status-dot" :style="{ background: form.color }" />
              {{ categoryName || 'Sem categoria' }}
            </p>
          </div>
        </div>

        <AkButton
          type="submit"
          form="subject-form"
          variant="primary"
          size="lg"
          block
          :loading="saving"
          :disabled="!form.name.trim()"
        >
          {{ subject ? 'Salvar' : 'Criar matéria' }}
        </AkButton>
      </form>
    </div>
  </AkSheet>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { AkButton, AkInput, AkSheet } from '@rafael_dias/akoma'
import { useSubjectsStore } from '@/stores/subjects'
import { useAppToast } from '@/composables/useAppToast'
import { SUBJECT_COLORS, SUBJECT_ICONS } from '@/types'
import { DEFAULT_SUBJECT_COLOR, normalizeAkomaColor, subjectBgMix } from '@/utils/colors'
import type { Subject } from '@/types'

const props = defineProps<{ show: boolean; subject?: Subject | null }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const subjectsStore = useSubjectsStore()
const toast = useAppToast()
const saving = ref(false)
const form = ref({
  name: '',
  icon: SUBJECT_ICONS[0] as string,
  color: DEFAULT_SUBJECT_COLOR as string,
  categoryId: null as string | null,
})

const categories = computed(() => subjectsStore.categories)
const categoryName = computed(() => {
  if (!form.value.categoryId) return null
  return subjectsStore.getCategory(form.value.categoryId)?.name ?? null
})

watch(() => props.show, (val) => {
  if (!val) return
  if (props.subject) {
    form.value = {
      name: props.subject.name,
      icon: props.subject.icon,
      color: normalizeAkomaColor(props.subject.color),
      categoryId: props.subject.categoryId,
    }
  } else {
    form.value = {
      name: '',
      icon: SUBJECT_ICONS[0],
      color: DEFAULT_SUBJECT_COLOR,
      categoryId: null,
    }
  }
})

async function handleSubmit() {
  if (!form.value.name.trim()) return
  saving.value = true
  try {
    if (props.subject) {
      await subjectsStore.updateSubject(props.subject.id, form.value)
      toast.success('Matéria atualizada')
    } else {
      await subjectsStore.addSubject(form.value)
      toast.success('Matéria criada')
    }
    emit('saved')
    emit('close')
  } finally {
    saving.value = false
  }
}
</script>
