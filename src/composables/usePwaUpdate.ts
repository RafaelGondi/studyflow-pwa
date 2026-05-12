import { ref, onMounted } from 'vue'

export const hasUpdate = ref(false)
let waitingWorker: ServiceWorker | null = null

export function usePwaUpdate() {
  function setup() {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.ready.then(reg => {
      if (reg.waiting) {
        waitingWorker = reg.waiting
        hasUpdate.value = true
      }

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing
        if (!newWorker) return
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            waitingWorker = newWorker
            hasUpdate.value = true
          }
        })
      })
    })

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload()
    })
  }

  async function checkForUpdate() {
    if (!('serviceWorker' in navigator)) return
    const reg = await navigator.serviceWorker.ready
    await reg.update()
  }

  function applyUpdate() {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' })
    } else {
      window.location.reload()
    }
  }

  return { hasUpdate, setup, checkForUpdate, applyUpdate }
}
