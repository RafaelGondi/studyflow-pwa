/** Resolve CSS custom properties for Chart.js (canvas cannot use var() directly). */
export function cssVar(name: string, fallback = ''): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

export function chartTheme() {
  const isDark = document.documentElement.dataset.theme === 'dark'
  return {
    text: cssVar('--text-tertiary'),
    grid: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(41,49,45,0.06)',
    border: cssVar('--border'),
    accent: cssVar('--accent'),
    warning: cssVar('--warning'),
    bg: cssVar('--bg-elevated'),
  }
}
