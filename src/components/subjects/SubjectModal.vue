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

          <div class="icon-mode-tabs">
            <button
              v-for="m in iconModes"
              :key="m.value"
              type="button"
              class="icon-mode-tab"
              :class="{ 'icon-mode-tab--active': iconMode === m.value }"
              @click="setIconMode(m.value)"
            >
              {{ m.label }}
            </button>
          </div>

          <!-- Emoji -->
          <div v-if="iconMode === 'emoji'" class="icon-grid">
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

          <!-- Initial -->
          <div v-else-if="iconMode === 'initial'" class="icon-initial-mode">
            <div
              class="icon-initial-preview"
              :style="{ background: subjectBgMix(form.color, 15) }"
            >
              {{ form.name?.[0]?.toUpperCase() || '?' }}
            </div>
            <p class="icon-mode-hint">A inicial do nome será usada como ícone</p>
          </div>

          <!-- Image -->
          <div v-else-if="iconMode === 'image'" class="icon-image-mode">
            <button type="button" class="icon-image-upload" @click="fileInputRef?.click()">
              <img v-if="imagePreview" :src="imagePreview" class="icon-image-upload__img" alt="" />
              <template v-else>
                <AkIcon name="image-outline" :size="28" style="opacity: 0.4" />
                <span class="icon-image-upload__label">Escolher<br>da galeria</span>
              </template>
            </button>
            <p class="icon-mode-hint">
              {{ imagePreview ? 'Toque para trocar a imagem' : 'Toque para selecionar uma foto' }}
            </p>
            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              style="display: none"
              @change="handleImageChange"
            />
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

        <div class="ak-field">
          <span class="ak-field__label" id="subject-coins-label">Acúmulo de moedas</span>
          <select
            id="subject-coins"
            v-model="form.coinRule"
            class="ak-field__control ak-field__control--md field-select"
            aria-labelledby="subject-coins-label"
          >
            <option value="inherit">{{ inheritedCoinRuleLabel }}</option>
            <option value="enabled">Sempre acumular</option>
            <option value="disabled">Não acumular</option>
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

        <!--
          Tipo da matéria. Define o metal que ela rende e o peso da hora — uma
          hora de leitura vale 1/4 de uma de estudo, uma de trabalho 1/10.
        -->
        <div class="form-field">
          <label class="form-label">Tipo de atividade</label>
          <div class="activity-row">
            <button
              v-for="activity in ACTIVITIES"
              :key="activity.id"
              type="button"
              class="activity-pick"
              :class="{ 'activity-pick--active': form.activityKind === activity.id }"
              :style="{ '--metal-hi': `var(--metal-${activity.token}-hi)`,
                        '--metal-lo': `var(--metal-${activity.token}-lo)`,
                        '--metal-tx': `var(--metal-${activity.token}-tx)`,
                        '--metal-bg': `var(--metal-${activity.token}-bg)` }"
              :aria-pressed="form.activityKind === activity.id"
              @click="form.activityKind = activity.id"
            >
              <span class="activity-pick__coin" />
              <span class="activity-pick__name">{{ activity.label }}</span>
              <span class="activity-pick__rate">
                {{ activity.multiplier === 1 ? '1h → 1 ouro' : `1h → 1 ${activity.metal.toLowerCase()}` }}
              </span>
            </button>
          </div>
          <p class="activity-hint">
            {{ activityHint }}
          </p>
        </div>

        <div class="form-preview">
          <div class="subject-avatar" :style="previewBg">
            <SubjectIcon :icon="form.icon" :name="form.name" />
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
import { AkButton, AkIcon, AkInput, AkSheet } from '@rafael_dias/akoma'
import { useSubjectsStore } from '@/stores/subjects'
import { useAppToast } from '@/composables/useAppToast'
import { INITIAL_ICON, SUBJECT_COLORS, SUBJECT_ICONS } from '@/types'
import { DEFAULT_SUBJECT_COLOR, normalizeAkomaColor, subjectBgMix } from '@/utils/colors'
import { ACTIVITIES, DEFAULT_ACTIVITY, activityMeta } from '@/utils/coins'
import type { ActivityKind, Subject } from '@/types'
import SubjectIcon from '@/components/ui/SubjectIcon.vue'

const props = defineProps<{ show: boolean; subject?: Subject | null }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const subjectsStore = useSubjectsStore()
const toast = useAppToast()
const saving = ref(false)

type IconMode = 'emoji' | 'initial' | 'image'
const iconModes: { value: IconMode; label: string }[] = [
  { value: 'emoji',   label: 'Emoji' },
  { value: 'initial', label: 'Inicial' },
  { value: 'image',   label: 'Imagem' },
]

const iconMode    = ref<IconMode>('emoji')
const fileInputRef = ref<HTMLInputElement | null>(null)
const imagePreview = ref<string | null>(null)

const form = ref({
  name:       '',
  icon:       SUBJECT_ICONS[0] as string,
  color:      DEFAULT_SUBJECT_COLOR as string,
  categoryId: null as string | null,
  coinRule:   'inherit' as 'inherit' | 'enabled' | 'disabled',
  activityKind: DEFAULT_ACTIVITY as ActivityKind,
})

