import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDoc, getDocs, query, where, orderBy, Timestamp, writeBatch, setDoc,
} from 'firebase/firestore'
import { db } from './config'
import type { Subject, Category, StudySession, GamificationSettings } from '@/types'

// ── Collections ──────────────────────────────────────────────────────────────

function subjectsCol(uid: string) { return collection(db, 'users', uid, 'subjects') }
function categoriesCol(uid: string) { return collection(db, 'users', uid, 'categories') }
function sessionsCol(uid: string) { return collection(db, 'users', uid, 'sessions') }
function gamificationDoc(uid: string) { return doc(db, 'users', uid, 'settings', 'gamification') }

// ── Subjects ─────────────────────────────────────────────────────────────────

export async function fetchSubjects(uid: string): Promise<Subject[]> {
  const snap = await getDocs(query(subjectsCol(uid)))
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Subject))
    .sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0))
}

export async function addSubject(uid: string, data: Omit<Subject, 'id' | 'userId' | 'createdAt'>): Promise<Subject> {
  const ref = await addDoc(subjectsCol(uid), { ...data, userId: uid, createdAt: Date.now() })
  return { id: ref.id, ...data, userId: uid, createdAt: Date.now() }
}

export async function updateSubject(uid: string, id: string, data: Partial<Subject>): Promise<void> {
  await updateDoc(doc(subjectsCol(uid), id), data)
}

export async function deleteSubject(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(subjectsCol(uid), id))
}

// ── Categories ────────────────────────────────────────────────────────────────

export async function fetchCategories(uid: string): Promise<Category[]> {
  const snap = await getDocs(query(categoriesCol(uid)))
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Category))
    .sort((a, b) => {
      if (a.order == null && b.order == null) return (a.createdAt ?? 0) - (b.createdAt ?? 0)
      if (a.order == null) return 1
      if (b.order == null) return -1
      return a.order - b.order
    })
}

export async function addCategory(uid: string, data: Omit<Category, 'id' | 'userId' | 'createdAt'>): Promise<Category> {
  const ref = await addDoc(categoriesCol(uid), { ...data, userId: uid, createdAt: Date.now() })
  return { id: ref.id, ...data, userId: uid, createdAt: Date.now() }
}

export async function updateCategory(uid: string, id: string, data: Partial<Category>): Promise<void> {
  await updateDoc(doc(categoriesCol(uid), id), data)
}

export async function reorderCategories(uid: string, orderedIds: string[]): Promise<void> {
  const batch = writeBatch(db)
  orderedIds.forEach((id, order) => {
    batch.update(doc(categoriesCol(uid), id), { order })
  })
  await batch.commit()
}

export async function deleteCategory(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(categoriesCol(uid), id))
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export async function fetchSessionsByDate(uid: string, date: string): Promise<StudySession[]> {
  const snap = await getDocs(query(sessionsCol(uid), where('date', '==', date)))
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as StudySession))
    .sort((a, b) => b.startTime - a.startTime)
}

export async function fetchSessionsByDateRange(uid: string, from: string, to: string): Promise<StudySession[]> {
  const snap = await getDocs(
    query(sessionsCol(uid), where('date', '>=', from), where('date', '<=', to), orderBy('date', 'desc'))
  )
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as StudySession))
}

export async function fetchSessionsBySubject(uid: string, subjectId: string): Promise<StudySession[]> {
  const snap = await getDocs(query(sessionsCol(uid), where('subjectId', '==', subjectId)))
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as StudySession))
    .sort((a, b) => b.startTime - a.startTime)
}

export async function updateSession(uid: string, id: string, data: Partial<StudySession>): Promise<void> {
  await updateDoc(doc(sessionsCol(uid), id), data)
}

export async function saveSession(uid: string, data: Omit<StudySession, 'id' | 'userId'>): Promise<StudySession> {
  const ref = await addDoc(sessionsCol(uid), { ...data, userId: uid })
  return { id: ref.id, ...data, userId: uid }
}

export async function deleteSession(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(sessionsCol(uid), id))
}
export async function fetchRewardedSessions(uid: string): Promise<StudySession[]> {
  const snap = await getDocs(query(sessionsCol(uid)))
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as StudySession))
    .filter(session => (session.coinsEarned ?? 0) > 0)
    .sort((a, b) => b.endTime - a.endTime)
}


export async function fetchGamificationSettings(uid: string): Promise<GamificationSettings | null> {
  const snap = await getDoc(gamificationDoc(uid))
  return snap.exists() ? snap.data() as GamificationSettings : null
}

export async function saveGamificationSettings(
  uid: string,
  settings: GamificationSettings,
): Promise<void> {
  await setDoc(gamificationDoc(uid), settings, { merge: true })
}
