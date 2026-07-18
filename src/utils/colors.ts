/**
 * Cores de matéria/categoria do Akoma:
 * tokens --cat-* + acentos oficiais das paletas do DS.
 */
export const AKOMA_CAT_COLORS = [
  { name: 'Mar',       token: '--cat-1', value: '#578eae' },
  { name: 'Violeta',   token: '--cat-2', value: '#896db9' },
  { name: 'Âmbar',     token: '--cat-3', value: '#bf8230' },
  { name: 'Verde',     token: '--cat-4', value: '#518768' },
  { name: 'Rosa',      token: '--cat-5', value: '#bd697c' },
  { name: 'Pedra',     token: '--cat-6', value: '#827e6c' },
  { name: 'Oceano',    token: '--accent-ocean', value: '#5184b1' },
  { name: 'Teal',      token: '--accent-teal', value: '#4b99a4' },
  { name: 'Evergreen', token: '--accent-evergreen', value: '#3c8866' },
  { name: 'Lilás',     token: '--accent-violet', value: '#8375cc' },
  { name: 'Dourado',   token: '--accent-amber', value: '#bc8a3b' },
  { name: 'Coral',     token: '--accent-coral', value: '#d07b5f' },
  { name: 'Slate',     token: '--accent-slate', value: '#5e7894' },
  { name: 'Rubro',     token: '--accent-rose', value: '#c36d80' },
] as const

/** Cor padrão para novas matérias/categorias (primeira cor da paleta Akoma) */
export const DEFAULT_SUBJECT_COLOR = AKOMA_CAT_COLORS[0].value

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
  '#ec4899': '#c36d80',
  '#d946ef': '#896db9',
  '#a855f7': '#896db9',
  '#8b5cf6': '#8375cc',
  '#6366f1': '#8375cc',
  '#3b82f6': '#5184b1',
  '#0ea5e9': '#578eae',
  '#06b6d4': '#4b99a4',
  '#14b8a6': '#4b99a4',
  '#10b981': '#518768',
  '#84cc16': '#518768',
  '#f59e0b': '#bf8230',
  '#f97316': '#d07b5f',
  '#78716c': '#827e6c',
  '#3d6a94': '#5184b1',
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
  if (!rgb) return DEFAULT_SUBJECT_COLOR

  let best: string = DEFAULT_SUBJECT_COLOR
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
  if (!color) return DEFAULT_SUBJECT_COLOR
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
