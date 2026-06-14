<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="fixed inset-0 z-[110] flex items-end sm:items-center justify-center">
        <div class="absolute inset-0 z-0 bg-black/70 backdrop-blur-sm" @click="emit('close')" />
        <div class="modal-sheet modal-panel">

          <div class="flex-shrink-0 flex items-center justify-between px-6 pt-6 pb-4">
            <h2 class="font-display text-lg font-bold text-primary">Adicionar registro</h2>
            <button @click="emit('close')" class="w-8 h-8 rounded-full btn-icon tap-scale">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div class="modal-scroll">
            <div class="seg-control mb-5">
              <button
                v-for="t in kinds"
                :key="t.value"
                @click="form.kind = t.value"
                class="seg-tab"
                :class="form.kind === t.value ? 'seg-tab-active' : ''"
              >
                {{ t.label }}
              </button>
            </div>

            <form @submit.prevent="handleSubmit" class="space-y-4">
              <div v-if="form.kind === 'study'">
                <label class="text-xs font-semibold text-muted uppercase tracking-wider mb-2 block">Matéria</label>
                <select v-model="form.subjectId" required class="input">
                  <option value="" disabled>Selecione</option>
                  <option v-for="s in subjects" :key="s.id" :value="s.id">{{ s.icon }} {{ s.name }}</option>
                </select>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-xs font-semibold text-muted uppercase tracking-wider mb-2 block">Início</label>
                  <input v-model="form.startTime" type="time" required class="input" />
                </div>
                <div>
                  <label class="text-xs font-semibold text-muted uppercase tracking-wider mb-2 block">Fim</label>
                  <input
                    v-model="form.endTime"
                    type="time"
                    required
                    class="input"
                    :class="{ 'border-red-500 ring-1 ring-red-500': endBeforeStart }"
                  />
                </div>
              </div>

              <div class="flex items-center justify-between p-3 rounded-akoma btn-icon">
                <span class="text-xs text-muted">Duração</span>
                <span class="text-sm font-bold" :class="endBeforeStart ? 'text-red-400' : 'text-primary'">
                  {{ endBeforeStart ? 'Fim antes do início' : formatDuration(computedDuration) }}
                </span>
              </div>

              <button
                type="submit"
                :disabled="endBeforeStart || saving || (form.kind === 'study' && !form.subjectId)"
                class="w-full py-3.5 font-bold text-white btn-primary disabled:opacity-50 tap-scale"
              >
                {{ saving ? 'Salvando...' : 'Adicionar' }}
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
import { useSessionsStore } from '@/stores/sessions'
import { formatDuration } from '@/types'
import type { SessionKind } from '@/types'

const props = defineProps<{ show: boolean; date: string }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const subjectsStore = useSubjectsStore()
const sessionsStore = useSessionsStore()
const saving = ref(false)

const kinds = [
  { value: 'study' as SessionKind, label: 'Estudo' },
  { value: 'break' as SessionKind, label: 'Pausa' },
]

const form = ref({
  kind: 'study' as SessionKind,
  subjectId: '',
  startTime: '09:00',
  endTime: '10:00',
})

const subjects = computed(() => subjectsStore.subjects)

function applyTimeToDate(dateStr: string, timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number)
  const d = new Date(dateStr + 'T12:00:00')
  d.setHours(h, m, 0, 0)
  return d.getTime()
}

watch(() => props.show, (val) => {
  if (val) {
    form.value = {
      kind: 'study',
      subjectId: subjects.value[0]?.id ?? '',
      startTime: '09:00',
      endTime: '10:00',
    }
  }
})

const newStartTs = computed(() => applyTimeToDate(props.date, form.value.startTime))
const newEndTs = computed(() => applyTimeToDate(props.date, form.value.endTime))
const endBeforeStart = computed(() => newEndTs.value <= newStartTs.value)
const computedDuration = computed(() =>
  Math.max(0, Math.round((newEndTs.value - newStartTs.value) / 1000))
)

async function handleSubmit() {
  if (endBeforeStart.value) return
  saving.value = true
  try {
    const base = {
      startTime: newStartTs.value,
      endTime: newEndTs.value,
      duration: computedDuration.value,
    }
    if (form.value.kind === 'break') {
      await sessionsStore.saveBreak(base)
    } else {
      await sessionsStore.saveStudy({ ...base, subjectId: form.value.subjectId })
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
