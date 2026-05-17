import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged as _onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  type User,
} from 'firebase/auth'
import { auth } from './firebase'

export async function login(email: string, password: string): Promise<void> {
  await setPersistence(auth, browserLocalPersistence)
  await signInWithEmailAndPassword(auth, email, password)
}

export async function logout(): Promise<void> {
  await signOut(auth)
}

export function onAuthStateChanged(callback: (user: User | null) => void): () => void {
  return _onAuthStateChanged(auth, callback)
}

export async function getAdminClaim(): Promise<boolean> {
  const user = auth.currentUser
  if (!user) return false
  const tokenResult = await user.getIdTokenResult()
  return tokenResult.claims['admin'] === true
}
