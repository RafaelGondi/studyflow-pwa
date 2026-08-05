import { ref } from 'vue'

export type ToastColor = 'success' | 'error' | 'neutral' | 'coin'

export interface AppToastItem {
  id: string
  title: string
  description?: string
  color: ToastColor
}

const toasts = ref<AppToastItem[]>([])

export function useAppToast() {
  function dismiss(id: string) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  function add(opts: {
    title: string
    description?: string
    color?: ToastColor
    duration?: number
  }) {
    const id = crypto.randomUUID()
    const item: AppToastItem = {
      id,
      title: opts.title,
      description: opts.description,
      color: opts.color ?? 'neutral',
    }
    toasts.value = [...toasts.value, item]
    window.setTimeout(() => dismiss(id), opts.duration ?? 3200)
  }

  return {
    toasts,
    dismiss,
    add,
    success: (title: string, description?: string) => add({ title, description, color: 'success' }),
    error: (title: string, description?: string) => add({ title, description, color: 'error' }),
    neutral: (title: string, description?: string) => add({ title, description, color: 'neutral' }),
    coin: (title: string, description?: string) => add({ title, description, color: 'coin', duration: 4200 }),
  }
}
