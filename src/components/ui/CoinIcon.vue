<template>
  <!--
    A moeda do StudyFlow. Antes cada tela pegava um ícone diferente do Akoma
    (troféu na carteira, estrela no extrato), então a "moeda" não tinha cara
    própria — era só um número. Uma marca só, repetida em todo lugar, é o que
    transforma o número em moeda.
  -->
  <svg
    class="coin"
    :class="spinning && 'coin--spin'"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="12" cy="12" r="10.25" :fill="`url(#${gradientId})`" />
    <circle cx="12" cy="12" r="10.25" stroke="var(--coin-edge)" stroke-width="1.5" />
    <circle cx="12" cy="12" r="7" stroke="var(--coin-edge)" stroke-width="1" opacity="0.55" />
    <path
      d="M12 7.4l1.32 2.85 3.03.4-2.23 2.12.58 3.03L12 14.36l-2.7 1.44.58-3.03-2.23-2.12 3.03-.4L12 7.4z"
      fill="var(--coin-edge)"
    />
    <defs>
      <linearGradient :id="gradientId" x1="4" y1="3" x2="20" y2="21" gradientUnits="userSpaceOnUse">
        <stop stop-color="var(--coin-face-hi)" />
        <stop offset="1" stop-color="var(--coin-face-lo)" />
      </linearGradient>
    </defs>
  </svg>
</template>

<script setup lang="ts">
import { useId } from 'vue'

withDefaults(defineProps<{
  size?: number
  spinning?: boolean
}>(), {
  size: 18,
  spinning: false,
})

/* Vários ícones na mesma tela: id de gradiente duplicado faz um vazar no outro. */
const gradientId = `coin-face-${useId()}`
</script>

<style scoped>
.coin {
  flex-shrink: 0;
  display: block;
}

.coin--spin { animation: coin-spin 2.6s var(--ease-smooth) infinite; }

/* Gira no eixo Y — a moeda "vira", não roda no plano. */
@keyframes coin-spin {
  0%, 62%  { transform: rotateY(0deg); }
  82%      { transform: rotateY(180deg); }
  100%     { transform: rotateY(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .coin--spin { animation: none; }
}
</style>
