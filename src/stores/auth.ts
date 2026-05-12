import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ensureAuth } from '@/firebase/config'

export const useAuthStore = defineStore('auth', () => {
  const uid = ref<string | null>(null)
  const ready = ref(false)

  async function init() {
    uid.value = await ensureAuth()
    ready.value = true
  }

  return { uid, ready, init }
})
