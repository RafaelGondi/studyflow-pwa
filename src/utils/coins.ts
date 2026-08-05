import type { ActivityKind } from '@/types'

/**
 * Utilidades de moeda. O ponto central aqui é `coinsAsStudyTime`: moeda solta
 * não diz nada ("faltam 320") — traduzida em tempo de estudo ela vira uma meta
 * ("faltam ~38 min"), que é a informação que faz alguém sentar pra estudar.
 */

/**
 * Metais. A escada de câmbio É a tabela de pesos: uma hora de qualquer fonte
 * rende exatamente uma moeda do metal dela, e 1 ouro = 4 prata = 10 cobre.
 * Não são carteiras separadas — a conversão é automática e sem perda, então
 * o saldo continua sendo um número só e a recompensa, um preço só.
 */
export interface ActivityMeta {
  id: ActivityKind
  label: string
  metal: string
  /** Fração de uma hora de estudo que uma hora desta fonte vale. */
  multiplier: number
  /** Chave dos tokens CSS: --metal-{key}-hi / -lo / -tx / -bg */
  token: 'ouro' | 'prata' | 'cobre'
}

export const ACTIVITIES: ActivityMeta[] = [
  { id: 'estudo',   label: 'Estudo',   metal: 'Ouro',  multiplier: 1,    token: 'ouro' },
  { id: 'leitura',  label: 'Leitura',  metal: 'Prata', multiplier: 0.25, token: 'prata' },
  { id: 'trabalho', label: 'Trabalho', metal: 'Cobre', multiplier: 0.1,  token: 'cobre' },
]

export const DEFAULT_ACTIVITY: ActivityKind = 'estudo'

export function activityMeta(kind: ActivityKind | undefined | null): ActivityMeta {
  return ACTIVITIES.find(a => a.id === kind) ?? ACTIVITIES[0]
}

export function activityMultiplier(kind: ActivityKind | undefined | null): number {
  return activityMeta(kind).multiplier
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
