import * as icons from '@sysvale/cuida-icons'

/** kebab-case icon name → cIcons export, e.g. `home-outline` → cIconsHomeOutline */
export function getCuidaIcon(name: string): { name: string; data: string } | undefined {
  const exportName = 'cIcons' + name
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
  return (icons as unknown as Record<string, { name: string; data: string }>)[exportName]
}
