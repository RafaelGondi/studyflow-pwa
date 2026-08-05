<template>
  <!--
    Saldo que salta de 120 pra 170 não conta a história de que você ganhou 50.
    Contar até o valor faz o ganho ser percebido — é a diferença entre ver um
    número novo e ver o número subir.
  -->
  <span class="animated-number numeric">{{ display }}</span>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { formatCoins } from '@/utils/coins'

const props = withDefaults(defineProps<{
  value: number
  duration?: number
  /** Anima já na montagem (em vez de só nas mudanças seguintes). */
  animateOnMount?: boolean
}>(), {
  duration: 700,
  animateOnMount: false,
})

const current = ref(props.animateOnMount ? 0 : props.value)
const display = ref(formatCoins(Math.round(current.value)))

let frame = 0

const reduced = typeof matchMedia === 'function'
  && matchMedia('(prefers-reduced-motion: reduce)').matches

function easeOut(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

function animateTo(target: number) {
  cancelAnimationFrame(frame)

  const from = current.value
  const delta = target - from
  if (reduced || delta === 0 || props.duration <= 0) {
    current.value = target
    display.value = formatCoins(Math.round(target))
    return
  }

  const start = performance.now()
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / props.duration)
    current.value = from + delta * easeOut(t)
    display.value = formatCoins(Math.round(current.value))
    if (t < 1) frame = requestAnimationFrame(step)
  }
  frame = requestAnimationFrame(step)
}

watch(() => props.value, animateTo, { immediate: props.animateOnMount })
onUnmounted(() => cancelAnimationFrame(frame))
</script>

<style scoped>
.animated-number {
  font-variant-numeric: tabular-nums;
}
</style>
