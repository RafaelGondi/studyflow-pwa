<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay">
        <div class="modal-backdrop" @click="emit('close')" />
        <div class="modal-sheet modal-form">
          <div class="modal-handle" aria-hidden="true" />
          <div class="modal-header">
            <h2 class="modal-title">{{ subject ? 'Editar matéria' : 'Nova matéria' }}</h2>
            <AkIconButton label="Fechar" size="sm" icon="x-outline" @click="emit('close')" />
          </div>

          <div class="modal-body">
            <form id="subject-form" class="stack" @submit.prevent="handleSubmit">
              <div class="form-field">
                <label class="form-label">Ícone</label>
                <div class="icon-grid">
                  <button
                    v-for="icon in SUBJECT_ICONS"
                    :key="icon"
                    type="button"
                    @click="form.icon = icon"
                    class="icon-pick"
                    :class="{ 'icon-pick--active': form.icon === icon }"
                  >
                    {{ icon }}
                  </button>
                </div>
              </div>

              <AkInput v-model="form.name" label="Nome" placeholder="Ex: Matemática" required />

              <div class="form-field">
                <label class="form-label" for="subject-category">Categoria</label>
                <select id="subject-category" v-model="form.categoryId" class="field-select">
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
                    @click="form.color = c.value"
                    class="color-swatch"
                    :class="{ 'color-swatch--active': form.color === c.value }"
                    :style="{ background: c.value }"
                    :aria-label="c.name"
                  >
                    <svg v-if="form.color === c.value" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" style="width:14px;height:14px;color:var(--accent-contrast)">
                      <polyline points="20 6 9 17 4 12"/>
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
            </form>
          </div>

          <div class="modal-footer">
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
import { SUBJECT_COLORS, SUBJECT_ICONS } from '@/types'
import { DEFAULT_SUBJECT_COLOR, normalizeAkomaColor, subjectBgMix } from '@/utils/colors'
import type { Subject } from '@/types'

const props = defineProps<{ show: boolean; subject?: Subject | null }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const subjectsStore = useSubjectsStore()
const categories = computed(() => subjectsStore.categories)
const saving = ref(false)

const form = ref<{ name: string; icon: string; color: string; categoryId: string | null }>({
  name: '',
  icon: '📚',
  color: DEFAULT_SUBJECT_COLOR,
  categoryId: null,
})

watch(() => props.show, (val) => {
  if (val) {
    if (props.subject) {
      form.value = {
        name: props.subject.name,
        icon: props.subject.icon,
        color: normalizeAkomaColor(props.subject.color),
        categoryId: props.subject.categoryId,
      }
    } else {
      form.value = { name: '', icon: '📚', color: DEFAULT_SUBJECT_COLOR, categoryId: null }
    }
  }
})

const categoryName = computed(() => {
  if (!form.value.categoryId) return null
  return subjectsStore.getCategory(form.value.categoryId)?.name ?? null
})

async function handleSubmit() {
  if (!form.value.name.trim()) return
  saving.value = true
  try {
    if (props.subject) {
      await subjectsStore.updateSubject(props.subject.id, form.value)
    } else {
      await subjectsStore.addSubject(form.value)
    }
    emit('saved')
    emit('close')
  } finally {
    saving.value = false
  }
}
</script>
