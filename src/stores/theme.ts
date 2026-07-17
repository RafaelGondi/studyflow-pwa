import { defineStore } from 'pinia'
import { ref } from 'vue'
import { applyAccentPalette, type AccentPalette } from '@rafael_dias/akoma'

const KEY = 'studyflow_theme'
const ACCENT_KEY = 'studyflow_accent'

export type AccentPreset = Extract<AccentPalette, 'teal' | 'evergreen'>

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(false)
  const accent = ref<AccentPreset>('teal')

  function init() {
    const saved = localStorage.getItem(KEY)
    if (saved) {
      isDark.value = saved === 'dark'
    } else {
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    const savedAccent = localStorage.getItem(ACCENT_KEY) as AccentPreset | null
    if (savedAccent === 'teal' || savedAccent === 'evergreen') {
      accent.value = savedAccent
    }
    apply()
  }

  function setDark(next: boolean) {
    if (isDark.value === next) return
    isDark.value = next
    localStorage.setItem(KEY, next ? 'dark' : 'light')
    apply()
  }

  function toggle() {
    setDark(!isDark.value)
  }

  function apply() {
    const root = document.documentElement
    root.dataset.mood = 'app'
    root.dataset.theme = isDark.value ? 'dark' : 'light'
    applyAccentPalette(root, accent.value)
    root.classList.toggle('dark', isDark.value)
  }

  return { isDark, accent, init, setDark, toggle }
})
