import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteField,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Game, GameRating } from '@/domain/Game'
import type { Profile } from '@/domain/Profile'

const COL = 'games'

export async function getAllGames(): Promise<Game[]> {
  const q = query(collection(db, COL), orderBy('nom'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Game)
}

export async function addGame(data: Omit<Game, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateGame(id: string, data: Partial<Omit<Game, 'id' | 'createdAt'>>): Promise<void> {
  await updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() })
}

export async function archiveGame(id: string): Promise<void> {
  await updateDoc(doc(db, COL, id), { archived: true, updatedAt: serverTimestamp() })
}

export async function updateRating(gameId: string, profile: Profile, value: number | null): Promise<void> {
  const field = `ratings.${profile}`
  if (value === null) {
    await updateDoc(doc(db, COL, gameId), {
      [field]: deleteField(),
      updatedAt: serverTimestamp(),
    })
  } else {
    const rating: GameRating = { value, updatedAt: Timestamp.now() }
    await updateDoc(doc(db, COL, gameId), {
      [field]: rating,
      updatedAt: serverTimestamp(),
    })
  }
}
