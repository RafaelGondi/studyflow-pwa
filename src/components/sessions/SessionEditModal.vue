<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="fixed inset-0 z-[110] flex items-end sm:items-center justify-center">
        <div class="absolute inset-0 z-0 bg-black/70 backdrop-blur-sm" @click="emit('close')" />
        <div class="modal-sheet modal-panel">

          <div class="flex-shrink-0 flex items-center justify-between px-6 pt-6 pb-4">
            <h2 class="font-display text-lg font-bold text-primary">Editar sessão</h2>
            <button @click="emit('close')" class="w-8 h-8 rounded-full btn-icon tap-scale">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div class="modal-scroll">
          <!-- Subject info (read-only) -->
          <div class="flex items-center gap-3 p-3 rounded-akoma btn-icon mb-5">
            <div class="w-8 h-8 rounded-akoma flex items-center justify-center text-lg flex-shrink-0"
              :style="{ background: `${subject?.color ?? 'var(--accent-color)'}20` }">
              {{ subject?.icon ?? '📚' }}
            </div>
            <span class="text-sm font-semibold text-primary">{{ subject?.name ?? 'Matéria' }}</span>
            <span class="text-xs text-muted ml-auto">{{ dateLabel }}</span>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-4">
            <!-- Time fields -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs font-semibold text-muted uppercase tracking-wider mb-2 block">Início</label>
                <input
                  v-model="form.startTime"
                  type="time"
                  required
                  class="input"
                />
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

            <!-- Duration preview -->
            <div class="flex items-center justify-between p-3 rounded-akoma btn-icon">
              <span class="text-xs text-muted">Duração calculada</span>
              <span class="text-sm font-bold" :class="endBeforeStart ? 'text-red-400' : 'text-primary'">
                {{ endBeforeStart ? 'Fim antes do início' : formatDuration(computedDuration) }}
              </span>
            </div>

            <button
              type="submit"
              :disabled="endBeforeStart || saving"
              class="w-full py-3.5 font-bold text-white btn-primary disabled:opacity-50 tap-scale"
            >
              {{ saving ? 'Salvando...' : 'Salvar alterações' }}
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
import type { StudySession } from '@/types'

const props = defineProps<{ show: boolean; session: StudySession | null }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const subjectsStore = useSubjectsStore()
const sessionsStore = useSessionsStore()
const saving = ref(false)

const form = ref({ startTime: '', endTime: '' })

const subject = computed(() =>
  props.session ? subjectsStore.getSubject(props.session.subjectId) : null
)

const dateLabel = computed(() => {
  if (!props.session) return ''
  const d = new Date(props.session.startTime)
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
})

function toTimeInput(ts: number): string {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function applyTimeToDate(baseTs: number, timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number)
  const d = new Date(baseTs)
  d.setHours(h, m, 0, 0)
  return d.getTime()
}

watch(() => props.show, (val) => {
  if (val && props.session) {
    form.value = {
      startTime: toTimeInput(props.session.startTime),
      endTime:   toTimeInput(props.session.endTime),
    }
  }
})

const newStartTs = computed(() =>
  props.session ? applyTimeToDate(props.session.startTime, form.value.startTime) : 0
)
const newEndTs = computed(() =>
  props.session ? applyTimeToDate(props.session.startTime, form.value.endTime) : 0
)

const endBeforeStart = computed(() => newEndTs.value <= newStartTs.value)

const computedDuration = computed(() =>
  Math.max(0, Math.round((newEndTs.value - newStartTs.value) / 1000))
)

async function handleSubmit() {
  if (!props.session || endBeforeStart.value) return
  saving.value = true
  try {
    await sessionsStore.update(props.session.id, {
      startTime: newStartTs.value,
      endTime:   newEndTs.value,
      duration:  computedDuration.value,
      // Ajusta os segmentos: mantém os internos, corrige o último fim
      segments: props.session.segments?.map((seg, i, arr) =>
        i === arr.length - 1
          ? { ...seg, end: newEndTs.value }
          : seg
      ),
    })
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
