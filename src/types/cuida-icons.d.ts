declare module '@sysvale/cuida-icons' {
  export interface CuidaIconExport {
    name: string
    data: string
  }

  export const cIconsHomeOutline: CuidaIconExport
  export const cIconsOpenBookOutline: CuidaIconExport
  export const cIconsChartColumnOutline: CuidaIconExport
  export const cIconsSettingsOutline: CuidaIconExport
  export const cIconsXOutline: CuidaIconExport
  export const cIconsPlusOutline: CuidaIconExport
  export const cIconsArrowLeftOutline: CuidaIconExport
  export const cIconsArrowRightOutline: CuidaIconExport
  export const cIconsPlayOutline: CuidaIconExport

  const icons: Record<string, CuidaIconExport>
  export default icons
}
