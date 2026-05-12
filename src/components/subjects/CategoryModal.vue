<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="emit('close')" />
        <div class="relative w-full max-w-lg bg-app-card border border-app-border rounded-t-3xl sm:rounded-md p-6 pb-safe-bottom shadow-2xl">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-lg font-bold text-primary">
              {{ category ? 'Editar categoria' : 'Nova categoria' }}
            </h2>
            <button @click="emit('close')" class="w-8 h-8 rounded-full bg-app-elevated flex items-center justify-center text-muted hover:text-primary transition-colors">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-5">
            <div>
              <label class="text-xs font-semibold text-muted uppercase tracking-wider mb-2 block">Nome</label>
              <input
                v-model="form.name"
                type="text"
                placeholder="Ex: Exatas, Humanas..."
                required
                class="w-full bg-app-elevated border border-app-border rounded-md px-4 py-3 text-primary placeholder:text-faint focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              />
            </div>

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
                  <svg v-if="form.color === c.value" class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </button>
              </div>
            </div>

            <button
              type="submit"
              :disabled="!form.name.trim() || saving"
              class="w-full py-3.5 rounded-md font-bold text-white transition-all duration-200 disabled:opacity-50"
              style="background: linear-gradient(135deg, #44403c, #292524)"
            >
              {{ saving ? 'Salvando...' : category ? 'Salvar' : 'Criar categoria' }}
            </button>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSubjectsStore } from '@/stores/subjects'
import { SUBJECT_COLORS } from '@/types'
import type { Category } from '@/types'

const props = defineProps<{ show: boolean; category?: Category | null }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const subjectsStore = useSubjectsStore()
const saving = ref(false)
const form = ref({ name: '', color: SUBJECT_COLORS[0].value })

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

<style scoped>
.modal-enter-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.modal-leave-active { transition: all 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: translateY(40px); }
</style>
