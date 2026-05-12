import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
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

  // Snapshot reativo do Firebase User — atualizado via onAuthStateChanged
  const firebaseUser = ref<User | null>(null)

  const isAnonymous = computed(() => firebaseUser.value?.isAnonymous ?? true)
  const displayName = computed(() => firebaseUser.value?.displayName ?? null)
  const email       = computed(() => firebaseUser.value?.email ?? null)
  const photoURL    = computed(() => firebaseUser.value?.photoURL ?? null)

  onAuthStateChanged(auth, (user) => {
    firebaseUser.value = user
    if (user) uid.value = user.uid
  })

  // ── Init ──────────────────────────────────────────────────────────────────
  // Chamado uma vez no mount do App. Também processa o resultado de redirect
  // do Google (quando o usuário volta da página de autenticação).
  async function init() {
    // 1. Processa resultado de redirect ANTES de qualquer outra coisa.
    //    Quando vem de linkWithRedirect, o Firebase já completou o link —
    //    authStateReady() irá ver o usuário Google.
    try {
      const result = await getRedirectResult(auth)
      if (result) {
        // Redirect completou com sucesso — uid já foi atualizado pelo
        // onAuthStateChanged, mas garantimos o localStorage aqui também.
        localStorage.setItem(UID_KEY, result.user.uid)
        signingIn.value = false
      }
    } catch (err: any) {
      signingIn.value = false
      // credential-already-in-use: conta Google já existe → faz sign-in
      if (err.code === 'auth/credential-already-in-use') {
        const credential = GoogleAuthProvider.credentialFromError(err)
        if (credential) {
          try {
            const result = await signInWithCredential(auth, credential)
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
    ready.value = true

    if (previousUid && previousUid !== uid.value) {
      dataLost.value = true
    }
  }

  // ── Google Sign-In via Redirect ───────────────────────────────────────────
  // Redireciona para o Google. Quando volta, init() processa o resultado.
  // linkWithRedirect: mantém o UID anônimo → dados preservados ✓
  async function signInWithGoogle() {
    signInError.value = null
    signingIn.value = true          // persiste no localStorage via sessionStorage do Firebase

    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })

    try {
      if (auth.currentUser?.isAnonymous) {
        await linkWithRedirect(auth.currentUser, provider)
      } else {
        await signInWithRedirect(auth, provider)
      }
      // A partir daqui a página redireciona — código abaixo não executa.
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
