import { ref, onMounted, onUnmounted } from 'vue'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null)
const isInstallable = ref(false)
const isInstalled = ref(false)

function handleBeforeInstallPrompt(e: Event) {
  e.preventDefault()
  deferredPrompt.value = e as BeforeInstallPromptEvent
  isInstallable.value = true
}

function handleAppInstalled() {
  deferredPrompt.value = null
  isInstallable.value = false
  isInstalled.value = true
}

// Register listeners at module level so they persist across component mounts
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  window.addEventListener('appinstalled', handleAppInstalled)

  // Check if already running as installed PWA
  if (window.matchMedia('(display-mode: standalone)').matches) {
    isInstalled.value = true
  }
}

export function usePwaInstall() {
  async function install() {
    if (!deferredPrompt.value) return
    await deferredPrompt.value.prompt()
    const { outcome } = await deferredPrompt.value.userChoice
    if (outcome === 'accepted') {
      deferredPrompt.value = null
      isInstallable.value = false
    }
  }

  return { isInstallable, isInstalled, install }
}
