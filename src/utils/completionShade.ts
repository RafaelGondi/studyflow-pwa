/** Níveis discretos mapeados às 5 tonalidades cromáticas do Akoma. */
export type CompletionShade =
  | 'none'
  | 'lighter'
  | 'light'
  | 'base'
  | 'dark'
  | 'darker'

/** Mapeia taxa 0–1 para um degrau de intensidade. */
export function completionShade(rate: number): CompletionShade {
  if (!Number.isFinite(rate) || rate <= 0) return 'none'
  if (rate < 0.25) return 'lighter'
  if (rate < 0.5) return 'light'
  if (rate < 0.75) return 'base'
  if (rate < 1) return 'dark'
  return 'darker'
}

export function completionShadeClass(shade: CompletionShade): string {
  return `completion-shade--${shade}`
}

export function completionShadeNeedsContrast(shade: CompletionShade): boolean {
  return shade === 'base' || shade === 'dark' || shade === 'darker'
}

/** Mapeia nível de calor do calendário (0–4) para shade Akoma. */
export function heatLevelToShade(level: number): CompletionShade {
  const map: CompletionShade[] = ['none', 'lighter', 'light', 'base', 'dark']
  return map[Math.min(Math.max(level, 0), map.length - 1)] ?? 'none'
}
