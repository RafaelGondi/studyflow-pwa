declare module '@rafael_dias/akoma' {
  import type { DefineComponent, Plugin } from 'vue'

  export const Akoma: Plugin
  export const AkAmbientBg: DefineComponent<{ contained?: boolean }>
  export const AkBadge: DefineComponent<{ variant?: string; label?: string }>
  export const AkButton: DefineComponent<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    disabled?: boolean
    loading?: boolean
    type?: 'button' | 'submit' | 'reset'
    block?: boolean
  }>
  export const AkCard: DefineComponent<{ interactive?: boolean; padding?: 'none' | 'sm' | 'md' | 'lg' }>
  export const AkChip: DefineComponent<{ active?: boolean; disabled?: boolean; color?: string }>
  export const AkDivider: DefineComponent<{ label?: string; vertical?: boolean }>
  export const AkEmptyState: DefineComponent<{ title: string; description?: string }>
  export const AkIconButton: DefineComponent<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    disabled?: boolean
    loading?: boolean
    type?: 'button' | 'submit' | 'reset'
    label?: string
  }>
  export const AkInput: DefineComponent<{
    modelValue?: string | number
    label?: string
    placeholder?: string
    hint?: string
    error?: string
    type?: string
    disabled?: boolean
    required?: boolean
    size?: 'sm' | 'md' | 'lg'
  }>
  export const AkList: DefineComponent
  export const AkListRow: DefineComponent<{
    interactive?: boolean
    disabled?: boolean
    padding?: 'sm' | 'md' | 'lg'
    divider?: boolean
  }>
  export const AkProgress: DefineComponent<{
    value?: number
    max?: number
    size?: 'sm' | 'md' | 'lg'
    color?: string
    label?: string
    showValue?: boolean
  }>
  export const AkSectionHeader: DefineComponent<{ title?: string }>
  export const AkShimmer: DefineComponent<{ width?: string; height?: string; radius?: string }>
  export const AkSwitch: DefineComponent<{
    modelValue?: boolean
    label?: string
    description?: string
    disabled?: boolean
  }>
  export const AkTextarea: DefineComponent<{
    modelValue?: string
    label?: string
    placeholder?: string
    hint?: string
    error?: string
    disabled?: boolean
    required?: boolean
    rows?: number
  }>
}
