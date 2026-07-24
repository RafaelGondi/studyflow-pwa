/**
 * Entity colors for subjects/categories — `--cat-*` only (accent stays system chrome).
 * Picker: 6 hue families × 3 shades + neutro, same contract as Habitify.
 */

export type SubjectColor = {
  name: string
  value: string
}

type CatIndex = 1 | 2 | 3 | 4 | 5 | 6
type Shade = 'light' | 'base' | 'dark'

function catSwatch(name: string, cat: CatIndex, shade: Shade): SubjectColor {
  const token = `var(--cat-${cat})`
  const value =
    shade === 'light'
      ? `color-mix(in srgb, ${token} 58%, white)`
      : shade === 'dark'
        ? `color-mix(in srgb, ${token} 68%, #121612)`
        : token

  return { name, value }
}

export const AKOMA_CAT_COLORS: SubjectColor[] = [
  catSwatch('Azul claro', 1, 'light'),
  catSwatch('Azul', 1, 'base'),
  catSwatch('Azul profundo', 1, 'dark'),

  catSwatch('Lilás', 2, 'light'),
  catSwatch('Violeta', 2, 'base'),
  catSwatch('Uva', 2, 'dark'),

  catSwatch('Areia', 3, 'light'),
  catSwatch('Âmbar', 3, 'base'),
  catSwatch('Terracota', 3, 'dark'),

  catSwatch('Menta', 4, 'light'),
  catSwatch('Botânico', 4, 'base'),
  catSwatch('Floresta', 4, 'dark'),

  catSwatch('Pêssego', 5, 'light'),
  catSwatch('Rosé', 5, 'base'),
  catSwatch('Vinho', 5, 'dark'),

  catSwatch('Névoa', 6, 'light'),
  catSwatch('Ardósia', 6, 'base'),
  catSwatch('Pedra', 6, 'dark'),

  {
    name: 'Neutro',
    value: 'var(--border-strong)',
  },
]

/** Default for new subjects/categories */
export const DEFAULT_SUBJECT_COLOR = AKOMA_CAT_COLORS[1].value // Azul base

/** @deprecated prefer AKOMA_CAT_COLORS — kept for existing imports */
export const SUBJECT_COLORS = AKOMA_CAT_COLORS

const PALETTE_SET = new Set(AKOMA_CAT_COLORS.map(c => c.value))

/** Legacy hex (Tailwind / old accent swatches) → current `--cat-*` tokens */
const LEGACY_COLOR_MAP: Record<string, string> = {
  '#578eae': 'var(--cat-1)',
  '#896db9': 'var(--cat-2)',
  '#bf8230': 'var(--cat-3)',
  '#518768': 'var(--cat-4)',
  '#bd697c': 'var(--cat-5)',
  '#827e6c': 'var(--cat-6)',
  '#5184b1': 'var(--cat-1)',
  '#4b99a4': 'var(--cat-4)',
  '#3c8866': 'var(--cat-4)',
  '#8375cc': 'var(--cat-2)',
  '#bc8a3b': 'var(--cat-3)',
  '#d07b5f': 'var(--cat-5)',
  '#5e7894': 'var(--cat-1)',
  '#c36d80': 'var(--cat-5)',
  '#ef4444': 'var(--cat-5)',
  '#f43f5e': 'var(--cat-5)',
  '#ec4899': 'var(--cat-5)',
  '#d946ef': 'var(--cat-2)',
  '#a855f7': 'var(--cat-2)',
  '#8b5cf6': 'var(--cat-2)',
  '#6366f1': 'var(--cat-2)',
  '#3b82f6': 'var(--cat-1)',
  '#0ea5e9': 'var(--cat-1)',
  '#06b6d4': 'var(--cat-4)',
  '#14b8a6': 'var(--cat-4)',
  '#10b981': 'var(--cat-4)',
  '#84cc16': 'var(--cat-4)',
  '#f59e0b': 'var(--cat-3)',
  '#f97316': 'var(--cat-3)',
  '#78716c': 'var(--cat-6)',
  '#3d6a94': 'var(--cat-1)',
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

/** Approximate RGB for `--cat-*` bases (from Akoma tokens) for nearest-match. */
const CAT_BASE_RGB: Record<string, [number, number, number]> = {
  'var(--cat-1)': [87, 142, 174],
  'var(--cat-2)': [137, 109, 185],
  'var(--cat-3)': [191, 130, 48],
  'var(--cat-4)': [81, 135, 104],
  'var(--cat-5)': [189, 105, 124],
  'var(--cat-6)': [130, 126, 108],
}

function closestCatToken(hex: string): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return DEFAULT_SUBJECT_COLOR

  let best = DEFAULT_SUBJECT_COLOR
  let bestDist = Infinity
  for (const [token, catRgb] of Object.entries(CAT_BASE_RGB)) {
    const dist =
      (rgb[0] - catRgb[0]) ** 2
      + (rgb[1] - catRgb[1]) ** 2
      + (rgb[2] - catRgb[2]) ** 2
    if (dist < bestDist) {
      bestDist = dist
      best = token
    }
  }
  return best
}

/** Ensures displayed/stored color is a current palette value. */
export function normalizeAkomaColor(color: string | undefined | null): string {
  if (!color) return DEFAULT_SUBJECT_COLOR
  const c = color.trim()
  if (PALETTE_SET.has(c)) return c
  const lower = c.toLowerCase()
  if (LEGACY_COLOR_MAP[lower]) return LEGACY_COLOR_MAP[lower]
  if (lower.startsWith('var(--cat-') || lower.startsWith('color-mix(')) return c
  if (lower.startsWith('#')) return closestCatToken(lower)
  return DEFAULT_SUBJECT_COLOR
}

export function isAkomaColor(color: string): boolean {
  return PALETTE_SET.has(color.trim())
}

/** Soft wash for avatars and chips */
export function subjectBgMix(color: string | undefined | null, pct = 14): string {
  return `color-mix(in srgb, ${normalizeAkomaColor(color)} ${pct}%, var(--bg-soft))`
}

export function resolveSubjectColor(color: string | undefined | null): string {
  return normalizeAkomaColor(color)
}

/**
 * Resolve token / color-mix values to a concrete color for Canvas (Chart.js).
 */
export function resolvePaintColor(color: string | undefined | null): string {
  const c = normalizeAkomaColor(color)
  if (c.startsWith('#')) return c
  if (typeof document === 'undefined') return '#578eae'

  const probe = document.createElement('span')
  probe.style.color = c
  probe.style.display = 'none'
  document.body.appendChild(probe)
  const resolved = getComputedStyle(probe).color
  document.body.removeChild(probe)
  return resolved || '#578eae'
}
