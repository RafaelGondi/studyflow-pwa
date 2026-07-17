<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay">
        <div class="modal-backdrop" @click="emit('close')" />
        <AkCard padding="none" class="modal-sheet">
          <div class="modal-header">
            <h2 class="modal-title">{{ subject ? 'Editar matéria' : 'Nova matéria' }}</h2>
            <AkIconButton label="Fechar" size="sm" @click="emit('close')">
              <CuidaIcon name="x-outline" :size="18" />
            </AkIconButton>
          </div>

          <div class="modal-body stack">
            <form @submit.prevent="handleSubmit" class="stack">
              <div>
                <label class="stat-label" style="display: block; margin-bottom: var(--space-2)">Ícone</label>
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

              <div>
                <label class="stat-label" style="display: block; margin-bottom: var(--space-2)">Categoria</label>
                <select v-model="form.categoryId" class="field-select">
                  <option :value="null">Sem categoria</option>
                  <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                </select>
              </div>

              <div>
                <label class="stat-label" style="display: block; margin-bottom: var(--space-2)">Cor</label>
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
                    <svg v-if="form.color === c.value" viewBox="0 0 24 24" fill="none" stroke="var(--text-inverse)" stroke-width="3" stroke-linecap="round" style="width:14px;height:14px">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </button>
                </div>
                <div class="flex-row" style="gap: var(--space-3); margin-top: var(--space-2)">
                  <label
                    class="color-swatch"
                    :class="{ 'color-swatch--active': isCustomColor }"
                    :style="isCustomColor ? { background: form.color } : { border: '2px dashed var(--border-strong)' }"
                    title="Cor personalizada"
                  >
                    <input type="color" :value="form.color" @input="onCustomColor" style="position:absolute;inset:0;opacity:0;width:100%;height:100%;cursor:pointer" />
                    <svg v-if="!isCustomColor" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2" style="width:14px;height:14px">
                      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
                    </svg>
                  </label>
                  <span class="text-xs text-muted">{{ isCustomColor ? form.color : 'Cor personalizada' }}</span>
                </div>
              </div>

              <AkCard padding="sm">
                <div class="flex-row" style="gap: var(--space-3)">
                  <div class="subject-avatar" :style="{ background: colorMix(form.color, 15) }">
                    {{ form.icon }}
                  </div>
                  <div>
                    <p class="font-semibold text-primary text-sm">{{ form.name || 'Nome da matéria' }}</p>
                    <div class="flex-row" style="gap: var(--space-2); margin-top: 2px">
                      <div class="status-dot" :style="{ background: form.color }" />
                      <span class="text-xs text-muted">{{ categoryName || 'Sem categoria' }}</span>
                    </div>
                  </div>
                </div>
              </AkCard>

              <AkButton
                type="submit"
                variant="primary"
                block
                :loading="saving"
                :disabled="!form.name.trim()"
                :style="{ background: form.color }"
              >
                {{ subject ? 'Salvar' : 'Criar matéria' }}
              </AkButton>
            </form>
          </div>
        </AkCard>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { AkButton, AkCard, AkIconButton, AkInput } from '@rafael_dias/akoma'
import CuidaIcon from '@/components/ui/CuidaIcon.vue'
import { useSubjectsStore } from '@/stores/subjects'
import { SUBJECT_COLORS, SUBJECT_ICONS } from '@/types'
import type { Subject } from '@/types'

const PRESET_VALUES = new Set(SUBJECT_COLORS.map(c => c.value))

const props = defineProps<{ show: boolean; subject?: Subject | null }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const subjectsStore = useSubjectsStore()
const categories = computed(() => subjectsStore.categories)
const saving = ref(false)

const form = ref({
  name: '',
  icon: '📚',
  color: SUBJECT_COLORS[0].value,
  categoryId: null as string | null,
})

function colorMix(color: string, pct: number) {
  return `color-mix(in srgb, ${color} ${pct}%, var(--bg-elevated))`
}

watch(() => props.show, (val) => {
  if (val) {
    if (props.subject) {
      form.value = {
        name: props.subject.name,
        icon: props.subject.icon,
        color: props.subject.color,
        categoryId: props.subject.categoryId,
      }
    } else {
      form.value = { name: '', icon: '📚', color: SUBJECT_COLORS[0].value, categoryId: null }
    }
  }
})

const isCustomColor = computed(() => !PRESET_VALUES.has(form.value.color))

function onCustomColor(e: Event) {
  form.value.color = (e.target as HTMLInputElement).value
}

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
