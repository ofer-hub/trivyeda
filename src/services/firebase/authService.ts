import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from './config';

export async function ensureSignedIn(): Promise<User> {
  if (auth.currentUser) return auth.currentUser;
  const { user } = await signInAnonymously(auth);
  return user;
}

export function onAuthChange(callback: (uid: string | null) => void): () => void {
  return onAuthStateChanged(auth, (user) => callback(user?.uid ?? null));
}