const activityHint = computed(() => {
  const meta = activityMeta(form.value.activityKind)
  if (meta.multiplier === 1) return 'Vale integral — é a referência das outras.'
  const share = meta.multiplier === 0.25 ? 'um quarto' : 'um décimo'
  return `Uma hora aqui vale ${share} de uma hora de estudo.`
})

const categories  = computed(() => subjectsStore.categories)
const categoryName = computed(() => {
  if (!form.value.categoryId) return null
  return subjectsStore.getCategory(form.value.categoryId)?.name ?? null
})
const inheritedCoinRuleLabel = computed(() => {
  if (!form.value.categoryId) return 'Usar padrão (acumula)'
  const category = subjectsStore.getCategory(form.value.categoryId)
  return `Herdar da categoria (${category?.earnsCoins === false ? 'não acumula' : 'acumula'})`
})


const previewBg = computed(() => ({
  background: iconMode.value === 'image' && imagePreview.value
    ? 'transparent'
    : subjectBgMix(form.value.color, 15),
  overflow: 'hidden',
}))

function detectIconMode(icon: string): IconMode {
  if (icon.startsWith('data:')) return 'image'
  if (icon === INITIAL_ICON)    return 'initial'
  return 'emoji'
}

function setIconMode(mode: IconMode) {
  iconMode.value = mode
  if (mode === 'initial') {
    form.value.icon = INITIAL_ICON
  } else if (mode === 'emoji') {
    form.value.icon = SUBJECT_ICONS.includes(form.value.icon)
      ? form.value.icon
      : SUBJECT_ICONS[0]
  } else if (mode === 'image' && imagePreview.value) {
    form.value.icon = imagePreview.value
  }
}

async function handleImageChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const dataUrl = await compressImage(file, 96, 0.8)
  imagePreview.value = dataUrl
  form.value.icon    = dataUrl
}

function compressImage(file: File, size: number, quality: number): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width  = size
        canvas.height = size
        const ctx = canvas.getContext('2d')!
        const min = Math.min(img.width, img.height)
        const sx  = (img.width  - min) / 2
        const sy  = (img.height - min) / 2
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = ev.target!.result as string
    }
    reader.readAsDataURL(file)
  })
}

watch(() => props.show, (val) => {
  if (!val) return
  if (props.subject) {
    const detected = detectIconMode(props.subject.icon)
    iconMode.value    = detected
    imagePreview.value = detected === 'image' ? props.subject.icon : null
    form.value = {
      name:       props.subject.name,
      icon:       props.subject.icon,
      color:      normalizeAkomaColor(props.subject.color),
      categoryId: props.subject.categoryId,
      coinRule:   props.subject.earnsCoins == null ? 'inherit' : props.subject.earnsCoins ? 'enabled' : 'disabled',
      activityKind: props.subject.activityKind ?? DEFAULT_ACTIVITY,
    }
  } else {
    iconMode.value    = 'emoji'
    imagePreview.value = null
    form.value = {
      name:       '',
      icon:       SUBJECT_ICONS[0],
      color:      DEFAULT_SUBJECT_COLOR,
      categoryId: null,
      coinRule:   'inherit',
      activityKind: DEFAULT_ACTIVITY,
    }
  }
})

async function handleSubmit() {
  if (!form.value.name.trim()) return
  saving.value = true
  try {
    const { coinRule, ...subjectData } = form.value
    const payload = {
      ...subjectData,
      earnsCoins: coinRule === 'inherit' ? null : coinRule === 'enabled',
      activityKind: form.value.activityKind,
    }
    if (props.subject) {
      await subjectsStore.updateSubject(props.subject.id, payload)
      toast.success('Matéria atualizada')
    } else {
      await subjectsStore.addSubject(payload)
      toast.success('Matéria criada')
    }
    emit('saved')
    emit('close')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
/* ── Tipo de atividade ─────────────────────────────────── */
.activity-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-2);
}

.activity-pick {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: var(--space-3) 4px var(--space-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-elevated);
  color: var(--text-secondary);
  font: inherit;
  cursor: pointer;
  transition: transform 0.14s var(--ease-out-expo), border-color 0.14s var(--ease-smooth);
}

.activity-pick:active { transform: scale(0.95); }

.activity-pick:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.activity-pick--active {
  border-color: color-mix(in srgb, var(--metal-lo) 60%, transparent);
  background: var(--metal-bg);
  color: var(--metal-tx);
}

/* A moeda do metal, desenhada em CSS — três discos, nenhum asset. */
.activity-pick__coin {
  width: 22px;
  height: 22px;
  border-radius: var(--radius-full);
  background: radial-gradient(circle at 32% 28%, var(--metal-hi), var(--metal-lo));
  box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--metal-lo) 75%, #000);
}

.activity-pick__name {
  font-size: var(--text-xs);
  font-weight: 500;
}

.activity-pick__rate {
  font-size: var(--text-2xs);
  opacity: 0.75;
}

.activity-hint {
  margin-top: var(--space-2);
  color: var(--text-secondary);
  font-size: var(--text-xs);
}
</style>
