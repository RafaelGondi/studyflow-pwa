/** Fundo suave para avatares e chips com cor de matéria */
export function subjectBgMix(color: string, pct = 14): string {
  return `color-mix(in srgb, ${color} ${pct}%, var(--bg-soft))`
}
