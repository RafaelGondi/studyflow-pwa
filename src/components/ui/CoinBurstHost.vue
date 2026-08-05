<template>
  <Teleport to="body">
    <div class="burst-host" aria-hidden="true">
      <div v-for="burst in bursts" :key="burst.id" class="burst">
        <span
          v-for="p in particles"
          :key="p.i"
          class="burst__coin"
          :style="{
            '--dx': `${p.dx}px`,
            '--rise': `${p.rise}px`,
            '--delay': `${p.delay}ms`,
            '--spin': `${p.spin}deg`,
          }"
        >
          <CoinIcon :size="burst.kind === 'redeem' ? 16 : 20" />
        </span>

        <p v-if="burst.amount != null" class="burst__amount numeric">
          +{{ formatCoins(burst.amount) }}
        </p>
        <p v-if="burst.label" class="burst__label">{{ burst.label }}</p>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import CoinIcon from '@/components/ui/CoinIcon.vue'
import { useCoinBurst } from '@/composables/useCoinBurst'
import { formatCoins } from '@/utils/coins'

const { bursts } = useCoinBurst()

/*
 * Trajetórias fixas em vez de sorteadas a cada disparo: um leque irregular mas
 * sempre igual lê como uma animação da marca, e não como ruído aleatório.
 */
const particles = [
  { i: 0, dx: -104, rise: 168, delay: 0,   spin: -220 },
  { i: 1, dx: -62,  rise: 232, delay: 55,  spin: 180 },
  { i: 2, dx: -24,  rise: 196, delay: 20,  spin: -140 },
  { i: 3, dx: 24,   rise: 244, delay: 90,  spin: 240 },
  { i: 4, dx: 66,   rise: 180, delay: 35,  spin: -200 },
  { i: 5, dx: 110,  rise: 214, delay: 120, spin: 160 },
  { i: 6, dx: -140, rise: 140, delay: 150, spin: 120 },
  { i: 7, dx: 142,  rise: 152, delay: 75,  spin: -260 },
]
</script>

<style scoped>
.burst-host {
  position: fixed;
  inset: 0;
  z-index: 300;
  pointer-events: none;
  overflow: hidden;
}

.burst {
  position: absolute;
  left: 50%;
  top: 58%;
}

.burst__coin {
  position: absolute;
  left: 0;
  top: 0;
  animation: burst-fly 1.5s var(--ease-out-expo) forwards;
  animation-delay: var(--delay);
  opacity: 0;
}

@keyframes burst-fly {
  0% {
    transform: translate(-50%, -50%) scale(0.3) rotate(0deg);
    opacity: 0;
  }
  18% {
    opacity: 1;
  }
  70% {
    opacity: 1;
  }
  100% {
    transform:
      translate(calc(-50% + var(--dx)), calc(-50% - var(--rise)))
      scale(1) rotate(var(--spin));
    opacity: 0;
  }
}

.burst__amount {
  position: absolute;
  left: 50%;
  top: 0;
  transform: translate(-50%, -50%);
  white-space: nowrap;
  font-family: var(--font-display);
  font-size: 44px;
  font-weight: 750;
  letter-spacing: -0.02em;
  color: var(--coin-face-lo);
  text-shadow: 0 2px 18px color-mix(in srgb, var(--coin-face-lo) 45%, transparent);
  animation: burst-amount 1.5s var(--ease-out-expo) forwards;
}

.burst__label {
  position: absolute;
  left: 50%;
  top: 34px;
  transform: translateX(-50%);
  white-space: nowrap;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-secondary);
  animation: burst-label 1.5s var(--ease-out-expo) forwards;
}

@keyframes burst-label {
  0%   { opacity: 0; transform: translate(-50%, 8px); }
  26%  { opacity: 1; transform: translate(-50%, 0); }
  74%  { opacity: 1; }
  100% { opacity: 0; transform: translate(-50%, -46px); }
}

@keyframes burst-amount {
  0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.72); }
  22%  { opacity: 1; transform: translate(-50%, -50%) scale(1.06); }
  34%  { transform: translate(-50%, -50%) scale(1); }
  74%  { opacity: 1; }
  100% { opacity: 0; transform: translate(-50%, -140%) scale(0.96); }
}
</style>
