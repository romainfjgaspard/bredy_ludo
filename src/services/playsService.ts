import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Play } from '@/domain/Play'

const COL = 'plays'

export async function getAllPlays(): Promise<Play[]> {
  const q = query(collection(db, COL), orderBy('playedAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Play)
}

export async function getPlaysByGame(gameId: string): Promise<Play[]> {
  const q = query(
    collection(db, COL),
    where('gameId', '==', gameId),
    orderBy('playedAt', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Play)
}

export async function addPlay(play: Omit<Play, 'id' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    ...play,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function deletePlay(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id))
}
