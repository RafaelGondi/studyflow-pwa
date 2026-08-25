<template>
  <div
    class="pet-stage"
    :class="[
      `pet-stage--${mood}`,
      `pet-stage--facing-${facing}`,
      idleAnimation && `pet-stage--idle-${idleAnimation}`,
      {
        'pet-stage--interactive': interactive,
        'pet-stage--reacting': reacting,
        'pet-stage--blinking': blinking,
        'pet-stage--bond-glow': bondLevel >= 4,
        'pet-stage--bond-aura': bondLevel >= 7,
        'pet-stage--evolved': bondLevel >= 10,
      },
    ]"
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
      <div class="pet-stage__art">
        <img src="/pets/lumi.png" alt="" draggable="false" />
        <span class="pet-stage__eyelid pet-stage__eyelid--left" aria-hidden="true" />
        <span class="pet-stage__eyelid pet-stage__eyelid--right" aria-hidden="true" />
      </div>
    </div>
    <span class="pet-stage__heart pet-stage__heart--one" aria-hidden="true">♥</span>
    <span class="pet-stage__heart pet-stage__heart--two" aria-hidden="true">♥</span>
    <span class="pet-stage__heart pet-stage__heart--three" aria-hidden="true">♥</span>
    <span class="pet-stage__ground" aria-hidden="true" />
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { PetMood } from '@/types'

const props = withDefaults(defineProps<{
  mood: PetMood
  name?: string
  moodLabel?: string
  size?: number
  interactive?: boolean
  facing?: 'left' | 'right'
  bondLevel?: number
}>(), {
  name: 'Lumi',
  moodLabel: 'feliz',
  size: 144,
  interactive: false,
  facing: 'right',
  bondLevel: 0,
})

const emit = defineEmits<{ pet: [] }>()
const reacting = ref(false)
const blinking = ref(false)
type IdleAnimation = 'look' | 'stretch' | 'doze' | 'wobble' | 'bounce' | 'celebrate' | 'dance' | 'flicker'
const idleAnimation = ref<IdleAnimation | ''>('')
let reactionTimer: ReturnType<typeof setTimeout> | null = null
let idleTimer: ReturnType<typeof setTimeout> | null = null
let idleResetTimer: ReturnType<typeof setTimeout> | null = null
let blinkTimer: ReturnType<typeof setTimeout> | null = null
let blinkResetTimer: ReturnType<typeof setTimeout> | null = null

const moodAnimations: Record<PetMood, IdleAnimation[]> = {
  sleepy: ['doze', 'stretch', 'look'],
  bored: ['look', 'doze', 'wobble'],
  hungry: ['wobble', 'doze', 'look'],
  nostalgic: ['look', 'doze', 'wobble'],
  curious: ['look', 'stretch', 'bounce'],
  focused: ['look', 'stretch'],
  happy: ['bounce', 'look', 'celebrate', 'dance'],
  excited: ['bounce', 'celebrate', 'dance', 'look'],
  tired: ['doze', 'stretch', 'look'],
  proud: ['celebrate', 'bounce', 'look', 'dance'],
  away: ['flicker'],
}

const animationUnlockLevel: Partial<Record<IdleAnimation, number>> = {
  stretch: 1,
  bounce: 2,
  celebrate: 3,
  dance: 6,
}

function clearIdleTimers() {
  if (idleTimer) clearTimeout(idleTimer)
  if (idleResetTimer) clearTimeout(idleResetTimer)
  idleTimer = null
  idleResetTimer = null
}

function clearBlinkTimers() {
  if (blinkTimer) clearTimeout(blinkTimer)
  if (blinkResetTimer) clearTimeout(blinkResetTimer)
  blinkTimer = null
  blinkResetTimer = null
}

function scheduleBlink(delay = 2600 + Math.random() * 5200) {
  clearBlinkTimers()
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.hidden || props.mood === 'away') return
  blinkTimer = setTimeout(() => blink(Math.random() < .22), delay)
}

