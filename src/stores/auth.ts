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
  fbSignOut,
} from '@/firebase/config'

// Indica que o usuário já vinculou uma conta Google com sucesso ao menos
// uma vez. Nas próximas entradas usa signInWithRedirect (sem link).
const GOOGLE_LINKED_KEY = 'studyflow_google_linked'

export const useAuthStore = defineStore('auth', () => {
  const uid         = ref<string | null>(null)
  const ready       = ref(false)
  const dataLost    = ref(false)
  const signingIn   = ref(false)
  const signInError = ref<string | null>(null)

  // Refs primitivos — Vue detecta mudanças mesmo que o objeto User
  // seja a mesma referência após linkWithRedirect.
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
    // Processa resultado do redirect do Google (se houver).
    try {
      const result = await getRedirectResult(auth)
      if (result) {
        syncUser(result.user)
        localStorage.setItem(UID_KEY, result.user.uid)
        // Marca que já existe uma conta Google vinculada.
        localStorage.setItem(GOOGLE_LINKED_KEY, 'true')
        signingIn.value = false
      }
    } catch (err: any) {
      signingIn.value = false
      // credential-already-in-use: a conta Google já existe no Firebase
      // e o link foi negado. Marca a flag para que a próxima tentativa
      // use signInWithRedirect em vez de linkWithRedirect.
      if (err.code === 'auth/credential-already-in-use') {
        localStorage.setItem(GOOGLE_LINKED_KEY, 'true')
        signInError.value = 'Esta conta Google já existe. Tente entrar novamente.'
      } else if (
        err.code !== 'auth/popup-closed-by-user' &&
        err.code !== 'auth/cancelled-popup-request'
      ) {
        console.error('[StudyFlow] getRedirectResult error:', err)
        signInError.value = 'Erro ao finalizar login com Google.'
      }
    }

    // Garante que existe um usuário (anônimo ou Google).
    const previousUid = localStorage.getItem(UID_KEY)
    uid.value = await ensureAuth()

    // Sync explícito — garante que os refs refletem o estado final
    // independente da ordem dos callbacks do Firebase.
    syncUser(auth.currentUser)

    ready.value = true

    if (previousUid && previousUid !== uid.value) {
      dataLost.value = true
    }
  }

  // ── Google Sign-In via Redirect ───────────────────────────────────────────
  //
  // Estratégia:
  //  • Primeira vez (sem flag): linkWithRedirect → mantém UID anônimo,
  //    dados do Firestore preservados automaticamente.
  //  • Vezes seguintes (com flag): signInWithRedirect → login direto,
  //    evita o erro credential-already-in-use do link.
  async function signInWithGoogle() {
    signInError.value = null
    signingIn.value = true

    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })

    try {
      const alreadyLinked = localStorage.getItem(GOOGLE_LINKED_KEY) === 'true'

      if (!alreadyLinked && auth.currentUser?.isAnonymous) {
        // Primeira vez: tenta vincular para preservar dados anônimos.
        await linkWithRedirect(auth.currentUser, provider)
      } else {
        // Já vinculou antes (ou não é anônimo): login direto.
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
    // Mantém GOOGLE_LINKED_KEY — na próxima entrada usa signInWithRedirect.
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
