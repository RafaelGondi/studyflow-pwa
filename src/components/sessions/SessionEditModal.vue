<template>
  <AkSheet
    :open="show"
    title="Editar registro"
    close-label="Fechar"
    @update:open="(open) => { if (!open) emit('close') }"
  >
    <div class="modal-body stack">
      <AkCard v-if="isBreak" padding="sm">
        <div class="flex-row" style="gap: var(--space-3)">
          <div class="subject-avatar" :style="{ background: 'var(--warning-soft)' }">☕</div>
          <span class="text-sm font-semibold text-warning">Pausa</span>
          <span class="text-xs text-muted" style="margin-left: auto">{{ dateLabel }}</span>
        </div>
      </AkCard>

      <div v-else>
        <label class="stat-label" style="display: block; margin-bottom: var(--space-2)">Matéria</label>
        <select v-model="form.subjectId" class="field-select">
          <option v-for="s in subjects" :key="s.id" :value="s.id">{{ s.icon }} {{ s.name }}</option>
        </select>
      </div>

      <form @submit.prevent="handleSubmit" class="stack">
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
            <span class="text-xs text-muted">Duração calculada</span>
            <span class="text-sm font-bold numeric" :class="endBeforeStart ? 'text-danger' : 'text-primary'">
              {{ endBeforeStart ? 'Inválida' : formatDuration(computedDuration) }}
            </span>
          </div>
        </AkCard>

        <AkButton type="submit" variant="primary" block :loading="saving" :disabled="endBeforeStart">
          Salvar alterações
        </AkButton>
      </form>
    </div>
  </AkSheet>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { AkButton, AkCard, AkInput, AkSheet } from '@rafael_dias/akoma'
import { useSubjectsStore } from '@/stores/subjects'
import { useSessionsStore } from '@/stores/sessions'
import { useAppToast } from '@/composables/useAppToast'
import { formatDuration, isBreakSession } from '@/types'
import type { StudySession } from '@/types'

const props = defineProps<{ show: boolean; session: StudySession | null }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const subjectsStore = useSubjectsStore()
const sessionsStore = useSessionsStore()
const toast = useAppToast()
const saving = ref(false)

const form = ref({ startTime: '', endTime: '', subjectId: '' })

const subjects = computed(() => subjectsStore.subjects)
const isBreak = computed(() => props.session ? isBreakSession(props.session) : false)

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
      endTime: toTimeInput(props.session.endTime),
      subjectId: props.session.subjectId ?? subjects.value[0]?.id ?? '',
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
    const patch: Partial<StudySession> = {
      startTime: newStartTs.value,
      endTime: newEndTs.value,
      duration: computedDuration.value,
    }
    if (!isBreak.value) {
      patch.subjectId = form.value.subjectId
    }
    if (props.session.segments?.length) {
      patch.segments = props.session.segments.map((seg, i, arr) =>
        i === arr.length - 1 ? { ...seg, end: newEndTs.value } : seg
      )
    }
    await sessionsStore.update(props.session.id, patch)
    toast.success('Registro atualizado')
    emit('saved')
    emit('close')
  } finally {
    saving.value = false
  }
}
</script>
