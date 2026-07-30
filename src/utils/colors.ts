/**
 * Entity colors for subjects/categories.
 * Each swatch maps directly to one of the 11 Akoma accent palettes so the
 * picker faithfully represents the DS color vocabulary.
 */

export type SubjectColor = {
  name: string
  value: string
}

/** 11 swatches — one per Akoma accent palette (--accent base value). */
export const AKOMA_CAT_COLORS: SubjectColor[] = [
  { name: 'Violeta',   value: '#8375cc' },
  { name: 'Evergreen', value: '#3c8866' },
  { name: 'Sea',       value: '#469f8b' },
  { name: 'Teal',      value: '#4b99a4' },
  { name: 'Ocean',     value: '#5184b1' },
  { name: 'Âmbar',     value: '#b68639' },
  { name: 'Rosé',      value: '#c36d80' },
  { name: 'Clay',      value: '#c65b58' },
  { name: 'Coral',     value: '#cb7954' },
  { name: 'Plum',      value: '#ab73af' },
  { name: 'Ardósia',   value: '#5e7894' },
]

/** Default for new subjects/categories */
export const DEFAULT_SUBJECT_COLOR = '#5184b1' // Ocean

/** @deprecated prefer AKOMA_CAT_COLORS — kept for existing imports */
export const SUBJECT_COLORS = AKOMA_CAT_COLORS

const PALETTE_SET = new Set(AKOMA_CAT_COLORS.map(c => c.value))

/** Old --cat-* vars and Tailwind-era hexes → current palette hex */
const LEGACY_COLOR_MAP: Record<string, string> = {
  // --cat-* variable references → nearest palette
  'var(--cat-1)': '#5184b1',
  'var(--cat-2)': '#8375cc',
  'var(--cat-3)': '#b68639',
  'var(--cat-4)': '#3c8866',
  'var(--cat-5)': '#c36d80',
  'var(--cat-6)': '#5e7894',
  // old cat base hex values
  '#578eae': '#5184b1',
  '#896db9': '#8375cc',
  '#bf8230': '#b68639',
  '#518768': '#3c8866',
  '#bd697c': '#c36d80',
  '#827e6c': '#5e7894',
  // previously used accent base hexes
  '#5184b1': '#5184b1',
  '#4b99a4': '#4b99a4',
  '#3c8866': '#3c8866',
  '#8375cc': '#8375cc',
  '#bc8a3b': '#b68639',
  '#b68639': '#b68639',
  '#d07b5f': '#cb7954',
  '#ce7659': '#cb7954',
  '#cb7954': '#cb7954',
  '#5e7894': '#5e7894',
  '#c36d80': '#c36d80',
  '#3d6a94': '#5184b1',
  // Tailwind-era colors
  '#ef4444': '#c36d80',
  '#f43f5e': '#cb7954',
  '#ec4899': '#c36d80',
  '#d946ef': '#8375cc',
  '#a855f7': '#8375cc',
  '#8b5cf6': '#8375cc',
  '#6366f1': '#5184b1',
  '#3b82f6': '#5184b1',
  '#0ea5e9': '#4b99a4',
  '#06b6d4': '#4b99a4',
  '#14b8a6': '#4b99a4',
  '#10b981': '#3c8866',
  '#84cc16': '#3c8866',
  '#f59e0b': '#b68639',
  '#f97316': '#cb7954',
  '#78716c': '#5e7894',
}

/** Approximate RGB per palette for nearest-match fallback. */
const PALETTE_BASE_RGB: Record<string, [number, number, number]> = {
  '#8375cc': [131, 117, 204],
  '#3c8866': [ 60, 136, 102],
  '#469f8b': [ 70, 159, 139],
  '#4b99a4': [ 75, 153, 164],
  '#5184b1': [ 81, 132, 177],
  '#b68639': [182, 134,  57],
  '#c36d80': [195, 109, 128],
  '#c65b58': [198,  91,  88],
  '#cb7954': [203, 121,  84],
  '#ab73af': [171, 115, 175],
  '#5e7894': [ 94, 120, 148],
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

function closestPalette(hex: string): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return DEFAULT_SUBJECT_COLOR

  let best = DEFAULT_SUBJECT_COLOR
  let bestDist = Infinity
  for (const [token, pRgb] of Object.entries(PALETTE_BASE_RGB)) {
    const dist =
      (rgb[0] - pRgb[0]) ** 2
      + (rgb[1] - pRgb[1]) ** 2
      + (rgb[2] - pRgb[2]) ** 2
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
  // color-mix(in srgb, var(--cat-*) ...) — extract cat number and remap
  const catMixMatch = lower.match(/color-mix\(in srgb,\s*var\(--cat-(\d)\)/)
  if (catMixMatch) {
    const mapped = LEGACY_COLOR_MAP[`var(--cat-${catMixMatch[1]})`]
    return mapped ?? DEFAULT_SUBJECT_COLOR
  }
  if (lower.startsWith('#')) return closestPalette(lower)
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
  if (typeof document === 'undefined') return '#5184b1'

  const probe = document.createElement('span')
  probe.style.color = c
  probe.style.display = 'none'
  document.body.appendChild(probe)
  const resolved = getComputedStyle(probe).color
  document.body.removeChild(probe)
  return resolved || '#5184b1'
}
