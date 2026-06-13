<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="fixed inset-0 z-[110] flex items-end sm:items-center justify-center">
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="emit('close')" />
        <div class="modal-sheet modal-panel">
          <div class="flex-shrink-0 flex items-center justify-between px-6 pt-6 pb-4">
            <h2 class="font-display text-lg font-bold text-primary">
              {{ subject ? 'Editar matéria' : 'Nova matéria' }}
            </h2>
            <button @click="emit('close')" class="w-8 h-8 rounded-full btn-icon tap-scale">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div class="modal-scroll">
          <form @submit.prevent="handleSubmit" class="space-y-5">
            <!-- Icon picker -->
            <div>
              <label class="text-xs font-semibold text-muted uppercase tracking-wider mb-2 block">Ícone</label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="icon in SUBJECT_ICONS"
                  :key="icon"
                  type="button"
                  @click="form.icon = icon"
                  class="w-10 h-10 rounded-akoma text-xl flex items-center justify-center transition-all duration-150 tap-scale"
                  :class="form.icon === icon ? 'bg-accent/30 ring-2 ring-accent' : 'btn-icon'"
                >
                  {{ icon }}
                </button>
              </div>
            </div>

            <!-- Name -->
            <div>
              <label class="text-xs font-semibold text-muted uppercase tracking-wider mb-2 block">Nome</label>
              <input
                v-model="form.name"
                type="text"
                placeholder="Ex: Matemática"
                required
                class="input"
              />
            </div>

            <!-- Category -->
            <div>
              <label class="text-xs font-semibold text-muted uppercase tracking-wider mb-2 block">Categoria</label>
              <select
                v-model="form.categoryId"
                class="input"
              >
                <option :value="null">Sem categoria</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
              </select>
            </div>

            <!-- Color picker -->
            <div>
              <label class="text-xs font-semibold text-muted uppercase tracking-wider mb-2 block">Cor</label>
              <!-- 16 cores predefinidas: 8 por linha -->
              <div class="grid grid-cols-8 gap-2">
                <button
                  v-for="c in SUBJECT_COLORS"
                  :key="c.value"
                  type="button"
                  @click="form.color = c.value"
                  class="w-8 h-8 rounded-full transition-all duration-150 active:scale-90 flex items-center justify-center"
                  :style="{ background: c.value }"
                  :class="form.color === c.value ? 'ring-2 ring-offset-2 ring-offset-app-card scale-110' : 'opacity-75 hover:opacity-100 hover:scale-105'"
                >
                  <svg v-if="form.color === c.value" class="w-3.5 h-3.5 text-white drop-shadow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </button>
              </div>

              <!-- Cor personalizada -->
              <div class="flex items-center gap-3 mt-2">
                <label
                  class="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-150 hover:scale-105 active:scale-90 overflow-hidden border-2 border-dashed border-app-border relative flex-shrink-0"
                  :class="isCustomColor ? 'ring-2 ring-offset-2 ring-offset-app-card scale-110' : ''"
                  :style="isCustomColor ? { background: form.color, borderColor: form.color } : {}"
                  title="Cor personalizada"
                >
                  <input
                    type="color"
                    :value="isCustomColor ? form.color : '#000000'"
                    @input="onCustomColor"
                    class="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                  <svg v-if="!isCustomColor" class="w-3.5 h-3.5 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
                  </svg>
                  <svg v-else class="w-3.5 h-3.5 text-white drop-shadow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </label>
                <span class="text-xs text-muted">{{ isCustomColor ? form.color : 'Cor personalizada' }}</span>
              </div>
            </div>

            <!-- Preview -->
            <div class="p-3 rounded-akoma btn-icon border border-app-border flex items-center gap-3">
              <div class="w-10 h-10 rounded-akoma flex items-center justify-center text-xl" :style="{ background: `${form.color}25` }">
                {{ form.icon }}
              </div>
              <div>
                <p class="font-semibold text-primary text-sm">{{ form.name || 'Nome da matéria' }}</p>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <div class="w-2 h-2 rounded-full" :style="{ background: form.color }" />
                  <span class="text-xs text-muted">{{ categoryName || 'Sem categoria' }}</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              :disabled="!form.name.trim() || saving"
              class="w-full py-3.5 rounded-akoma font-bold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed tap-scale"
              :style="{ background: `linear-gradient(135deg, ${form.color}, ${form.color}bb)` }"
            >
              {{ saving ? 'Salvando...' : subject ? 'Salvar' : 'Criar matéria' }}
            </button>
          </form>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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

<style scoped>
.modal-enter-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.modal-leave-active { transition: all 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: translateY(40px); }
</style>
