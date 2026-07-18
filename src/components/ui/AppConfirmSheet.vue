<script setup lang="ts">
import { AkButton } from '@rafael_dias/akoma'
import AppBottomSheet from '@/components/ui/AppBottomSheet.vue'
import { useConfirmSheet } from '@/composables/useConfirmSheet'

const { state, confirm, cancel } = useConfirmSheet()
</script>

<template>
  <AppBottomSheet
    :open="state.open"
    :title="state.title"
    @update:open="(open) => { if (!open) cancel() }"
  >
    <div class="confirm-sheet">
      <p class="confirm-sheet__message">{{ state.message }}</p>
      <div class="confirm-sheet__actions">
        <AkButton variant="danger" block @click="confirm">
          {{ state.confirmLabel }}
        </AkButton>
        <AkButton variant="secondary" block @click="cancel">
          Cancelar
        </AkButton>
      </div>
    </div>
  </AppBottomSheet>
</template>

<style scoped>
.confirm-sheet {
  padding: 0 var(--space-5) var(--space-5);
}

.confirm-sheet__message {
  font-size: 15px;
  line-height: 1.5;
  color: var(--text-secondary);
  margin-bottom: var(--space-5);
}

.confirm-sheet__actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
</style>
