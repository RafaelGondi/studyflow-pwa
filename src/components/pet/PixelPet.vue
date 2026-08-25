<template>
  <div
    class="pet-stage"
    :class="`pet-stage--${mood}`"
    :style="{ '--pet-size': `${size}px` }"
    role="img"
    :aria-label="`${name}, mascote ${moodLabel.toLowerCase()}`"
  >
    <span class="pet-stage__spark pet-stage__spark--one">✦</span>
    <span class="pet-stage__spark pet-stage__spark--two">✦</span>
    <div class="pet-stage__sprite">
      <img src="/pets/lumi.png" alt="" draggable="false" />
    </div>
    <span class="pet-stage__ground" aria-hidden="true" />
  </div>
</template>

<script setup lang="ts">
import type { PetMood } from '@/types'

withDefaults(defineProps<{
  mood: PetMood
  name?: string
  moodLabel?: string
  size?: number
}>(), {
  name: 'Lumi',
  moodLabel: 'feliz',
  size: 144,
})
</script>

<style scoped>
.pet-stage {
  --pet-size: 144px;
  position: relative;
  width: var(--pet-size);
  height: var(--pet-size);
  isolation: isolate;
}

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

@media (prefers-reduced-motion: reduce) {
  .pet-stage *, .pet-stage__sprite { animation: none !important; }
  .pet-stage--happy .pet-stage__spark,
  .pet-stage--proud .pet-stage__spark { opacity: 1; }
}
</style>
