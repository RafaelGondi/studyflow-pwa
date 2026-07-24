import type { CompletionShade } from '@rafael_dias/akoma'

export {
  completionShade,
  completionShadeClass,
  completionShadeNeedsContrast,
  completionShadeColor,
  type CompletionShade,
} from '@rafael_dias/akoma'

/** Maps calendar heat level (0–4) to an Akoma completion shade. */
export function heatLevelToShade(level: number): CompletionShade {
  const map: CompletionShade[] = ['none', 'lighter', 'light', 'base', 'dark']
  return map[Math.min(Math.max(level, 0), map.length - 1)] ?? 'none'
}
