<template>
  <Transition name="global-pet">
    <div
      v-if="visible"
      class="global-pet"
      :class="{ 'global-pet--dragging': dragging, 'global-pet--right': facing === 'left' }"
      :style="positionStyle"
    >
      <button
        type="button"
        class="global-pet__button"
        :aria-label="ariaLabel"
        @pointerdown="startDrag"
        @keydown.enter.prevent="handleTap"
        @keydown.space.prevent="handleTap"
      >
        <span v-if="attentionMessage" class="global-pet__bubble">{{ attentionMessage }}</span>
        <span v-if="pet.isDeparted" class="global-pet__star" aria-hidden="true">✦</span>
        <span v-else-if="pet.hasEgg" class="global-pet__egg" aria-hidden="true">🥚</span>
        <PixelPet v-else ref="sprite" :mood="pet.mood" :name="pet.name" :mood-label="pet.moodLabel" :facing="facing" :size="74" :bond-level="pet.level" />
        <span v-if="pet.isDeparted || pet.hasEgg || pet.isAway || pet.missedDays > 0" class="global-pet__alert" aria-hidden="true">!</span>
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PixelPet from './PixelPet.vue'
import { usePetStore } from '@/stores/pet'

const route = useRoute()
const router = useRouter()
const pet = usePetStore()
const sprite = ref<InstanceType<typeof PixelPet> | null>(null)
const position = ref<{ x: number; y: number } | null>(null)
const dragging = ref(false)
let navigationTimer: ReturnType<typeof setTimeout> | null = null
let pointerId: number | null = null
let dragTarget: HTMLElement | null = null
let pressX = 0
let pressY = 0
let originX = 0
let originY = 0
const POSITION_KEY = 'studyflow_pet_position'
const DRAG_THRESHOLD = 6

const visible = computed(() => route.path !== '/rewards/pet')
const positionStyle = computed(() => position.value
  ? { left: `${position.value.x}px`, top: `${position.value.y}px`, bottom: 'auto' }
  : undefined)
const facing = computed<'left' | 'right'>(() => {
  if (!position.value) return 'right'
  const bounds = movementBounds()
  const center = bounds.minX + (bounds.maxX - bounds.minX) / 2
  return position.value.x > center ? 'left' : 'right'
})
const attentionMessage = computed(() => {
  if (pet.isDeparted) return 'Um novo ovo está disponível'
  if (pet.hasEgg) return 'Toque para me fazer nascer'
  if (pet.isAway) return 'Complete 1h para eu voltar'
  if (pet.missedDays > 0) return 'Estou com fome'
  if (pet.streakAtRisk) return 'Nossa sequência está em risco'
  return ''
})
const ariaLabel = computed(() => attentionMessage.value
  ? `${pet.name}: ${attentionMessage.value}. Abrir cuidados.`
  : `${pet.name}, ${pet.moodLabel.toLowerCase()}. Abrir cuidados.`)

function handleTap() {
  if (navigationTimer) return
  if (pet.isActive) sprite.value?.react()
  navigationTimer = setTimeout(() => {
    navigationTimer = null
    void router.push('/rewards/pet')
  }, 680)
}

function movementBounds() {
  const shell = document.querySelector('.ak-app-root')?.getBoundingClientRect()
  const nav = document.querySelector('.ak-tab-bar')?.getBoundingClientRect()
  const minX = (shell?.left ?? 0) + 2
  const maxX = Math.max(minX, (shell?.right ?? window.innerWidth) - 80)
  const minY = (shell?.top ?? 0) + 4
  const maxY = Math.max(minY, (nav?.top ?? window.innerHeight - 68) - 80)
  return { minX, maxX, minY, maxY }
}

function clampPosition(x: number, y: number) {
  const bounds = movementBounds()
  return {
    x: Math.min(bounds.maxX, Math.max(bounds.minX, x)),
    y: Math.min(bounds.maxY, Math.max(bounds.minY, y)),
  }
}

function startDrag(event: PointerEvent) {
  if (event.button !== 0 || pointerId !== null) return
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  pointerId = event.pointerId
  dragTarget = target
  pressX = event.clientX
  pressY = event.clientY
  originX = rect.left
  originY = rect.top
  dragging.value = false
  try { target.setPointerCapture(event.pointerId) } catch {}
  window.addEventListener('pointermove', moveDrag)
  window.addEventListener('pointerup', finishDrag)
  window.addEventListener('pointercancel', cancelDrag)
}

