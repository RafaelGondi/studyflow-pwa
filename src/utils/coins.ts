/**
 * Utilidades de moeda. O ponto central aqui é `coinsAsStudyTime`: moeda solta
 * não diz nada ("faltam 320") — traduzida em tempo de estudo ela vira uma meta
 * ("faltam ~38 min"), que é a informação que faz alguém sentar pra estudar.
 */

export function formatCoins(value: number): string {
  if (value > 0 && value < 0.01) return '<0,01'
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
}

/** Moedas inteiras — usado em saldo, custo e tudo que o usuário compara. */
export function roundCoins(value: number): number {
  return Math.floor(value)
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
