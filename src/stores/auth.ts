import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  onAuthStateChanged,
  signInAnonymously,
  type User,
} from 'firebase/auth'
import {
  auth, ensureAuth, UID_KEY,
  GoogleAuthProvider,
  linkWithPopup, signInWithPopup,
  fbSignOut,
} from '@/firebase/config'

// Flag: indica que já existe uma conta Google vinculada.
// Na próxima entrada usa signInWithPopup (sem tentar link).
const GOOGLE_LINKED_KEY = 'studyflow_google_linked'

export const useAuthStore = defineStore('auth', () => {
  const uid         = ref<string | null>(null)
  const ready       = ref(false)
  const dataLost    = ref(false)
  const signingIn   = ref(false)
  const signInError = ref<string | null>(null)

  // Refs primitivos — Vue detecta mudanças mesmo que o objeto User
  // seja a mesma referência após linkWithPopup.
  const isAnonymous = ref(true)
  const displayName = ref<string | null>(null)
  const email       = ref<string | null>(null)
  const photoURL    = ref<string | null>(null)

  function syncUser(user: User | null) {
    isAnonymous.value = user?.isAnonymous ?? true
    displayName.value = user?.displayName  ?? null
    email.value       = user?.email        ?? null
    photoURL.value    = user?.photoURL     ?? null
    if (user) uid.value = user.uid
  }

  onAuthStateChanged(auth, syncUser)

  // ── Init ──────────────────────────────────────────────────────────────────
  async function init() {
    const previousUid = localStorage.getItem(UID_KEY)
    uid.value = await ensureAuth()
    syncUser(auth.currentUser)
    ready.value = true
    if (previousUid && previousUid !== uid.value) {
      dataLost.value = true
    }
  }

  // ── Google Sign-In via Popup ───────────────────────────────────────────────
  //
  // Popup é síncrono: o resultado chega na mesma sessão, sem reload.
  // No Chrome Android abre uma nova aba (não popup bloqueável), fecha
  // sozinha ao concluir e retorna via postMessage.
  //
  // Estratégia:
  //  • Primeira vez (sem flag): linkWithPopup → mantém UID anônimo,
  //    dados do Firestore preservados automaticamente.
  //  • Vezes seguintes (com flag): signInWithPopup → login direto.
  async function signInWithGoogle() {
    signInError.value = null
    signingIn.value = true

    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })

    try {
      const alreadyLinked = localStorage.getItem(GOOGLE_LINKED_KEY) === 'true'
      let result

      if (!alreadyLinked && auth.currentUser?.isAnonymous) {
        result = await linkWithPopup(auth.currentUser, provider)
      } else {
        result = await signInWithPopup(auth, provider)
      }

      syncUser(result.user)
      localStorage.setItem(UID_KEY, result.user.uid)
      localStorage.setItem(GOOGLE_LINKED_KEY, 'true')

      // Recarrega dados do Firestore para o UID (pode ter mudado no switch)
      uid.value = result.user.uid

    } catch (err: any) {
      // Conta Google já vinculada a outro Firebase UID →
      // tenta de novo como signInWithPopup direto.
      if (err.code === 'auth/credential-already-in-use') {
        localStorage.setItem(GOOGLE_LINKED_KEY, 'true')
        try {
          const result = await signInWithPopup(auth, provider)
          syncUser(result.user)
          localStorage.setItem(UID_KEY, result.user.uid)
          uid.value = result.user.uid
        } catch (innerErr: any) {
          _handlePopupError(innerErr)
        }
      } else {
        _handlePopupError(err)
      }
    } finally {
      signingIn.value = false
    }
  }

  function _handlePopupError(err: any) {
    if (
      err.code === 'auth/popup-closed-by-user' ||
      err.code === 'auth/cancelled-popup-request'
    ) {
      // Usuário fechou — sem mensagem de erro
    } else if (err.code === 'auth/popup-blocked') {
      signInError.value = 'Popup bloqueado. Permita popups para este site e tente novamente.'
    } else {
      signInError.value = 'Erro ao fazer login. Tente novamente.'
      console.error('[StudyFlow] Google sign-in error:', err)
    }
  }

  // ── Sign out → volta para conta anônima ───────────────────────────────────
  async function signOut() {
    await fbSignOut(auth)
    localStorage.removeItem(UID_KEY)
    // Mantém GOOGLE_LINKED_KEY: na próxima entrada usa signInWithPopup direto.
    const cred = await signInAnonymously(auth)
    syncUser(cred.user)
    localStorage.setItem(UID_KEY, cred.user.uid)
  }

  function dismissDataLostWarning() { dataLost.value = false }
  function clearSignInError()       { signInError.value = null }

  return {
    uid, ready, dataLost, signingIn, signInError,
    isAnonymous, displayName, email, photoURL,
    init, signInWithGoogle, signOut,
    dismissDataLostWarning, clearSignInError,
  }
})
