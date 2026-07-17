<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay">
        <div class="modal-backdrop" @click="emit('close')" />
        <AkCard padding="none" class="modal-sheet">
          <div class="modal-header">
            <h2 class="modal-title">Adicionar registro</h2>
            <AkIconButton label="Fechar" size="sm" @click="emit('close')">
              <CuidaIcon name="x-outline" :size="18" />
            </AkIconButton>
          </div>

          <div class="modal-body stack">
            <div class="chip-group">
              <AkChip
                v-for="t in kinds"
                :key="t.value"
                :active="form.kind === t.value"
                @click="form.kind = t.value"
              >
                {{ t.label }}
              </AkChip>
            </div>

            <form @submit.prevent="handleSubmit" class="stack">
              <div v-if="form.kind === 'study'">
                <label class="stat-label" style="display: block; margin-bottom: var(--space-2)">Matéria</label>
                <select v-model="form.subjectId" required class="field-select">
                  <option value="" disabled>Selecione</option>
                  <option v-for="s in subjects" :key="s.id" :value="s.id">{{ s.icon }} {{ s.name }}</option>
                </select>
              </div>

              <div class="grid-2">
                <AkInput v-model="form.startTime" label="Início" type="time" required />
                <AkInput
                  v-model="form.endTime"
                  label="Fim"
                  type="time"
                  required
                  :error="endBeforeStart ? 'Fim antes do início' : undefined"
                />
              </div>

              <AkCard padding="sm">
                <div class="flex-between">
                  <span class="text-xs text-muted">Duração</span>
                  <span class="text-sm font-bold numeric" :class="endBeforeStart ? 'text-danger' : 'text-primary'">
                    {{ endBeforeStart ? 'Inválida' : formatDuration(computedDuration) }}
                  </span>
                </div>
              </AkCard>

              <AkButton
                type="submit"
                variant="primary"
                block
                :loading="saving"
                :disabled="endBeforeStart || (form.kind === 'study' && !form.subjectId)"
              >
                Adicionar
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
import { AkButton, AkCard, AkChip, AkIconButton, AkInput } from '@rafael_dias/akoma'
import CuidaIcon from '@/components/ui/CuidaIcon.vue'
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
