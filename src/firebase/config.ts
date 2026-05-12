import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth'

// Substitua com as credenciais do seu projeto Firebase
// Firebase Console > Project Settings > Your Apps > SDK setup and configuration
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

export async function ensureAuth(): Promise<string> {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe()
      if (user) {
        resolve(user.uid)
      } else {
        try {
          const cred = await signInAnonymously(auth)
          resolve(cred.user.uid)
        } catch (e) {
          reject(e)
        }
      }
    })
  })
}
