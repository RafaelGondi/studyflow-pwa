import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import {
  getAuth,
  signInAnonymously,
  signOut as fbSignOut,
  GoogleAuthProvider,
  linkWithRedirect,
  signInWithRedirect,
  getRedirectResult,
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyC_Q_J2dD9b0rweBSejCDhmk8P8w0aSUjY',
  authDomain: 'studyflow-42125.firebaseapp.com',
  projectId: 'studyflow-42125',
  storageBucket: 'studyflow-42125.firebasestorage.app',
  messagingSenderId: '679228698074',
  appId: '1:679228698074:web:1517aba55810eb9ea524e3',
  measurementId: 'G-9H7F05B8LB',
}

export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
export {
  GoogleAuthProvider,
  linkWithRedirect, signInWithRedirect, getRedirectResult,
  fbSignOut,
}

// Chave local que âncora o UID entre reloads e updates de SW.
export const UID_KEY = 'studyflow_uid'

export async function ensureAuth(): Promise<string> {
  // authStateReady() aguarda o Firebase terminar de restaurar a sessão
  // do localStorage/IndexedDB — elimina race condition do onAuthStateChanged.
  await auth.authStateReady()

  if (auth.currentUser) {
    localStorage.setItem(UID_KEY, auth.currentUser.uid)
    return auth.currentUser.uid
  }

  // Nenhum usuário encontrado — cria conta anônima.
  const previousUid = localStorage.getItem(UID_KEY)
  const cred = await signInAnonymously(auth)
  const newUid = cred.user.uid

  if (previousUid && previousUid !== newUid) {
    console.warn(
      '[StudyFlow] Novo usuário anônimo criado — dados anteriores perdidos.\n' +
      `  UID anterior : ${previousUid}\n  UID novo     : ${newUid}`
    )
  }

  localStorage.setItem(UID_KEY, newUid)
  return newUid
}
