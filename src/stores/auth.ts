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
  linkWithRedirect, signInWithRedirect, getRedirectResult,
  signInWithCredential,
  fbSignOut,
} from '@/firebase/config'

export const useAuthStore = defineStore('auth', () => {
  const uid         = ref<string | null>(null)
  const ready       = ref(false)
  const dataLost    = ref(false)
  const signingIn   = ref(false)
  const signInError = ref<string | null>(null)

  // Refs primitivos — Vue detecta mudanças mesmo que o objeto User
  // seja a mesma referência (o que acontece após linkWithRedirect).
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

  // Mantém os refs em sincronia quando o Firebase muda o estado de auth
  // (login, logout, token refresh, etc.)
  onAuthStateChanged(auth, syncUser)

  // ── Init ──────────────────────────────────────────────────────────────────
  async function init() {
    // 1. Processa resultado de redirect (retorno do Google).
    try {
      const result = await getRedirectResult(auth)
      if (result) {
        syncUser(result.user)
        localStorage.setItem(UID_KEY, result.user.uid)
        signingIn.value = false
      }
    } catch (err: any) {
      signingIn.value = false
      if (err.code === 'auth/credential-already-in-use') {
        // Conta Google já existe no Firebase → faz sign-in com a credencial
        const credential = GoogleAuthProvider.credentialFromError(err)
        if (credential) {
          try {
            const result = await signInWithCredential(auth, credential)
            syncUser(result.user)
            localStorage.setItem(UID_KEY, result.user.uid)
          } catch (e) {
            console.error('[StudyFlow] credential sign-in error:', e)
            signInError.value = 'Não foi possível completar o login. Tente novamente.'
          }
        }
      } else if (
        err.code !== 'auth/popup-closed-by-user' &&
        err.code !== 'auth/cancelled-popup-request'
      ) {
        console.error('[StudyFlow] getRedirectResult error:', err)
        signInError.value = 'Erro ao finalizar login com Google.'
      }
    }

    // 2. Garante que existe um usuário (anônimo ou Google).
    const previousUid = localStorage.getItem(UID_KEY)
    uid.value = await ensureAuth()

    // 3. Sync explícito após authStateReady — garante que os refs refletem
    //    o estado final mesmo se onAuthStateChanged chegou antes do sync.
    syncUser(auth.currentUser)

    ready.value = true

    if (previousUid && previousUid !== uid.value) {
      dataLost.value = true
    }
  }

  // ── Google Sign-In via Redirect ───────────────────────────────────────────
  async function signInWithGoogle() {
    signInError.value = null
    signingIn.value = true

    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })

    try {
      if (auth.currentUser?.isAnonymous) {
        await linkWithRedirect(auth.currentUser, provider)
      } else {
        await signInWithRedirect(auth, provider)
      }
      // Página redireciona — código abaixo não executa.
    } catch (err: any) {
      signingIn.value = false
      signInError.value = 'Erro ao iniciar login. Tente novamente.'
      console.error('[StudyFlow] signInWithGoogle error:', err)
    }
  }

  // ── Sign out → volta para conta anônima ───────────────────────────────────
  async function signOut() {
    await fbSignOut(auth)
    localStorage.removeItem(UID_KEY)
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
