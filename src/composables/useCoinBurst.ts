import { ref } from 'vue'

export type BurstKind = 'earn' | 'redeem'

export interface CoinBurst {
  id: string
  kind: BurstKind
  /** Só no 'earn': quantas moedas entraram, exibido no meio da explosão. */
  amount?: number
  label?: string
}

const bursts = ref<CoinBurst[]>([])

function vibrate(pattern: number[]) {
  try { navigator.vibrate?.(pattern) } catch { /* sem suporte, sem problema */ }
}

/**
 * Celebração das moedas. Fica num singleton (fora do composable) porque quem
 * dispara — a Home, ao parar o timer — não é quem renderiza: o host mora no
 * App.vue, acima do router, então a animação sobrevive à troca de tela.
 */
export function useCoinBurst() {
  function dismiss(id: string) {
    bursts.value = bursts.value.filter(b => b.id !== id)
  }

  function fire(burst: Omit<CoinBurst, 'id'>) {
    const reduced = typeof matchMedia === 'function'
      && matchMedia('(prefers-reduced-motion: reduce)').matches

    vibrate(burst.kind === 'redeem' ? [30, 60, 30, 60, 80] : [25, 50, 25])
    if (reduced) return   // o toast já dá o retorno; sem partículas voando

    const id = crypto.randomUUID()
    bursts.value = [...bursts.value, { ...burst, id }]
    window.setTimeout(() => dismiss(id), 1900)
  }

  return { bursts, fire, dismiss }
}