function blink(doubleBlink = false) {
  blinking.value = true
  blinkResetTimer = setTimeout(() => {
    blinking.value = false
    if (doubleBlink) {
      blinkTimer = setTimeout(() => {
        blinking.value = true
        blinkResetTimer = setTimeout(() => {
          blinking.value = false
          scheduleBlink()
        }, 220)
      }, 130)
    } else scheduleBlink()
  }, 230)
}

function scheduleIdle(delay = 4200 + Math.random() * 4200) {
  clearIdleTimers()
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.hidden) return
  idleTimer = setTimeout(() => {
    const options = moodAnimations[props.mood].filter(animation =>
      props.bondLevel >= (animationUnlockLevel[animation] ?? 0))
    playIdle(options[Math.floor(Math.random() * options.length)])
  }, delay)
}

async function playIdle(animation: IdleAnimation) {
  idleAnimation.value = ''
  await nextTick()
  idleAnimation.value = animation
  idleResetTimer = setTimeout(() => {
    idleAnimation.value = ''
    scheduleIdle()
  }, animation === 'celebrate' ? 1500 : 1250)
}

function handleVisibility() {
  if (document.hidden) {
    clearIdleTimers()
    clearBlinkTimers()
  } else {
    scheduleIdle(1800)
    scheduleBlink(1200)
  }
}

async function react() {
  if (reactionTimer) clearTimeout(reactionTimer)
  reacting.value = false
  await nextTick()
  reacting.value = true
  idleAnimation.value = ''
  clearIdleTimers()
  emit('pet')
  try { navigator.vibrate?.(18) } catch {}
  reactionTimer = setTimeout(() => {
    reacting.value = false
    scheduleIdle()
  }, 760)
}

