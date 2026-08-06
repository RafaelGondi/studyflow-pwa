import type { ActivityKind } from '@/types'

/**
 * Utilidades de moeda. O ponto central aqui é `coinsAsStudyTime`: moeda solta
 * não diz nada ("faltam 320") — traduzida em tempo de estudo ela vira uma meta
 * ("faltam ~38 min"), que é a informação que faz alguém sentar pra estudar.
 */

/**
 * Metais.
 *
 * A taxa é a mesma para todas as fontes — uma hora rende 60 moedas, sempre.
 * O que faz uma hora de estudo valer mais que uma de trabalho não é render
 * mais moedas, é render moedas de um metal melhor. A escada carrega o peso:
 *
 *   1 ouro = 4 prata = 8 bronze
 *
 * Oito, e não dez, porque com dez a escada não fecha: 1 prata valeria 2,5
 * bronze e nenhuma quantidade inteira expressaria os três metais. Com oito o
 * bronze é a unidade base (1 prata = 2 bronze) e um minuto de trabalho vale
 * exatamente um bronze.
 */
export interface ActivityMeta {
  id: ActivityKind
  label: string
  metal: string
  /** Quantas moedas deste metal valem um ouro. É a escada. */
  perGold: number
  /** Chave dos tokens CSS: --metal-{token}-hi / -lo / -tx / -bg */
  token: 'ouro' | 'prata' | 'bronze'
}

export const ACTIVITIES: ActivityMeta[] = [
  { id: 'estudo',   label: 'Estudo',   metal: 'Ouro',   perGold: 1, token: 'ouro' },
  { id: 'leitura',  label: 'Leitura',  metal: 'Prata',  perGold: 4, token: 'prata' },
  { id: 'trabalho', label: 'Trabalho', metal: 'Bronze', perGold: 8, token: 'bronze' },
]

/** Texto do câmbio, para as telas que precisam ensiná-lo. */
export const EXCHANGE_LABEL = '1 ouro = 4 prata = 8 bronze'

export const DEFAULT_ACTIVITY: ActivityKind = 'estudo'

export function activityMeta(kind: ActivityKind | undefined | null): ActivityMeta {
  return ACTIVITIES.find(a => a.id === kind) ?? ACTIVITIES[0]
}

/**
 * Quantas moedas do metal daquela fonte correspondem a um valor em ouro.
 * O banco guarda tudo em ouro-equivalente; a tela conta no metal certo.
 */
export function coinsInMetal(goldValue: number, kind: ActivityKind | undefined | null): number {
  return goldValue * activityMeta(kind).perGold
}

/** Peso da hora. Derivado da escada, para os dois nunca saírem de sincronia. */
export function activityMultiplier(kind: ActivityKind | undefined | null): number {
  return 1 / activityMeta(kind).perGold
}

export function formatCoins(value: number): string {
  if (value > 0 && value < 0.01) return '<0,01'
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
}

/** Moedas inteiras — usado em saldo, custo e tudo que o usuário compara. */
export function roundCoins(value: number): number {
  return Math.floor(value)
}

/**
 * Faixas de recompensa.
 *
 * Definidas em HORAS DE ESTUDO, não em moedas: a taxa é configurável, então
 * um custo fixo significaria coisas diferentes para cada pessoa. "Uma hora de
 * estudo" significa a mesma coisa para todo mundo.
 *
 * As bordas (`maxHours`) são mais largas que as sugestões de propósito — elas
 * classificam o que o usuário digitou, enquanto `suggestedHours` é o chute
 * inicial de quem não faz ideia de quanto cobrar.
 */
export interface RewardTier {
  id: 'daily' | 'weekly' | 'monthly' | 'rare'
  label: string
  hint: string
  suggestedHours: number
  /** Limite superior da faixa, em horas. `Infinity` na última. */
  maxHours: number
}

export const REWARD_TIERS: RewardTier[] = [
  { id: 'daily',   label: 'Diária',  hint: 'Um prazer pequeno, quase todo dia',  suggestedHours: 1,  maxHours: 3 },
  { id: 'weekly',  label: 'Semanal', hint: 'O programa do fim de semana',        suggestedHours: 6,  maxHours: 15 },
  { id: 'monthly', label: 'Mensal',  hint: 'Uma compra que você adiaria',        suggestedHours: 25, maxHours: 40 },
  { id: 'rare',    label: 'Rara',    hint: 'Objetivo de meses',                  suggestedHours: 55, maxHours: Infinity },
]

export function tierForCost(cost: number, coinsPerHour: number): RewardTier {
  if (!Number.isFinite(cost) || cost <= 0 || coinsPerHour <= 0) return REWARD_TIERS[0]
  const hours = cost / coinsPerHour
  return REWARD_TIERS.find(tier => hours < tier.maxHours) ?? REWARD_TIERS[REWARD_TIERS.length - 1]
}

export function suggestedCost(tier: RewardTier, coinsPerHour: number): number {
  return Math.max(1, Math.round(tier.suggestedHours * coinsPerHour))
}

/** Quanto tempo de estudo, na taxa atual, vale `coins` moedas. */
export function coinsAsStudyTime(coins: number, coinsPerHour: number): string {
  if (coins <= 0 || coinsPerHour <= 0) return '0 min'
  const minutes = Math.ceil((coins / coinsPerHour) * 60)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  /* A partir de ~10h os minutos viram ruído: ninguém planeja "43h 24min". */
  if (hours >= 10 || rest === 0) return `${hours}h`
  return `${hours}h ${rest}min`
}
