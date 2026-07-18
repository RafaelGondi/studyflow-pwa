import { defineStore } from 'pinia'
import { ref } from 'vue'
import { applyAccentPalette, type AccentPalette } from '@rafael_dias/akoma'

const KEY = 'studyflow_theme'
const ACCENT: Extract<AccentPalette, 'slate'> = 'slate'

const THEME_COLORS = {
  light: '#f9f9f7',
  dark: '#1d211f',
} as const

function applyThemeColor(isDark: boolean) {
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    'content',
    THEME_COLORS[isDark ? 'dark' : 'light'],
  )
}

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(false)

  function init() {
    const saved = localStorage.getItem(KEY)
    if (saved) {
      isDark.value = saved === 'dark'
    } else {
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
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
    applyAccentPalette(root, ACCENT)
    root.classList.toggle('dark', isDark.value)
    applyThemeColor(isDark.value)
  }

  return { isDark, init, setDark, toggle }
})
