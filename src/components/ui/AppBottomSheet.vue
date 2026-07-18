<script setup lang="ts">
import { AkIconButton } from '@rafael_dias/akoma'

defineProps<{
  open: boolean
  title?: string
}>()

const emit = defineEmits<{ 'update:open': [boolean] }>()

function close() {
  emit('update:open', false)
}

let startY = 0
let isDragging = false

function onHandleTouchStart(e: TouchEvent) {
  const touch = e.touches[0]
  if (!touch) return
  startY = touch.clientY
  isDragging = true
}

function onHandleTouchEnd(e: TouchEvent) {
  if (!isDragging) return
  isDragging = false
  const touch = e.changedTouches[0]
  if (!touch) return
  if (touch.clientY - startY > 60) close()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="bs-backdrop">
      <div v-if="open" class="sheet-backdrop" @click="close" />
    </Transition>

    <Transition name="bs-slide">
      <div v-if="open" class="bottom-sheet">
        <div
          class="bottom-sheet__handle-wrap"
          @touchstart.passive="onHandleTouchStart"
          @touchend.passive="onHandleTouchEnd"
        >
          <div class="bottom-sheet__handle" />
        </div>

        <div v-if="title || $slots.header" class="bottom-sheet__header">
          <slot name="header">
            <h2 v-if="title" class="bottom-sheet__title">{{ title }}</h2>
          </slot>
          <AkIconButton variant="secondary" size="sm" label="Fechar" icon="x-outline" @click="close" />
        </div>

        <div class="bottom-sheet__body">
          <slot />
        </div>

        <div v-if="$slots.footer" class="bottom-sheet__footer">
          <slot name="footer" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.sheet-backdrop {
  position: fixed;
  inset: 0;
  z-index: 110;
  background: rgb(0 0 0 / 45%);
}

.bottom-sheet {
  position: fixed;
  bottom: 0;
  z-index: 111;
  width: 100%;
  max-width: var(--shell-max);
  left: 50%;
  transform: translateX(-50%);
  max-height: 92dvh;
  padding-bottom: var(--safe-bottom);
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  background: var(--bg-elevated);
  box-shadow: var(--surface-shadow-md);
  border: 1px solid var(--border);
  border-bottom: none;
}

.bottom-sheet__handle-wrap {
  display: flex;
  justify-content: center;
  padding: var(--space-3) 0 var(--space-2);
  flex-shrink: 0;
  cursor: grab;
}

.bottom-sheet__handle {
  width: 2.5rem;
  height: 4px;
  border-radius: var(--radius-full);
  background: var(--text-tertiary);
  opacity: 0.45;
}

.bottom-sheet__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: 0 var(--space-5) var(--space-3);
  flex-shrink: 0;
}

.bottom-sheet__title {
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 650;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  color: var(--text);
}

.bottom-sheet__body {
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.bottom-sheet__footer {
  flex-shrink: 0;
  padding: var(--space-4) var(--space-5) var(--space-5);
  border-top: 1px solid var(--border-strong);
  background: var(--bg-elevated);
}

.bs-backdrop-enter-active,
.bs-backdrop-leave-active {
  transition: opacity 0.25s ease;
}

.bs-backdrop-enter-from,
.bs-backdrop-leave-to {
  opacity: 0;
}

.bs-slide-enter-active,
.bs-slide-leave-active {
  transition: transform 0.32s var(--ease-out-expo);
}

.bs-slide-enter-from,
.bs-slide-leave-to {
  transform: translateX(-50%) translateY(100%);
}
</style>