defineExpose({ react })
watch(() => props.mood, (mood, previous) => {
  if (mood === 'proud' && previous !== 'proud') void playIdle('celebrate')
  else scheduleIdle(1200)
  scheduleBlink(900 + Math.random() * 1000)
})
onMounted(() => {
  scheduleIdle(1800 + Math.random() * 1800)
  scheduleBlink(1400 + Math.random() * 2200)
  document.addEventListener('visibilitychange', handleVisibility)
})
onBeforeUnmount(() => {
  if (reactionTimer) clearTimeout(reactionTimer)
  clearIdleTimers()
  clearBlinkTimers()
  document.removeEventListener('visibilitychange', handleVisibility)
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

.pet-stage__art {
  position: absolute;
  inset: 0;
  transition: transform .2s steps(2, end);
  transform-origin: 50% 55%;
}

.pet-stage--facing-left .pet-stage__art { transform: scaleX(-1); }

.pet-stage__art img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transform: scale(1.42);
  image-rendering: pixelated;
  user-select: none;
}

.pet-stage__eyelid {
  position: absolute;
  z-index: 2;
  top: 48.2%;
  width: 10.5%;
  height: 11%;
  border-radius: 45% 45% 50% 50%;
  background: #f3dfae;
  opacity: 0;
  transform: scaleY(.35);
  transform-origin: center;
  pointer-events: none;
}
.pet-stage__eyelid::after {
  content: '';
  position: absolute;
  left: 10%;
  right: 10%;
  top: 56%;
  height: max(2px, calc(var(--pet-size) * .012));
  border-radius: 999px;
  background: #17394a;
}
.pet-stage__eyelid--left { left: 33.2%; }
.pet-stage__eyelid--right { right: 33.2%; }
.pet-stage--blinking .pet-stage__eyelid { opacity: 1; transform: scaleY(1); }

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
.pet-stage--excited .pet-stage__sprite,
.pet-stage--proud .pet-stage__sprite { animation-name: pet-hop; animation-duration: 2.3s; }

.pet-stage--happy .pet-stage__spark,
.pet-stage--excited .pet-stage__spark,
.pet-stage--proud .pet-stage__spark { animation: pet-spark 2.3s steps(3, end) infinite; }

.pet-stage--proud .pet-stage__spark { opacity: 1; }
.pet-stage--sleepy .pet-stage__sprite { animation-duration: 4.5s; filter: saturate(.84); }
.pet-stage--bored .pet-stage__sprite { animation-duration: 4.2s; filter: saturate(.88); }
.pet-stage--hungry .pet-stage__sprite { animation-duration: 4.8s; filter: saturate(.58) brightness(.9); }
.pet-stage--nostalgic .pet-stage__sprite { animation-duration: 4.4s; filter: saturate(.68) brightness(.94); }
.pet-stage--focused .pet-stage__sprite { animation-duration: 2.8s; filter: saturate(1.06) drop-shadow(0 0 3px color-mix(in srgb, var(--accent) 45%, transparent)); }
.pet-stage--focused .pet-stage__ground { background: color-mix(in srgb, var(--accent) 42%, transparent); }
.pet-stage--excited .pet-stage__sprite { animation-duration: 1.65s; filter: saturate(1.15); }
.pet-stage--excited .pet-stage__spark { animation-duration: 1.65s; }
.pet-stage--tired .pet-stage__sprite { animation-duration: 5.2s; filter: saturate(.78) brightness(.96); }
.pet-stage--tired .pet-stage__eyelid { opacity: .36; transform: scaleY(.62); }
.pet-stage--away .pet-stage__sprite { animation: none; filter: grayscale(1); opacity: .16; }
.pet-stage--away .pet-stage__ground { opacity: .2; }
.pet-stage--bond-glow .pet-stage__ground { box-shadow: 0 0 calc(var(--pet-size) * .12) color-mix(in srgb, #e4ad36 45%, transparent); }
.pet-stage--bond-aura::before { content: ''; position: absolute; inset: 15%; border-radius: 50%; background: radial-gradient(circle, color-mix(in srgb, var(--accent) 22%, transparent), transparent 68%); filter: blur(5px); animation: pet-aura 3.4s ease-in-out infinite; }
.pet-stage--evolved .pet-stage__art img { filter: saturate(1.16) drop-shadow(0 0 4px #f4d77d); }

/* Pequenos gestos ocasionais. `steps` mantém o movimento com ritmo de sprite. */
.pet-stage--idle-look .pet-stage__sprite { animation: pet-look 1.2s steps(6, end) both !important; }
.pet-stage--idle-stretch .pet-stage__sprite { animation: pet-stretch 1.2s steps(5, end) both !important; }
.pet-stage--idle-doze .pet-stage__sprite { animation: pet-doze 1.25s steps(5, end) both !important; }
.pet-stage--idle-wobble .pet-stage__sprite { animation: pet-wobble 1.2s steps(7, end) both !important; }
.pet-stage--idle-bounce .pet-stage__sprite { animation: pet-bounce 1.15s steps(7, end) both !important; }
.pet-stage--idle-celebrate .pet-stage__sprite { animation: pet-celebrate 1.45s steps(9, end) both !important; }
.pet-stage--idle-dance .pet-stage__sprite { animation: pet-dance 1.65s steps(10, end) both !important; }
.pet-stage--idle-flicker .pet-stage__sprite { animation: pet-flicker 1.25s steps(4, end) both !important; }
.pet-stage--idle-bounce .pet-stage__ground,
.pet-stage--idle-celebrate .pet-stage__ground { animation: pet-bounce-shadow 1.2s steps(6, end) both !important; }
.pet-stage--idle-celebrate .pet-stage__spark { animation: pet-celebrate-spark 1.45s steps(5, end) both !important; }
.pet-stage--idle-dance .pet-stage__spark { animation: pet-celebrate-spark 1.65s steps(5, end) both !important; }

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

@keyframes pet-look {
  0%, 100% { transform: translateX(0) rotate(0); }
  22%, 42% { transform: translateX(-3%) rotate(-2deg); }
  58%, 78% { transform: translateX(3%) rotate(2deg); }
}

@keyframes pet-stretch {
  0%, 100% { transform: scale(1); }
  25% { transform: translateY(3%) scale(1.06, .92); }
  52% { transform: translateY(-3%) scale(.94, 1.08); }
  74% { transform: translateY(1%) scale(1.03, .97); }
}

@keyframes pet-doze {
  0%, 100% { transform: translateY(0) rotate(0); }
  28% { transform: translateY(4%) rotate(-3deg) scaleY(.97); }
  48% { transform: translateY(5%) rotate(2deg) scaleY(.95); }
  68% { transform: translateY(2%) rotate(-1deg); }
}

@keyframes pet-wobble {
  0%, 100% { transform: translateX(0) rotate(0) scaleY(1); }
  18% { transform: translateX(-2%) rotate(-3deg) scaleY(.98); }
  36% { transform: translateX(2%) rotate(3deg) scaleY(.96); }
  54% { transform: translateX(-2%) rotate(-2deg) scaleY(.97); }
  72% { transform: translateX(1%) rotate(2deg) scaleY(.99); }
}

@keyframes pet-bounce {
  0%, 100% { transform: translateY(0) scale(1); }
  18% { transform: translateY(2%) scale(1.05, .94); }
  36% { transform: translateY(-8%) scale(.97, 1.04); }
  52% { transform: translateY(0) scale(1.04, .96); }
  68% { transform: translateY(-4%) scale(.99, 1.02); }
  82% { transform: translateY(0) scale(1.02, .98); }
}

@keyframes pet-celebrate {
  0%, 100% { transform: translateY(0) rotate(0) scale(1); }
  15% { transform: translateY(2%) rotate(-4deg) scale(1.05, .94); }
  32% { transform: translateY(-10%) rotate(7deg) scale(.96, 1.05); }
  48% { transform: translateY(-6%) rotate(-7deg); }
  64% { transform: translateY(-9%) rotate(5deg); }
  80% { transform: translateY(1%) rotate(-2deg) scale(1.04, .96); }
}

@keyframes pet-dance {
  0%, 100% { transform: translate(0, 0) rotate(0) scale(1); }
  12% { transform: translate(-5%, -2%) rotate(-7deg) scale(1.02); }
  25% { transform: translate(4%, -7%) rotate(7deg) scale(.98, 1.04); }
  38% { transform: translate(-4%, -3%) rotate(-6deg); }
  52% { transform: translate(5%, -8%) rotate(8deg) scale(.97, 1.05); }
  66% { transform: translate(-3%, -4%) rotate(-5deg); }
  80% { transform: translate(3%, -7%) rotate(5deg); }
  91% { transform: translateY(1%) scale(1.04, .96); }
}

@keyframes pet-aura { 0%, 100% { transform: scale(.92); opacity: .45; } 50% { transform: scale(1.08); opacity: .82; } }

@keyframes pet-flicker {
  0%, 100% { opacity: .16; transform: translateY(0); }
  30% { opacity: .28; transform: translateY(-2%); }
  55% { opacity: .1; transform: translateY(1%); }
  78% { opacity: .22; transform: translateY(-1%); }
}

@keyframes pet-bounce-shadow {
  0%, 100% { transform: scaleX(1); opacity: .7; }
  35%, 68% { transform: scaleX(.62); opacity: .3; }
}

@keyframes pet-celebrate-spark {
  0%, 100% { transform: translateY(8px) scale(.3) rotate(0); opacity: 0; }
  28%, 72% { transform: translateY(-5px) scale(1) rotate(30deg); opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .pet-stage *, .pet-stage__sprite { animation: none !important; }
  .pet-stage--happy .pet-stage__spark,
  .pet-stage--excited .pet-stage__spark,
  .pet-stage--proud .pet-stage__spark { opacity: 1; }
}
</style>
