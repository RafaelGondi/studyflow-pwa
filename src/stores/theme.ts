import { defineStore } from 'pinia'
import { ref } from 'vue'

const KEY = 'studyflow_theme'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(true)

  function init() {
    const saved = localStorage.getItem(KEY)
    if (saved) {
      isDark.value = saved === 'dark'
    } else {
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    apply()
  }

  function toggle() {
    isDark.value = !isDark.value
    localStorage.setItem(KEY, isDark.value ? 'dark' : 'light')
    apply()
  }

  function apply() {
    document.documentElement.dataset.mood = 'app'
    document.documentElement.dataset.theme = isDark.value ? 'dark' : 'light'
    document.documentElement.classList.toggle('dark', isDark.value)
  }

  return { isDark, init, toggle }
})