function moveDrag(event: PointerEvent) {
  if (event.pointerId !== pointerId) return
  const dx = event.clientX - pressX
  const dy = event.clientY - pressY
  if (!dragging.value && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
  dragging.value = true
  position.value = clampPosition(originX + dx, originY + dy)
}

function finishDrag(event: PointerEvent) {
  if (event.pointerId !== pointerId) return
  if (dragTarget?.hasPointerCapture(event.pointerId)) dragTarget.releasePointerCapture(event.pointerId)
  pointerId = null
  dragTarget = null
  removeDragListeners()
  if (dragging.value && position.value) savePosition()
  else handleTap()
  dragging.value = false
}

function cancelDrag(event: PointerEvent) {
  if (event.pointerId !== pointerId) return
  pointerId = null
  dragTarget = null
  dragging.value = false
  removeDragListeners()
}

function removeDragListeners() {
  window.removeEventListener('pointermove', moveDrag)
  window.removeEventListener('pointerup', finishDrag)
  window.removeEventListener('pointercancel', cancelDrag)
}

function savePosition() {
  if (!position.value) return
  const bounds = movementBounds()
  const width = Math.max(1, bounds.maxX - bounds.minX)
  const height = Math.max(1, bounds.maxY - bounds.minY)
  localStorage.setItem(POSITION_KEY, JSON.stringify({
    x: (position.value.x - bounds.minX) / width,
    y: (position.value.y - bounds.minY) / height,
  }))
}

function restorePosition() {
  try {
    const raw = localStorage.getItem(POSITION_KEY)
    if (!raw) return
    const saved = JSON.parse(raw) as { x?: number; y?: number }
    if (!Number.isFinite(saved.x) || !Number.isFinite(saved.y)) return
    const bounds = movementBounds()
    position.value = clampPosition(
      bounds.minX + Math.min(1, Math.max(0, saved.x!)) * (bounds.maxX - bounds.minX),
      bounds.minY + Math.min(1, Math.max(0, saved.y!)) * (bounds.maxY - bounds.minY),
    )
  } catch {}
}

function handleResize() {
  if (!position.value) return
  restorePosition()
}

onMounted(() => {
  restorePosition()
  window.addEventListener('resize', handleResize)
})
onBeforeUnmount(() => {
  if (navigationTimer) clearTimeout(navigationTimer)
  removeDragListeners()
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.global-pet {
  position: fixed;
  z-index: 35;
  left: max(var(--space-2), calc((100vw - var(--shell-max)) / 2 + var(--space-2)));
  bottom: calc(var(--nav-height) + var(--safe-bottom) + 2px);
  width: 78px;
  height: 78px;
  pointer-events: none;
}

.global-pet__button {
  position: relative;
  display: grid;
  place-items: center;
  width: 78px;
  height: 78px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text);
  cursor: pointer;
  pointer-events: auto;
  touch-action: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.global-pet--dragging { z-index: 39; }
.global-pet--dragging .global-pet__button { cursor: grabbing; transform: scale(1.06); }
.global-pet:not(.global-pet--dragging) .global-pet__button { transition: transform .18s var(--ease-spring); }

.global-pet__button:focus-visible {
  border-radius: var(--radius-full);
  outline: 2px solid var(--accent);
  outline-offset: -4px;
}

.global-pet__bubble {
  position: absolute;
  z-index: 5;
  left: 58px;
  bottom: 48px;
  width: max-content;
  max-width: min(210px, calc(100vw - 92px));
  padding: 7px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md) var(--radius-md) var(--radius-md) 3px;
  background: color-mix(in srgb, var(--bg-elevated) 94%, transparent);
  box-shadow: var(--shadow-sm);
  color: var(--text-secondary);
  font-size: var(--text-xs);
  font-weight: 650;
  line-height: 1.25;
  overflow-wrap: anywhere;
  white-space: normal;
  backdrop-filter: blur(12px);
  animation: bubble-in .35s var(--ease-out-expo) both;
}

.global-pet--right .global-pet__bubble {
  right: 58px;
  left: auto;
  border-radius: var(--radius-md) var(--radius-md) 3px var(--radius-md);
  animation-name: bubble-in-right;
}

.global-pet__alert {
  position: absolute;
  z-index: 6;
  top: 42px;
  right: 2px;
  display: grid;
  place-items: center;
  width: 19px;
  height: 19px;
  border: 2px solid var(--bg);
  border-radius: 50%;
  background: #d85f58;
  color: #fff;
  font-size: 11px;
  font-weight: 800;
}

.global-pet__star { color: #e4ad36; font-size: 48px; line-height: 1; text-shadow: 0 0 16px color-mix(in srgb, #e4ad36 55%, transparent); animation: global-star 2.6s ease-in-out infinite; }
.global-pet__egg { display: grid; place-items: center; width: 58px; height: 58px; border-radius: 50%; background: var(--bg-elevated); box-shadow: var(--shadow-sm); font-size: 38px; animation: global-egg 2.4s steps(2, end) infinite; }

.global-pet-enter-active, .global-pet-leave-active { transition: opacity .2s, transform .28s var(--ease-out-expo); }
.global-pet-enter-from, .global-pet-leave-to { opacity: 0; transform: translateY(12px) scale(.88); }

@keyframes bubble-in {
  from { opacity: 0; transform: translate(-5px, 4px) scale(.96); }
}
@keyframes bubble-in-right {
  from { opacity: 0; transform: translate(5px, 4px) scale(.96); }
}
@keyframes global-star { 0%, 100% { transform: scale(.86) rotate(-5deg); opacity: .7; } 50% { transform: scale(1.08) rotate(5deg); opacity: 1; } }
@keyframes global-egg { 0%, 75%, 100% { transform: rotate(0); } 84% { transform: rotate(-5deg); } 92% { transform: rotate(5deg); } }

@media (prefers-reduced-motion: reduce) {
  .global-pet-enter-active, .global-pet-leave-active { transition: none; }
  .global-pet__bubble { animation: none; }
}
</style>
