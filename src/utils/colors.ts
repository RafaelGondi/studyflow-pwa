/** Paleta oficial de domínio do Akoma (`--cat-1` … `--cat-6`) */
export const AKOMA_CAT_COLORS = [
  { name: 'Mar',    token: '--cat-1', value: '#578eae' },
  { name: 'Violeta', token: '--cat-2', value: '#896db9' },
  { name: 'Âmbar',  token: '--cat-3', value: '#bf8230' },
  { name: 'Verde',  token: '--cat-4', value: '#518768' },
  { name: 'Rosa',   token: '--cat-5', value: '#bd697c' },
  { name: 'Pedra',  token: '--cat-6', value: '#827e6c' },
] as const

/** @deprecated use AKOMA_CAT_COLORS */
export const SUBJECT_COLORS = AKOMA_CAT_COLORS.map(({ name, value }) => ({
  name: name.toLowerCase(),
  value,
}))

const PALETTE = AKOMA_CAT_COLORS.map(c => c.value.toLowerCase())
const PALETTE_SET = new Set(PALETTE)

/** Mapeia cores legadas (Tailwind) para a paleta Akoma mais próxima */
const LEGACY_COLOR_MAP: Record<string, string> = {
  '#ef4444': '#bd697c',
  '#f43f5e': '#bd697c',
  '#ec4899': '#bd697c',
  '#d946ef': '#896db9',
  '#a855f7': '#896db9',
  '#8b5cf6': '#896db9',
  '#6366f1': '#896db9',
  '#3b82f6': '#578eae',
  '#0ea5e9': '#578eae',
  '#06b6d4': '#578eae',
  '#14b8a6': '#518768',
  '#10b981': '#518768',
  '#84cc16': '#518768',
  '#f59e0b': '#bf8230',
  '#f97316': '#bf8230',
  '#78716c': '#827e6c',
  '#3d6a94': '#578eae',
}

function hexToRgb(hex: string): [number, number, number] | null {
  let h = hex.replace('#', '').trim().toLowerCase()
  if (h.length === 3) h = h.split('').map(ch => ch + ch).join('')
  if (h.length !== 6 || !/^[0-9a-f]+$/.test(h)) return null
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

function rgbDistance(a: [number, number, number], b: [number, number, number]) {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2
}

function closestPaletteColor(hex: string): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return AKOMA_CAT_COLORS[0].value

  let best: string = AKOMA_CAT_COLORS[0].value
  let bestDist = Infinity
  for (const cat of AKOMA_CAT_COLORS) {
    const catRgb = hexToRgb(cat.value)
    if (!catRgb) continue
    const dist = rgbDistance(rgb, catRgb)
    if (dist < bestDist) {
      bestDist = dist
      best = cat.value
    }
  }
  return best
}

/** Garante que a cor exibida/gravada pertence à paleta Akoma */
export function normalizeAkomaColor(color: string | undefined | null): string {
  if (!color) return AKOMA_CAT_COLORS[0].value
  const c = color.trim().toLowerCase()
  if (PALETTE_SET.has(c)) return c
  if (LEGACY_COLOR_MAP[c]) return LEGACY_COLOR_MAP[c]
  return closestPaletteColor(c)
}

export function isAkomaColor(color: string): boolean {
  return PALETTE_SET.has(color.trim().toLowerCase())
}

/** Fundo suave para avatares e chips com cor de matéria */
export function subjectBgMix(color: string | undefined | null, pct = 14): string {
  return `color-mix(in srgb, ${normalizeAkomaColor(color)} ${pct}%, var(--bg-soft))`
}

/** Cor resolvida para matéria/categoria (sempre da paleta Akoma) */
export function resolveSubjectColor(color: string | undefined | null): string {
  return normalizeAkomaColor(color)
}
