import { ref, onMounted, onUnmounted } from 'vue'

const ENABLED_KEY    = 'studyflow_facedown_focus'
const PERMISSION_KEY = 'studyflow_motion_permission'

// Singleton: um único listener para toda a aplicação
let listenerActive = false
const isFaceDown = ref(false)
const enabled    = ref(localStorage.getItem(ENABLED_KEY) === 'true')

function handleOrientation(e: DeviceOrientationEvent) {
  if (!enabled.value) return
  const beta  = e.beta  ?? 0
  const gamma = e.gamma ?? 0
  // Face-down: beta perto de ±180 (tela virada pra baixo), gamma perto de 0 (plano)
  isFaceDown.value = Math.abs(Math.abs(beta) - 180) < 30 && Math.abs(gamma) < 40
}

function startListener() {
  if (listenerActive) return
  window.addEventListener('deviceorientation', handleOrientation)
  listenerActive = true
}

function stopListener() {
  window.removeEventListener('deviceorientation', handleOrientation)
  listenerActive = false
  isFaceDown.value = false
}

/** Detecta se estamos no iOS (exige requestPermission) */
function needsIosPermission(): boolean {
  return (
    typeof DeviceOrientationEvent !== 'undefined' &&
    typeof (DeviceOrientationEvent as any).requestPermission === 'function'
  )
}

/** Pede permissão (iOS) ou retorna true direto (Android/desktop) */
async function requestPermission(): Promise<'granted' | 'denied' | 'unavailable'> {
  if (typeof DeviceOrientationEvent === 'undefined') return 'unavailable'

  if (needsIosPermission()) {
    try {
      const result = await (DeviceOrientationEvent as any).requestPermission()
      localStorage.setItem(PERMISSION_KEY, result)
      return result === 'granted' ? 'granted' : 'denied'
    } catch {
      return 'denied'
    }
  }

  // Android / desktop: sem permissão necessária
  localStorage.setItem(PERMISSION_KEY, 'granted')
  return 'granted'
}

export function useFaceDownFocus() {
  const permissionState = ref<'granted' | 'denied' | 'unavailable' | 'unknown'>(
    (localStorage.getItem(PERMISSION_KEY) as any) ?? 'unknown'
  )
  const permissionError = ref(false)

  async function enable(): Promise<boolean> {
    permissionError.value = false
    const result = await requestPermission()
    permissionState.value = result

    if (result === 'granted') {
      enabled.value = true
      localStorage.setItem(ENABLED_KEY, 'true')
      startListener()
      return true
    }

    if (result === 'unavailable') {
      // Desktop sem giroscópio — habilita mas não faz nada
      enabled.value = true
      localStorage.setItem(ENABLED_KEY, 'true')
      return true
    }

    permissionError.value = true
    return false
  }

  function disable() {
    enabled.value = false
    localStorage.setItem(ENABLED_KEY, 'false')
    stopListener()
  }

  async function toggle() {
    if (enabled.value) disable()
    else await enable()
  }

  onMounted(() => {
    if (enabled.value && localStorage.getItem(PERMISSION_KEY) === 'granted') {
      startListener()
    }
  })

  onUnmounted(() => {
    // Não remove o listener global aqui — outros componentes podem usá-lo.
    // O listener só para ao chamar disable().
  })

  return {
    enabled,
    isFaceDown,
    permissionState,
    permissionError,
    needsIosPermission,
    enable,
    disable,
    toggle,
  }
}
