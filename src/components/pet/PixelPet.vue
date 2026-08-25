<template>
  <div
    class="pet-stage"
    :class="[`pet-stage--${mood}`, { 'pet-stage--interactive': interactive, 'pet-stage--reacting': reacting }]"
    :style="{ '--pet-size': `${size}px` }"
    :role="interactive ? 'button' : 'img'"
    :tabindex="interactive ? 0 : undefined"
    :aria-label="`${name}, mascote ${moodLabel.toLowerCase()}`"
    @click="interactive && react()"
    @keydown.enter.prevent="interactive && react()"
    @keydown.space.prevent="interactive && react()"
  >
    <span class="pet-stage__spark pet-stage__spark--one">✦</span>
    <span class="pet-stage__spark pet-stage__spark--two">✦</span>
    <div class="pet-stage__sprite">
      <img src="/pets/lumi.png" alt="" draggable="false" />
    </div>
    <span class="pet-stage__heart pet-stage__heart--one" aria-hidden="true">♥</span>
    <span class="pet-stage__heart pet-stage__heart--two" aria-hidden="true">♥</span>
    <span class="pet-stage__heart pet-stage__heart--three" aria-hidden="true">♥</span>
    <span class="pet-stage__ground" aria-hidden="true" />
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from 'vue'
import type { PetMood } from '@/types'

withDefaults(defineProps<{
  mood: PetMood
  name?: string
  moodLabel?: string
  size?: number
  interactive?: boolean
}>(), {
  name: 'Lumi',
  moodLabel: 'feliz',
  size: 144,
  interactive: false,
})

const emit = defineEmits<{ pet: [] }>()
const reacting = ref(false)
let reactionTimer: ReturnType<typeof setTimeout> | null = null

async function react() {
  if (reactionTimer) clearTimeout(reactionTimer)
  reacting.value = false
  await nextTick()
  reacting.value = true
  emit('pet')
  try { navigator.vibrate?.(18) } catch {}
  reactionTimer = setTimeout(() => { reacting.value = false }, 760)
}

defineExpose({ react })
onBeforeUnmount(() => { if (reactionTimer) clearTimeout(reactionTimer) })
</script>

<style scoped>
.pet-stage {
  --pet-size: 144px;
  position: relative;
  width: var(--pet-size);
  height: var(--pet-size);
  isolation: isolate;
}

.pet-stage--interactive { cursor: pointer; border-radius: 42%; outline: none; }
.pet-stage--interactive:focus-visible { box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 45%, transparent); }

.pet-stage__sprite {
  position: absolute;
  z-index: 2;
  inset: 0;
  overflow: hidden;
  animation: pet-breathe 3.2s steps(2, end) infinite;
  transform-origin: 50% 82%;
}

.pet-stage__sprite img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transform: scale(1.42);
  image-rendering: pixelated;
  user-select: none;
}

.pet-stage__ground {
  position: absolute;
  z-index: 1;
  left: 28%;
  right: 28%;
  bottom: 12%;
  height: 7%;
  border-radius: 50%;
  background: color-mix(in srgb, var(--accent) 24%, transparent);
  animation: pet-shadow 3.2s steps(2, end) infinite;
}

.pet-stage__spark {
  position: absolute;
  z-index: 3;
  color: #e4ad36;
  font-size: calc(var(--pet-size) * .1);
  line-height: 1;
  opacity: 0;
}

.pet-stage__spark--one { top: 18%; right: 14%; }
.pet-stage__spark--two { top: 36%; left: 13%; animation-delay: .45s !important; }

.pet-stage--happy .pet-stage__sprite,
.pet-stage--proud .pet-stage__sprite { animation-name: pet-hop; animation-duration: 2.3s; }

.pet-stage--happy .pet-stage__spark,
.pet-stage--proud .pet-stage__spark { animation: pet-spark 2.3s steps(3, end) infinite; }

.pet-stage--proud .pet-stage__spark { opacity: 1; }
.pet-stage--sleepy .pet-stage__sprite { animation-duration: 4.5s; filter: saturate(.84); }
.pet-stage--hungry .pet-stage__sprite { animation-duration: 4.8s; filter: saturate(.58) brightness(.9); }
.pet-stage--away .pet-stage__sprite { animation: none; filter: grayscale(1); opacity: .16; }
.pet-stage--away .pet-stage__ground { opacity: .2; }

.pet-stage__heart {
  position: absolute;
  z-index: 4;
  color: #d85f78;
  font-size: calc(var(--pet-size) * .12);
  line-height: 1;
  opacity: 0;
  pointer-events: none;
}
.pet-stage__heart--one { top: 22%; left: 18%; }
.pet-stage__heart--two { top: 10%; left: 47%; font-size: calc(var(--pet-size) * .09); }
.pet-stage__heart--three { top: 25%; right: 17%; animation-delay: .09s !important; }

.pet-stage--reacting .pet-stage__sprite { animation: pet-petted .76s steps(6, end) both !important; }
.pet-stage--reacting .pet-stage__ground { animation: pet-petted-shadow .76s steps(6, end) both !important; }
.pet-stage--reacting .pet-stage__heart { animation: pet-heart .76s var(--ease-out-expo) both; }

@keyframes pet-breathe {
  0%, 100% { transform: translateY(0) scaleY(1); }
  50% { transform: translateY(2%) scaleY(.985); }
}

@keyframes pet-hop {
  0%, 72%, 100% { transform: translateY(0) rotate(0); }
  80% { transform: translateY(-5%) rotate(-2deg); }
  88% { transform: translateY(0) rotate(2deg); }
}

@keyframes pet-shadow {
  0%, 100% { transform: scaleX(1); opacity: .7; }
  50% { transform: scaleX(.9); opacity: .48; }
}

@keyframes pet-spark {
  0%, 60%, 100% { transform: scale(.4) rotate(0); opacity: 0; }
  72% { transform: scale(1) rotate(18deg); opacity: 1; }
  86% { transform: scale(.72) rotate(35deg); opacity: .6; }
}

@keyframes pet-petted {
  0%, 100% { transform: translateY(0) rotate(0) scale(1); }
  18% { transform: translateY(-7%) rotate(-5deg) scale(1.04, .96); }
  38% { transform: translateY(-3%) rotate(5deg) scale(.97, 1.05); }
  58% { transform: translateY(-6%) rotate(-3deg) scale(1.03, .97); }
  78% { transform: translateY(1%) rotate(2deg) scale(.98, 1.02); }
}

@keyframes pet-petted-shadow {
  0%, 100% { transform: scaleX(1); opacity: .7; }
  30%, 65% { transform: scaleX(.7); opacity: .35; }
}

@keyframes pet-heart {
  0% { transform: translateY(14px) scale(.3) rotate(-8deg); opacity: 0; }
  28% { opacity: 1; }
  100% { transform: translateY(-20px) scale(1.12) rotate(10deg); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .pet-stage *, .pet-stage__sprite { animation: none !important; }
  .pet-stage--happy .pet-stage__spark,
  .pet-stage--proud .pet-stage__spark { opacity: 1; }
}
</style>
