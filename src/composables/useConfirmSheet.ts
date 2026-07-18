import { reactive } from 'vue'

type ConfirmOptions = {
  title: string
  message: string
  confirmLabel?: string
}

const state = reactive({
  open: false,
  title: '',
  message: '',
  confirmLabel: 'Excluir',
})

let resolver: ((value: boolean) => void) | null = null

export function useConfirmSheet() {
  function ask(opts: ConfirmOptions): Promise<boolean> {
    state.title = opts.title
    state.message = opts.message
    state.confirmLabel = opts.confirmLabel ?? 'Excluir'
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
