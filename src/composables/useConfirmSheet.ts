import { reactive } from 'vue'
import type { ButtonVariant } from '@rafael_dias/akoma'

type ConfirmOptions = {
  title: string
  message: string
  confirmLabel?: string
  confirmVariant?: ButtonVariant
}

const state = reactive<{
  open: boolean
  title: string
  message: string
  confirmLabel: string
  confirmVariant: ButtonVariant
}>({
  open: false,
  title: '',
  message: '',
  confirmLabel: 'Excluir',
  confirmVariant: 'danger',
})

let resolver: ((value: boolean) => void) | null = null

export function useConfirmSheet() {
  function ask(opts: ConfirmOptions): Promise<boolean> {
    state.title = opts.title
    state.message = opts.message
    state.confirmLabel = opts.confirmLabel ?? 'Excluir'
    state.confirmVariant = opts.confirmVariant ?? 'danger'
    state.open = true
    return new Promise((resolve) => {
      resolver = resolve
    })
  }

  function confirm() {
    state.open = false
    resolver?.(true)
    resolver = null
  }

  function cancel() {
    state.open = false
    resolver?.(false)
    resolver = null
  }

  return { state, ask, confirm, cancel }
}
