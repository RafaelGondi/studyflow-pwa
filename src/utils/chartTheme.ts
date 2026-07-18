/** Resolve CSS custom properties for Chart.js (canvas cannot use var() directly). */
export function cssVar(name: string, fallback = ''): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

export function chartTheme() {
  const isDark = document.documentElement.dataset.theme === 'dark'
  return {
    text: cssVar('--text-tertiary'),
    grid: cssVar('--border'),
    border: cssVar('--border'),
    accent: cssVar('--accent'),
    accentSoft: cssVar('--accent-soft'),
    warning: cssVar('--warning'),
    bg: cssVar('--bg-elevated'),
    isDark,
  }
}
