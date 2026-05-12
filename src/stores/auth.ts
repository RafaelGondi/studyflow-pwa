import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  onAuthStateChanged,
  signInAnonymously,
  type User,
} from 'firebase/auth'
import {
  auth, ensureAuth, UID_KEY,
  GoogleAuthProvider, linkWithPopup, signInWithCredential,
  signInWithPopup, fbSignOut,
} from '@/firebase/config'

export type AuthError = 'popup-blocked' | 'popup-closed' | 'unknown'

export const useAuthStore = defineStore('auth', () => {
  const uid         = ref<string | null>(null)
  const ready       = ref(false)
  const dataLost    = ref(false)
  const signingIn   = ref(false)
  const signInError = ref<AuthError | null>(null)

  // Snapshot reativo do Firebase User — atualizado pelo onAuthStateChanged
  const firebaseUser = ref<User | null>(null)

  const isAnonymous = computed(() => firebaseUser.value?.isAnonymous ?? true)
  const displayName = computed(() => firebaseUser.value?.displayName ?? null)
  const email       = computed(() => firebaseUser.value?.email ?? null)
  const photoURL    = computed(() => firebaseUser.value?.photoURL ?? null)

  // Mantém firebaseUser sincronizado com o estado real do Firebase Auth
  onAuthStateChanged(auth, (user) => {
    firebaseUser.value = user
    if (user) uid.value = user.uid
  })

  // ── Init ──────────────────────────────────────────────────────────────────
  async function init() {
    const previousUid = localStorage.getItem(UID_KEY)
    uid.value = await ensureAuth()
    ready.value = true
    if (previousUid && previousUid !== uid.value) {
      dataLost.value = true
    }
  }

  // ── Google Sign-In ────────────────────────────────────────────────────────
  // 1. Usuário anônimo → linkWithPopup → UID NÃO muda, dados preservados ✓
  // 2. Conta Google já existe → credential-already-in-use → signIn com a
  //    credencial retornada no erro (troca de conta, UID muda)
  // 3. Já tem conta Google → signInWithPopup normal
  async function signInWithGoogle(): Promise<'linked' | 'switched' | 'noop'> {
    signInError.value = null
    signingIn.value = true

    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })

    try {
      if (auth.currentUser?.isAnonymous) {
        try {
          const result = await linkWithPopup(auth.currentUser, provider)
          uid.value = result.user.uid
          localStorage.setItem(UID_KEY, result.user.uid)
          return 'linked'
        } catch (linkErr: any) {
          if (linkErr.code === 'auth/credential-already-in-use') {
            const credential = GoogleAuthProvider.credentialFromError(linkErr)
            if (!credential) throw linkErr
            const result = await signInWithCredential(auth, credential)
            uid.value = result.user.uid
            localStorage.setItem(UID_KEY, result.user.uid)
            return 'switched'
          }
          throw linkErr
        }
      } else {
        const result = await signInWithPopup(auth, provider)
        uid.value = result.user.uid
        localStorage.setItem(UID_KEY, result.user.uid)
        return 'noop'
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-blocked') {
        signInError.value = 'popup-blocked'
      } else if (
        err.code === 'auth/popup-closed-by-user' ||
        err.code === 'auth/cancelled-popup-request'
      ) {
        signInError.value = 'popup-closed'
      } else {
        signInError.value = 'unknown'
        console.error('[StudyFlow] Google sign-in error:', err)
      }
      return 'noop'
    } finally {
      signingIn.value = false
    }
  }

  // ── Sign out → volta para conta anônima ───────────────────────────────────
  async function signOut() {
    await fbSignOut(auth)
    localStorage.removeItem(UID_KEY)
    const cred = await signInAnonymously(auth)
    uid.value = cred.user.uid
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
