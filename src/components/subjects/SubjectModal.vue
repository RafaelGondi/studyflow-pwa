<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="emit('close')" />
        <div class="relative w-full max-w-lg bg-app-card border border-app-border rounded-t-3xl sm:rounded-3xl p-6 pb-safe-bottom shadow-2xl">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-lg font-bold text-primary">
              {{ subject ? 'Editar matéria' : 'Nova matéria' }}
            </h2>
            <button @click="emit('close')" class="w-8 h-8 rounded-full bg-app-elevated flex items-center justify-center text-muted hover:text-primary transition-colors">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

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
                  class="w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all duration-150 active:scale-90"
                  :class="form.icon === icon ? 'bg-blue-500/30 ring-2 ring-blue-500' : 'bg-app-elevated hover:bg-app-elevated'"
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
                class="w-full bg-app-elevated border border-app-border rounded-xl px-4 py-3 text-primary placeholder:text-faint focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            <!-- Category -->
            <div>
              <label class="text-xs font-semibold text-muted uppercase tracking-wider mb-2 block">Categoria</label>
              <select
                v-model="form.categoryId"
                class="w-full bg-app-elevated border border-app-border rounded-xl px-4 py-3 text-primary focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option :value="null">Sem categoria</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
              </select>
            </div>

            <!-- Color picker -->
            <div>
              <label class="text-xs font-semibold text-muted uppercase tracking-wider mb-2 block">Cor</label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="c in SUBJECT_COLORS"
                  :key="c.value"
                  type="button"
                  @click="form.color = c.value"
                  class="w-9 h-9 rounded-full transition-all duration-150 active:scale-90 flex items-center justify-center"
                  :style="{ background: c.value }"
                  :class="form.color === c.value ? 'ring-2 ring-offset-2 ring-offset-app-card scale-110' : 'opacity-70 hover:opacity-100'"
                >
                  <svg v-if="form.color === c.value" class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Preview -->
            <div class="p-3 rounded-xl bg-app-elevated border border-app-border flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl" :style="{ background: `${form.color}25` }">
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
              class="w-full py-3.5 rounded-xl font-bold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
              :style="{ background: `linear-gradient(135deg, ${form.color}, ${form.color}bb)` }"
            >
              {{ saving ? 'Salvando...' : subject ? 'Salvar' : 'Criar matéria' }}
            </button>
          </form>
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
